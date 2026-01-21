/**
 * Workflow Analytics Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  Schedule as ScheduleIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import { getWorkflowAnalytics, analyzeWorkflow } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowAnalyticsPage() {
  const searchParams = useSearchParams()
  const workflowId = searchParams.get('workflowId')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(workflowId || '')
  const [timeRangeDays, setTimeRangeDays] = useState<number>(30)
  const [analytics, setAnalytics] = useState<any>(null)
  const [optimization, setOptimization] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])

  useEffect(() => {
    loadWorkflows()
  }, [])

  useEffect(() => {
    if (selectedWorkflowId) {
      loadAnalytics()
      loadOptimization()
    }
  }, [selectedWorkflowId, timeRangeDays])

  const loadWorkflows = async () => {
    try {
      const data = await listWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  const loadAnalytics = async () => {
    if (!selectedWorkflowId) return
    try {
      setLoading(true)
      const data = await getWorkflowAnalytics(selectedWorkflowId, timeRangeDays)
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOptimization = async () => {
    if (!selectedWorkflowId) return
    try {
      const data = await analyzeWorkflow(selectedWorkflowId)
      setOptimization(data)
    } catch (error) {
      console.error('Failed to load optimization:', error)
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Workflow Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Workflow</InputLabel>
            <Select
              value={selectedWorkflowId}
              label="Workflow"
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
            >
              {workflows.map((wf) => (
                <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                  {wf.name || wf.workflow_id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRangeDays}
              label="Time Range"
              onChange={(e) => setTimeRangeDays(e.target.value as number)}
            >
              <MenuItem value={7}>Last 7 days</MenuItem>
              <MenuItem value={30}>Last 30 days</MenuItem>
              <MenuItem value={90}>Last 90 days</MenuItem>
              <MenuItem value={365}>Last year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {!selectedWorkflowId ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Select a workflow to view analytics
          </Typography>
        </Paper>
      ) : analytics ? (
        <Grid container spacing={2}>
          {/* Key Metrics */}
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Total Executions
                  </Typography>
                </Box>
                <Typography variant="h4">{analytics.total_executions || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <SuccessIcon sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Success Rate
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {analytics.success_rate ? `${(analytics.success_rate * 100).toFixed(1)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimerIcon sx={{ mr: 1, color: 'warning.main' }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Avg Execution Time
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {analytics.avg_execution_time_ms
                    ? `${(analytics.avg_execution_time_ms / 1000).toFixed(2)}s`
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ErrorIcon sx={{ mr: 1, color: 'error.main' }} />
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Error Rate
                  </Typography>
                </Box>
                <Typography variant="h4">
                  {analytics.error_rate ? `${(analytics.error_rate * 100).toFixed(1)}%` : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Optimization Recommendations */}
          {optimization && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Optimization Recommendations
                </Typography>
                {optimization.recommendations && optimization.recommendations.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {optimization.recommendations.map((rec: any, index: number) => (
                      <Card key={index} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                            <Chip
                              label={rec.severity || 'info'}
                              size="small"
                              color={rec.severity === 'high' ? 'error' : rec.severity === 'medium' ? 'warning' : 'default'}
                            />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {rec.type || 'Recommendation'}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                {rec.description || rec.message}
                              </Typography>
                              {rec.impact && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                                  Impact: {rec.impact}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No optimization recommendations available
                  </Typography>
                )}
              </Paper>
            </Grid>
          )}

          {/* Performance Metrics */}
          {analytics.performance_metrics && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Performance Metrics
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Metric</TableCell>
                        <TableCell align="right">Value</TableCell>
                        <TableCell align="right">Unit</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(analytics.performance_metrics).map(([key, value]: [string, any]) => (
                        <TableRow key={key}>
                          <TableCell>{key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</TableCell>
                          <TableCell align="right">{typeof value === 'number' ? value.toFixed(2) : value}</TableCell>
                          <TableCell align="right">-</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Loading analytics...
          </Typography>
        </Paper>
      )}
    </Box>
  )
}
