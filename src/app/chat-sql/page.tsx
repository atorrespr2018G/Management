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
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PersonIcon from '@mui/icons-material/Person'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import DataObjectIcon from '@mui/icons-material/DataObject'
import CodeIcon from '@mui/icons-material/Code'
import { generateSQL, type SQLGenerationResponse } from '@/services/sqlChatApi'
import { getDatabaseConfigs, type DatabaseConfig, executeSQL, type ExecuteSQLResponse } from '@/services/neo4jApi'

interface SQLMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sql?: string | null
  explanation?: string
  confidence?: number
  schema_slice?: SQLGenerationResponse['schema_slice']
  error?: string
  execution_result?: ExecuteSQLResponse
  timestamp: Date
}

export default function ChatSQLPage() {
  const [messages, setMessages] = useState<SQLMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDatabase, setSelectedDatabase] = useState<string>('')
  const [databases, setDatabases] = useState<DatabaseConfig[]>([])
  const [loadingDatabases, setLoadingDatabases] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load databases on mount
  useEffect(() => {
    const loadDatabases = async () => {
      try {
        setLoadingDatabases(true)
        const dbList = await getDatabaseConfigs()
        setDatabases(dbList)
        if (dbList.length > 0 && !selectedDatabase) {
          setSelectedDatabase(dbList[0].id)
        }
      } catch (error) {
        console.error('Failed to load databases:', error)
      } finally {
        setLoadingDatabases(false)
      }
    }
    loadDatabases()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    const query = inputValue.trim()
    if (!query || isLoading || !selectedDatabase) return

    // Add user message
    const userMessage: SQLMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      const response: SQLGenerationResponse = await generateSQL(
        query,
        selectedDatabase,
        10,
        0.7
      )

      // If SQL was generated, execute it
      let executionResult: ExecuteSQLResponse | undefined = undefined
      if (response.sql && !response.error) {
        try {
          executionResult = await executeSQL(selectedDatabase, response.sql)
        } catch (execError) {
          executionResult = {
            success: false,
            error: execError instanceof Error ? execError.message : 'Failed to execute SQL'
          }
        }
      }

      // Add assistant message
      const assistantMessage: SQLMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.explanation || 'SQL generated successfully',
        sql: response.sql,
        explanation: response.explanation,
        confidence: response.confidence,
        schema_slice: response.schema_slice,
        error: response.error,
        execution_result: executionResult,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: SQLMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to generate SQL'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
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

  const selectedDatabaseConfig = databases.find((db) => db.id === selectedDatabase)

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: 'calc(100vh - 128px)', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Chat SQL
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Generate SQL queries from natural language using your database schema
        </Typography>
      </Box>

      {/* Database Selection */}
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth size="small" sx={{ maxWidth: 400 }}>
          <InputLabel>Select Database</InputLabel>
          <Select
            value={selectedDatabase}
            label="Select Database"
            onChange={(e) => setSelectedDatabase(e.target.value)}
            disabled={loadingDatabases || isLoading}
          >
            {databases.map((db) => (
              <MenuItem key={db.id} value={db.id}>
                {db.name} ({db.databaseType})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {!selectedDatabase && databases.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please select a database to start generating SQL queries.
        </Alert>
      )}

      {databases.length === 0 && !loadingDatabases && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No databases configured. Please configure a database first in Repositories &gt; Database.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
        {/* Chat Window - Left Side */}
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
                <DataObjectIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6">Start generating SQL</Typography>
                <Typography variant="body2">Ask a question about your database</Typography>
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
                    width: '100%',
                  }}
                >
                  {message.role === 'assistant' && message.error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {message.error}
                    </Alert>
                  )}

                  {message.role === 'assistant' && message.sql && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <CodeIcon sx={{ fontSize: 20 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Generated SQL
                        </Typography>
                      </Box>
                      <Paper
                        sx={{
                          p: 2,
                          bgcolor: 'grey.900',
                          color: 'grey.100',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          overflowX: 'auto',
                          borderRadius: 1,
                        }}
                      >
                        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                          {message.sql}
                        </pre>
                      </Paper>
                    </Box>
                  )}

                  {message.role === 'assistant' && message.confidence !== undefined && (
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={`Confidence: ${(message.confidence * 100).toFixed(1)}%`}
                        size="small"
                        color={message.confidence > 0.7 ? 'success' : message.confidence > 0.5 ? 'warning' : 'error'}
                        sx={{ mb: 1 }}
                      />
                    </Box>
                  )}

                  {/* Execution Results */}
                  {message.role === 'assistant' && message.execution_result && (
                    <Box sx={{ mb: 2 }}>
                      {message.execution_result.success ? (
                        <>
                          {message.execution_result.query_type === 'SELECT' && message.execution_result.data?.rows && (
                            <Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  Query Results
                                </Typography>
                                {message.execution_result.data.row_count !== undefined && (
                                  <Chip
                                    label={`${message.execution_result.data.row_count} row(s)`}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                <Table size="small" stickyHeader>
                                  <TableHead>
                                    <TableRow>
                                      {message.execution_result.data.columns?.map((col, idx) => (
                                        <TableCell key={idx} sx={{ fontWeight: 600, bgcolor: 'grey.100' }}>
                                          {col}
                                        </TableCell>
                                      ))}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {message.execution_result.data.rows?.map((row, rowIdx) => (
                                      <TableRow key={rowIdx}>
                                        {message.execution_result.data.columns?.map((col, colIdx) => (
                                          <TableCell key={colIdx}>
                                            {row[col] !== null && row[col] !== undefined
                                              ? String(row[col])
                                              : 'NULL'}
                                          </TableCell>
                                        ))}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            </Box>
                          )}
                          {message.execution_result.query_type === 'DML' && message.execution_result.data?.message && (
                            <Alert severity="success" sx={{ mt: 1 }}>
                              {message.execution_result.data.message}
                            </Alert>
                          )}
                        </>
                      ) : (
                        <Alert severity="error" sx={{ mt: 1 }}>
                          Execution Error: {message.execution_result.error || 'Unknown error'}
                        </Alert>
                      )}
                    </Box>
                  )}

                  {message.content && (
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        mb: message.schema_slice ? 2 : 0,
                      }}
                    >
                      {message.content}
                    </Typography>
                  )}

                  {message.role === 'assistant' && message.schema_slice && message.schema_slice.tables && message.schema_slice.tables.length > 0 && (
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
                            Schema Used ({message.schema_slice.tables.length} table{message.schema_slice.tables.length !== 1 ? 's' : ''})
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ px: 0, pt: 1 }}>
                          {message.schema_slice.tables.map((table, idx) => (
                            <Box key={idx} sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                {table.name}
                              </Typography>
                              {table.description && (
                                <Typography variant="caption" sx={{ color: message.role === 'user' ? 'rgba(255,255,255,0.8)' : 'text.secondary', display: 'block', mb: 1 }}>
                                  {table.description}
                                </Typography>
                              )}
                              {table.columns && table.columns.length > 0 && (
                                <Box sx={{ mt: 1 }}>
                                  {table.columns.map((col, colIdx) => (
                                    <Chip
                                      key={colIdx}
                                      label={`${col.name} (${col.data_type})`}
                                      size="small"
                                      sx={{
                                        mr: 0.5,
                                        mb: 0.5,
                                        bgcolor: message.role === 'user' ? 'rgba(255,255,255,0.2)' : 'grey.200',
                                        color: message.role === 'user' ? 'white' : 'inherit',
                                      }}
                                    />
                                  ))}
                                </Box>
                              )}
                              {idx < message.schema_slice.tables.length - 1 && <Divider sx={{ mt: 2, opacity: 0.3 }} />}
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
                    Generating SQL...
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
                placeholder={selectedDatabase ? "Ask a question about your database..." : "Select a database first..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || !selectedDatabase}
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
                disabled={!inputValue.trim() || isLoading || !selectedDatabase}
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

        {/* Database Info Card - Right Side */}
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
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Database Information
            </Typography>
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
            }}
          >
            {selectedDatabaseConfig ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Name
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedDatabaseConfig.name}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Type
                  </Typography>
                  <Chip label={selectedDatabaseConfig.databaseType} size="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Host
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {selectedDatabaseConfig.host}:{selectedDatabaseConfig.port}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Database
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {selectedDatabaseConfig.databaseName}
                  </Typography>
                </Box>
                {selectedDatabaseConfig.description && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDatabaseConfig.description}
                    </Typography>
                  </Box>
                )}
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
                <Typography variant="body2">No database selected</Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
