/**
 * Test Tool Dialog - Test/execute code-defined tools with parameters
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import { testTool, type Tool, type TestToolResponse } from '@/services/toolsApi'

interface TestToolDialogProps {
  open: boolean
  onClose: () => void
  tool: Tool | null
}

export default function TestToolDialog({ open, onClose, tool }: TestToolDialogProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({})
  const [result, setResult] = useState<TestToolResponse | null>(null)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Extract parameter schema from tool spec
  const parameterSchema = tool?.spec
    ? (tool.spec as Record<string, unknown>)?.parameters || {}
    : {}
  const properties = (parameterSchema as Record<string, unknown>)?.properties || {}
  const required = (parameterSchema as Record<string, unknown>)?.required || []

  useEffect(() => {
    if (open && tool) {
      // Reset state when dialog opens
      setParameters({})
      setResult(null)
      setError(null)
      setTesting(false)
      
      // Initialize parameters with empty strings
      const initialParams: Record<string, string> = {}
      Object.keys(properties).forEach((key) => {
        initialParams[key] = ''
      })
      setParameters(initialParams)
    }
  }, [open, tool, properties])

  const handleParameterChange = (key: string, value: string) => {
    setParameters((prev) => ({ ...prev, [key]: value }))
  }

  const parseParameterValue = (value: string, type: string): unknown => {
    if (!value.trim()) {
      return value
    }
    
    try {
      if (type === 'integer' || type === 'number') {
        return type === 'integer' ? parseInt(value, 10) : parseFloat(value)
      }
      if (type === 'boolean') {
        return value.toLowerCase() === 'true'
      }
      if (type === 'object' || type === 'array') {
        return JSON.parse(value)
      }
      return value
    } catch {
      return value
    }
  }

  const handleTest = async () => {
    if (!tool) return

    setError(null)
    setResult(null)
    setTesting(true)

    try {
      // Build parameters object with proper types
      const params: Record<string, unknown> = {}
      Object.entries(parameters).forEach(([key, value]) => {
        const prop = properties[key] as Record<string, unknown> | undefined
        const type = prop?.type as string | undefined || 'string'
        params[key] = parseParameterValue(value, type)
      })

      const response = await testTool(tool.id, { parameters: params })
      setResult(response)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to test tool')
    } finally {
      setTesting(false)
    }
  }

  const handleClose = () => {
    setParameters({})
    setResult(null)
    setError(null)
    setTesting(false)
    onClose()
  }

  if (!tool) {
    return null
  }

  const canTest = tool.source === 'code'

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Test Tool: {tool.name}
        {tool.source && (
          <Chip
            label={tool.source}
            size="small"
            color={tool.source === 'code' ? 'primary' : 'default'}
            sx={{ ml: 1 }}
          />
        )}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {!canTest && (
          <Alert severity="info">
            Tool testing is only available for code-defined tools (source: code).
            This tool has source: {tool.source || 'unknown'}
          </Alert>
        )}

        {tool.description && (
          <Typography variant="body2" color="text.secondary">
            {tool.description}
          </Typography>
        )}

        {canTest && (
          <>
            <Divider />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Parameters
            </Typography>

            {Object.keys(properties).length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                This tool has no parameters.
              </Typography>
            ) : (
              Object.entries(properties).map(([key, prop]) => {
                const propObj = prop as Record<string, unknown>
                const type = (propObj.type as string) || 'string'
                const description = propObj.description as string | undefined
                const isRequired = required.includes(key)

                return (
                  <TextField
                    key={key}
                    label={
                      <>
                        {key}
                        {isRequired && <span style={{ color: 'red' }}> *</span>}
                        {type && <span style={{ color: 'gray', fontSize: '0.75rem', marginLeft: '4px' }}>({type})</span>}
                      </>
                    }
                    value={parameters[key] || ''}
                    onChange={(e) => handleParameterChange(key, e.target.value)}
                    size="small"
                    fullWidth
                    required={isRequired}
                    helperText={description || `Type: ${type}`}
                    placeholder={
                      type === 'object' || type === 'array'
                        ? 'Enter valid JSON'
                        : `Enter ${type} value`
                    }
                    multiline={type === 'object' || type === 'array'}
                    rows={type === 'object' || type === 'array' ? 3 : 1}
                  />
                )
              })
            )}

            {error && (
              <Alert severity="error">{error}</Alert>
            )}

            {result && (
              <>
                <Divider />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Result
                </Typography>
                {result.success ? (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'success.light',
                      borderRadius: 1,
                      maxHeight: 400,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                      }}
                    >
                      {typeof result.result === 'string'
                        ? result.result
                        : JSON.stringify(result.result, null, 2)}
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="error">
                    {result.error || 'Tool execution failed'}
                  </Alert>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        {canTest && (
          <Button
            variant="contained"
            startIcon={testing ? <CircularProgress size={16} /> : <PlayArrowIcon />}
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Tool'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
