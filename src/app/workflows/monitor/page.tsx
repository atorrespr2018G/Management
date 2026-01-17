/**
 * Workflow Execution Monitor Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
} from '@mui/icons-material'
import WorkflowGraphEditor from '@/components/Workflow/WorkflowGraphEditor'
import { getExecutionStatus, getWorkflowDefinition, cancelWorkflowExecution } from '@/services/workflowApi'
import { useWorkflowExecution } from '@/hooks/useWorkflowExecution'
import type { ExecutionStatusResponse, WorkflowDefinition } from '@/types/workflow'

export default function WorkflowMonitorPage() {
  const searchParams = useSearchParams()
  const runId = searchParams.get('runId')
  const [tabValue, setTabValue] = useState(0)
  const [status, setStatus] = useState<ExecutionStatusResponse | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (runId) {
      loadStatus()
      loadWorkflow()
      // Poll for status updates if running
      const interval = setInterval(() => {
        if (status?.status === 'running') {
          loadStatus()
        }
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [runId, status?.status])

  const loadStatus = async () => {
    if (!runId) return
    try {
      const data = await getExecutionStatus(runId)
      setStatus(data)
    } catch (error) {
      console.error('Failed to load status:', error)
    }
  }

  const loadWorkflow = async () => {
    try {
      const data = await getWorkflowDefinition()
      setWorkflow(data)
    } catch (error) {
      console.error('Failed to load workflow:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!runId) return
    try {
      await cancelWorkflowExecution(runId)
      loadStatus()
    } catch (error) {
      console.error('Failed to cancel execution:', error)
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'running':
        return 'info'
      case 'paused':
        return 'warning'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            Workflow Execution Monitor
          </Typography>
          {runId && (
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
              Run ID: {runId}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {status?.status === 'running' && (
            <>
              <Button variant="outlined" startIcon={<PauseIcon />}>
                Pause
              </Button>
              <Button variant="outlined" color="error" startIcon={<StopIcon />} onClick={handleCancel}>
                Cancel
              </Button>
            </>
          )}
          {status && (
            <Chip
              label={status.status}
              color={getStatusColor(status.status)}
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </Box>

      {/* Progress */}
      {status?.status === 'running' && status.progress !== undefined && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress variant="determinate" value={status.progress} sx={{ height: 8, borderRadius: 1 }} />
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
            Progress: {status.progress}%
          </Typography>
        </Box>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Execution Graph" />
          <Tab label="State" />
          <Tab label="Logs" />
          <Tab label="Metrics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {tabValue === 0 && (
          <Box sx={{ height: '100%', border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <WorkflowGraphEditor workflow={workflow} readOnly={true} />
          </Box>
        )}

        {tabValue === 1 && (
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Workflow State
            </Typography>
            {status?.state ? (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>State Data</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <pre style={{ fontSize: '0.875rem', overflow: 'auto' }}>
                    {JSON.stringify(status.state, null, 2)}
                  </pre>
                </AccordionDetails>
              </Accordion>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No state data available
              </Typography>
            )}
          </Paper>
        )}

        {tabValue === 2 && (
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Execution Logs
            </Typography>
            {status?.logs && status.logs.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {status.logs.map((log, index) => (
                  <Paper key={index} sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                      <Chip label={log.level} size="small" />
                      {log.node_id && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {log.node_id}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                        {new Date(log.timestamp * 1000).toLocaleString()}
                      </Typography>
                    </Box>
                    <Typography variant="body2">{log.message}</Typography>
                  </Paper>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No logs available
              </Typography>
            )}
          </Paper>
        )}

        {tabValue === 3 && (
          <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Execution Metrics
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Metrics will be displayed here
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  )
}
