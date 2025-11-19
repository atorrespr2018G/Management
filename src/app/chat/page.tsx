'use client'

import React, { useState, useRef, useEffect } from 'react'
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
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import { sendMessage, type ChatResponse, type Source } from '@/services/chatApi'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const query = inputValue.trim()
    if (!query || isLoading) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response: ChatResponse = await sendMessage(query, conversationId)
      
      // Update conversation ID if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id)
      }

      // Add assistant message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to get response'}`,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Chat
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Ask questions about your documents stored in Neo4j
        </Typography>
      </Box>

      <Paper
        elevation={3}
        sx={{
          flexGrow: 1,
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
          {messages.length === 0 && (
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

          {messages.map((message) => (
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
                              {source.hybrid_score !== null && source.hybrid_score !== undefined && (
                                <Chip
                                  label={`Score: ${source.hybrid_score.toFixed(2)}`}
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
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))}

          {isLoading && (
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
              disabled={isLoading}
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
              disabled={!inputValue.trim() || isLoading}
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
    </Container>
  )
}

