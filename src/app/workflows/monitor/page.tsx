/**
 * Workflow Execution Monitor Page
 */

'use client'

import React, { useState, useEffect, Suspense } from 'react'
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
import { getExecutionStatus, getWorkflowDefinition, cancelWorkflowExecution, getWorkflowMetrics } from '@/services/workflowApi'
import type { ExecutionStatusResponse, WorkflowDefinition, WorkflowMetrics } from '@/types/workflow'

function WorkflowMonitorContent() {
  const searchParams = useSearchParams()
  const runId = searchParams.get('runId')
  const [tabValue, setTabValue] = useState(0)
  const [status, setStatus] = useState<ExecutionStatusResponse | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowDefinition | null>(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<WorkflowMetrics | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [eventSource, setEventSource] = useState<EventSource | null>(null)

  useEffect(() => {
    if (runId) {
      loadStatus()
      loadWorkflow()
      loadMetrics()
      loadEvents()
    } else {
      setLoading(false)
    }
  }, [runId])

  // Set up real-time monitoring when status becomes running
  useEffect(() => {
    if (!runId || status?.status !== 'running') {
      // Close existing event source if status is not running
      if (eventSource) {
        eventSource.close()
        setEventSource(null)
      }
      return
    }

    // Set up Server-Sent Events for real-time monitoring
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'
    const eventStream = new EventSource(`${apiBaseUrl}/api/v1/workflows/monitor/stream/${runId}`)
    
    eventStream.onmessage = (event) => {
      try {
        const eventData = JSON.parse(event.data)
        setEvents((prev) => [...prev, eventData].slice(-100)) // Keep last 100 events
        // Update status if event indicates status change
        if (eventData.type === 'workflow_completed' || eventData.type === 'workflow_failed') {
          loadStatus()
        }
      } catch (error) {
        console.error('Failed to parse event:', error)
      }
    }
    
    eventStream.onerror = (error) => {
      console.error('EventSource error:', error)
      eventStream.close()
      setEventSource(null)
    }
    
    setEventSource(eventStream)
    
    return () => {
      eventStream.close()
      setEventSource(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, status?.status])

  // Polling fallback for status updates
  useEffect(() => {
    if (!runId) return
    
    const interval = setInterval(() => {
      if (status?.status === 'running') {
        loadStatus()
        loadMetrics()
      }
    }, 2000)
    
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadMetrics = async () => {
    if (!runId) return
    try {
      const data = await getWorkflowMetrics(runId)
      setMetrics(data)
    } catch (error) {
      // Metrics might not be available yet
      console.debug('Metrics not available:', error)
    }
  }

  const loadEvents = async () => {
    if (!runId) return
    try {
      // Events are loaded via EventSource in the useEffect
      // This function can be used for initial load if needed
      // For now, we'll rely on EventSource for real-time events
    } catch (error) {
      console.error('Failed to load events:', error)
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

  if (!runId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Workflow Execution Monitor</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No run ID provided. Please select an execution from the workflow list.
        </Typography>
      </Box>
    )
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Execution Logs & Events
              </Typography>
              {eventSource && (
                <Chip label="Live" color="success" size="small" />
              )}
            </Box>
            {(status?.logs && status.logs.length > 0) || events.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* Show real-time events first */}
                {events.map((log, index) => (
                  <Paper key={`event-${index}`} sx={{ p: 1, bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                      <Chip label={log.level || 'info'} size="small" color={log.level === 'error' ? 'error' : 'default'} />
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
                {/* Show status logs if available */}
                {status?.logs && status.logs.map((log, index) => (
                  <Paper key={`log-${index}`} sx={{ p: 1, bgcolor: 'grey.50' }}>
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
            {metrics ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {metrics.execution_time_ms && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Execution Time
                    </Typography>
                    <Typography variant="body1">
                      {(metrics.execution_time_ms / 1000).toFixed(2)}s
                    </Typography>
                  </Box>
                )}
                {metrics.total_nodes && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Total Nodes Executed
                    </Typography>
                    <Typography variant="body1">{metrics.total_nodes}</Typography>
                  </Box>
                )}
                {metrics.cache_hits !== undefined && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Cache Performance
                    </Typography>
                    <Typography variant="body1">
                      Hits: {metrics.cache_hits} | Misses: {metrics.cache_misses || 0}
                    </Typography>
                  </Box>
                )}
                {metrics.retries !== undefined && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      Retries
                    </Typography>
                    <Typography variant="body1">{metrics.retries}</Typography>
                  </Box>
                )}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Full Metrics
                  </Typography>
                  <pre style={{ fontSize: '0.875rem', overflow: 'auto', background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                    {JSON.stringify(metrics, null, 2)}
                  </pre>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Metrics not available yet. They will appear once the execution completes.
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </Box>
  )
}

export default function WorkflowMonitorPage() {
  return (
    <Suspense fallback={
      <Box sx={{ p: 2 }}>
        <Typography>Loading...</Typography>
      </Box>
    }>
      <WorkflowMonitorContent />
    </Suspense>
  )
}
