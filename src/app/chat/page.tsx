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
import { fetchSessions, createSession, loadSession, addMessage, setActiveSession, deleteSession } from '@/store/slices/chatSlice'
import { ChatSidebar } from '@/components/Chat/ChatSidebar'
import { truncateChatTitle } from '@/utils/formatters'
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog'
// import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog'

export default function ChatPage() {
  const dispatch = useDispatch<AppDispatch>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const agentDataRef = useRef<HTMLDivElement>(null)

  // Redux State
  const { activeSessionId, activeSessionMessages, sessions, isLoading } = useSelector((state: RootState) => state.chat)
  const { currentUser } = useSelector((state: RootState) => state.user)

  // useEffect(() => {
  //   dispatch(initSimulatedUser())
  // }, [dispatch])

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

  // Scroll page to top when component mounts
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

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

  const handleNewChat = () => {
    const userId = localStorage.getItem('simulated_user_id')
    if (userId) {
      dispatch(createSession(userId))
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

  const handleDeleteSession = (sessionId: string) => {
    setSessionToDelete(sessionId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteSession = async () => {
    if (sessionToDelete) {
      const userId = localStorage.getItem('simulated_user_id')
      if (userId) {
        await dispatch(deleteSession({ sessionId: sessionToDelete, userId }))
        if (sessions.length <= 1) {
          // Optional: auto-create new session
        }
      }
      setDeleteDialogOpen(false)
      setSessionToDelete(null)
    }
  }

  const cancelDeleteSession = () => {
    setDeleteDialogOpen(false)
    setSessionToDelete(null)
  }

  // const latestAssistantMessage = activeSessionMessages.filter(m => m.role === 'assistant').slice(-1)[0]
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
      onDeleteSession={handleDeleteSession}
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
                    }}
                  >
                    <CircularProgress size={20} />
                  </Box>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Ask a question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isSending}
                  inputRef={inputRef}
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
                      bgcolor: 'action.disabledBackground',
                      color: 'action.disabled',
                    },
                    width: 56,
                    height: 56,
                    borderRadius: 2,
                  }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Agent Data Panel (Desktop) */}
          <Paper
            elevation={3}
            sx={{
              flex: '0 0 350px',
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Agent Data
              </Typography>
            </Box>
            <Box
              ref={agentDataRef}
              sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}
            >
              {latestAssistantMessage?.sources && latestAssistantMessage.sources.length > 0 ? (
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Sources Used
                  </Typography>
                  {allFilePaths.map((path, idx) => (
                    <Chip
                      key={idx}
                      label={path.split('/').pop()}
                      size="small"
                      sx={{ mr: 1, mb: 1 }}
                      variant="outlined"
                    />
                  ))}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Context Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    The agent found {latestAssistantMessage.sources.length} relevant chunks of information across {allFilePaths.length} files.
                    The response was synthesized based on these sources with a similarity score threshold of 0.5.
                  </Typography>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                  No agent data available for the current response.
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Container>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={cancelDeleteSession}
        onConfirm={confirmDeleteSession}
        title="Delete Chat Session"
        content="Are you sure you want to delete this chat session? This action cannot be undone."
      />
    </Box>
  )
}


