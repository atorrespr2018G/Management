'use client'

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import {
  Box,
  Container,
  Paper,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Avatar,
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import MenuIcon from '@mui/icons-material/Menu'
import { sendMessage, updateSessionTitle } from '@/services/chatApi'
import { ChatMessage, ChatResponse, Source } from '@/types/chat'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store/store'
import { initSimulatedUser } from '@/store/slices/userSlice'
import { fetchSessions, createSession, loadSession, addMessage, setActiveSession } from '@/store/slices/chatSlice'
import { ChatSidebar } from '@/components/Chat/ChatSidebar'
import { truncateChatTitle } from '@/utils/formatters'

export default function ChatPage() {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const agentDataRef = useRef<HTMLDivElement>(null)

  // Redux State
  const { activeSessionId, activeSessionMessages, sessions, isLoading } = useSelector((state: RootState) => state.chat)
  const { currentUser } = useSelector((state: RootState) => state.user)
  // We use localStorage directly for the simulated ID for now, or we could select it if we stored it in Redux state properly
  // For simplicity, let's grab it from localStorage wrapper or just rely on the fact that initSimulatedUser ensures it exists

  useEffect(() => {
    dispatch(initSimulatedUser())
  }, [dispatch])

  // Fetch sessions when we have a user ID (simulated)
  useEffect(() => {
    const userId = localStorage.getItem('simulated_user_id')
    if (userId) {
      dispatch(fetchSessions(userId))
    }
  }, [dispatch])

  // Load the most recent session if we have sessions but no active one
  useEffect(() => {
    const userId = localStorage.getItem('simulated_user_id') || ''
    if (userId && !isLoading && sessions.length > 0 && !activeSessionId) {
      // Load the most recent session
      dispatch(loadSession({ sessionId: sessions[0].id, userId }))
    }
  }, [dispatch, isLoading, sessions.length, activeSessionId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Scroll page to top when component mounts
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeSessionMessages])

  const latestAssistantMessage = activeSessionMessages.filter(m => m.role === 'assistant').slice(-1)[0]

  useEffect(() => {
    if (agentDataRef.current && latestAssistantMessage) {
      agentDataRef.current.scrollTop = 0
    }
  }, [latestAssistantMessage])

  const handleSend = async () => {
    const query = inputValue.trim()
    if (!query || isSending) return

    const userId = localStorage.getItem('simulated_user_id')
    if (!userId) return

    // If no active session, create one first
    let currentSessionId = activeSessionId
    if (!currentSessionId) {
      const newSession = await dispatch(createSession(userId)).unwrap()
      currentSessionId = newSession.id
    }

    // Add user message optimistically
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
    }
    dispatch(addMessage(userMessage))
    setInputValue('')
    setIsSending(true)

    try {
      const response: ChatResponse = await sendMessage(query, currentSessionId!, userId)

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(assistantMessage))

      // Update session title if it's the first message (or title is "New Chat")
      // We check activeSessionMessages length before adding the new ones, but here we already added user message
      // So if length is 2 (user + assistant) it might be the first exchange. 
      // Better: check if current session title is "New Chat"
      const currentSession = sessions.find(s => s.id === currentSessionId)
      if (currentSession && currentSession.title === 'New Chat') {
        const newTitle = truncateChatTitle(query)
        await updateSessionTitle(currentSessionId!, newTitle, userId)
      }

      // Refresh sessions list to update preview/order
      dispatch(fetchSessions(userId))
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(errorMessage))
    } finally {
      setIsSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = async () => {
    const userId = localStorage.getItem('simulated_user_id')
    if (userId) {
      await dispatch(createSession(userId))
      if (isMobile) setMobileOpen(false)
    }
  }

  const handleSelectSession = (sessionId: string) => {
    const userId = localStorage.getItem('simulated_user_id')
    if (userId) {
      dispatch(loadSession({ sessionId, userId }))
      if (isMobile) setMobileOpen(false)
    }
  }

  const allFilePaths = latestAssistantMessage?.sources
    ?.map(s => s.file_path)
    .filter((path): path is string => path !== null && path !== undefined && path.trim() !== '')
    .filter((path, index, self) => self.indexOf(path) === index) || []

  const sidebarContent = (
    <ChatSidebar
      sessions={sessions}
      activeSessionId={activeSessionId}
      onNewChat={handleNewChat}
      onSelectSession={handleSelectSession}
    />
  )

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Desktop Sidebar */}
      <Box sx={{ display: { xs: 'none', md: 'block' }, height: '100%' }}>
        {sidebarContent}
      </Box>

      {/* Main Chat Area */}
      <Container maxWidth="xl" sx={{ py: 2, height: '100%', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              Chat
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask questions about your documents stored in Neo4j
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
          {/* Chat Window */}
          <Paper
            elevation={3}
            sx={{
              flex: '1 1 60%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            {/* Messages Area */}
            <Box
              sx={{
                flexGrow: 1,
                overflowY: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              {activeSessionMessages.length === 0 && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                  }}
                >
                  <SmartToyIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6">Start a conversation</Typography>
                  <Typography variant="body2">Ask a question to get started</Typography>
                </Box>
              )}

              {activeSessionMessages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                      width: 40,
                      height: 40,
                    }}
                  >
                    {message.role === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                      p: 2,
                      borderRadius: 2,
                      boxShadow: 1,
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.content}
                    </Typography>
                    {message.sources && message.sources.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Accordion
                          sx={{
                            bgcolor: 'transparent',
                            boxShadow: 'none',
                            '&:before': { display: 'none' },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMoreIcon sx={{ color: message.role === 'user' ? 'white' : 'inherit' }} />}
                            sx={{ px: 0, minHeight: 'auto' }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                              }}
                            >
                              {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails sx={{ px: 0, pt: 1 }}>
                            {message.sources.map((source, idx) => (
                              <Box key={idx} sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                  {source.file_name && (
                                    <Chip
                                      label={source.file_name}
                                      size="small"
                                      sx={{
                                        bgcolor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : 'grey.200',
                                        color: message.role === 'user' ? 'white' : 'inherit',
                                      }}
                                    />
                                  )}
                                  {source.similarity !== null && source.similarity !== undefined && (
                                    <Chip
                                      label={`Similarity: ${(source.similarity * 100).toFixed(1)}%`}
                                      size="small"
                                      sx={{
                                        bgcolor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : 'grey.200',
                                        color: message.role === 'user' ? 'white' : 'inherit',
                                      }}
                                    />
                                  )}
                                </Box>
                                {source.text && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    {source.text}
                                  </Typography>
                                )}
                                {idx < message.sources!.length - 1 && (
                                  <Divider sx={{ mt: 1, opacity: 0.3 }} />
                                )}
                              </Box>
                            ))}
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        mt: 1,
                        opacity: 0.7,
                        color: message.role === 'user' ? 'rgba(255,255,255,0.7)' : 'text.secondary',
                      }}
                    >
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {isSending && (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 2,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'secondary.main',
                      width: 40,
                      height: 40,
                    }}
                  >
                    <SmartToyIcon />
                  </Avatar>
                  <Box
                    sx={{
                      bgcolor: 'grey.100',
                      p: 2,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <CircularProgress size={20} />
                    <Typography variant="body2" color="text.secondary">
                      Thinking...
                    </Typography>
                  </Box>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Box>

            <Divider />

            {/* Input Area */}
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSend}
                  disabled={!inputValue.trim() || isSending}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'grey.300',
                      color: 'grey.500',
                    },
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Agent Data Card - Right Side */}
          <Paper
            elevation={3}
            sx={{
              flex: '1 1 40%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            {/* Upper Section - Agent Data */}
            <Box
              ref={agentDataRef}
              sx={{
                flex: '1 1 50%',
                overflowY: 'auto',
                p: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Agent Data
              </Typography>
              {latestAssistantMessage && latestAssistantMessage.sources && latestAssistantMessage.sources.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {latestAssistantMessage.sources.map((source, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200',
                      }}
                    >
                      {source.file_name && (
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {source.file_name}
                        </Typography>
                      )}
                      {source.directory_name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Directory: {source.directory_name}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {source.similarity !== null && source.similarity !== undefined && (
                          <Chip
                            label={`Similarity: ${(source.similarity * 100).toFixed(1)}%`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                        {source.hybrid_score !== null && source.hybrid_score !== undefined && (
                          <Chip
                            label={`Score: ${source.hybrid_score.toFixed(2)}`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      {source.text && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                            fontStyle: 'italic',
                            mt: 1,
                            mb: 1,
                            maxHeight: 100,
                            overflow: 'auto',
                          }}
                        >
                          {source.text}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="body2">No agent data available</Typography>
                </Box>
              )}
            </Box>

            {/* Bottom Section - File Paths */}
            <Box
              sx={{
                flex: '1 1 50%',
                overflowY: 'auto',
                p: 2,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                File Paths
                {allFilePaths.length > 0 && (
                  <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary', fontWeight: 400 }}>
                    ({allFilePaths.length} {allFilePaths.length === 1 ? 'file' : 'files'})
                  </Typography>
                )}
              </Typography>
              {allFilePaths.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {allFilePaths.map((path, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        p: 1.5,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'grey.200',
                        '&:hover': {
                          bgcolor: 'grey.100',
                          borderColor: 'grey.300',
                        },
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          wordBreak: 'break-all',
                          color: 'text.primary',
                          lineHeight: 1.6,
                        }}
                      >
                        {path}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'text.secondary',
                  }}
                >
                  <Typography variant="body2">No file paths available</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  )
}
