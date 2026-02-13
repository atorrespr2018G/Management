/**
 * Workflow List/History Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as DuplicateIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import {
  getExecutionHistory,
  listWorkflows,
  getActiveWorkflow,
  getWorkflowDefinition,
  saveWorkflowDefinition,
} from '@/services/workflowApi'
import type { WorkflowExecution, ExecutionStatus } from '@/types/workflow'

export default function WorkflowsPage() {
  const router = useRouter()
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [savedWorkflows, setSavedWorkflows] = useState<Array<{ workflow_id: string; name: string; description?: string; is_active?: boolean }>>([])
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<ExecutionStatus | 'all'>('all')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)

  useEffect(() => {
    loadExecutions()
    loadSavedWorkflows()
    loadActiveWorkflow()
  }, [])

  const loadExecutions = async () => {
    try {
      setLoading(true)
      const data = await getExecutionHistory(100)
      setExecutions(data)
    } catch (error: any) {
      console.error('Failed to load executions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSavedWorkflows = async () => {
    try {
      const workflows = await listWorkflows()
      setSavedWorkflows(workflows)
    } catch (error: any) {
      console.error('Failed to load saved workflows:', error)
    }
  }

  const loadActiveWorkflow = async () => {
    try {
      const active = await getActiveWorkflow()
      if (active && 'workflow_id' in active) {
        setActiveWorkflowId((active as any).workflow_id)
      }
    } catch (error: any) {
      // No active workflow is fine
      console.debug('No active workflow found')
    }
  }

  const getStatusColor = (status: ExecutionStatus) => {
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

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, execution: WorkflowExecution) => {
    setAnchorEl(event.currentTarget)
    setSelectedExecution(execution)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedExecution(null)
  }

  const handleDuplicateExecution = async () => {
    if (!selectedExecution) {
      handleMenuClose()
      return
    }

    const workflowId = selectedExecution.workflow_id
    if (!workflowId) {
      console.error('Cannot duplicate execution: workflow_id is missing on execution record')
      handleMenuClose()
      return
    }

    try {
      setLoading(true)
      // Fetch original workflow definition
      const original = await getWorkflowDefinition(undefined, workflowId)

      // Remove workflow_id so backend creates a new one
      const { workflow_id: _omit, ...rest } = original as any
      const baseName = original.name || 'Untitled Workflow'
      const copyName = `${baseName} (Copy)`

      const result = await saveWorkflowDefinition(
        {
          ...rest,
          name: copyName,
          is_active: false,
        },
        copyName,
        false
      )

      const newWorkflowId = (result as any).workflow_id
      if (newWorkflowId) {
        router.push(`/workflows/builder?workflowId=${newWorkflowId}`)
      } else {
        // Fallback: go to builder without ID
        router.push('/workflows/builder')
      }
    } catch (error) {
      console.error('Failed to duplicate workflow from execution:', error)
    } finally {
      handleMenuClose()
      setLoading(false)
    }
  }

  const filteredExecutions = executions.filter((exec) => {
    const matchesSearch =
      exec.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exec.run_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || exec.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Workflow Executions
        </Typography>
      </Box>

      {/* Saved Workflows Section */}
      {savedWorkflows.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6">Saved Workflows</Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => router.push('/workflows/builder')}
            >
              Create New
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {savedWorkflows.map((wf) => (
              <Chip
                key={wf.workflow_id}
                label={wf.name || wf.workflow_id}
                onClick={() => router.push(`/workflows/builder?workflowId=${wf.workflow_id}`)}
                color={wf.is_active || wf.workflow_id === activeWorkflowId ? 'success' : 'default'}
                variant={wf.is_active || wf.workflow_id === activeWorkflowId ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          placeholder="Search executions..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 400 }}
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value as ExecutionStatus | 'all')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="running">Running</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
        {activeWorkflowId && (
          <Chip
            label={`Active: '${savedWorkflows.find(w => w.workflow_id === activeWorkflowId)?.name || 'Unknown'}'`}
            color="success"
            size="small"
            sx={{ ml: 'auto' }}
          />
        )}
      </Box>

      {/* Executions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Run ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Goal</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Execution Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredExecutions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No executions found
                </TableCell>
              </TableRow>
            ) : (
              filteredExecutions.map((execution) => (
                <TableRow key={execution.run_id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {execution.run_id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{execution.goal.substring(0, 50)}...</TableCell>
                  <TableCell>
                    <Chip
                      label={execution.status}
                      size="small"
                      color={getStatusColor(execution.status)}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {execution.execution_time_ms
                      ? `${(execution.execution_time_ms / 1000).toFixed(2)}s`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(execution.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, execution)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Actions Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            if (selectedExecution) {
              router.push(`/workflows/monitor?runId=${selectedExecution.run_id}`)
            }
            handleMenuClose()
          }}
        >
          <ViewIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedExecution) {
              // Prefer workflow_id if available
              if (selectedExecution.workflow_id) {
                router.push(`/workflows/builder?workflowId=${selectedExecution.workflow_id}`)
              } else {
                console.error('Selected execution has no workflow_id; cannot open builder for edit')
              }
            }
            handleMenuClose()
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Workflow
        </MenuItem>
        <MenuItem onClick={handleDuplicateExecution}>
          <DuplicateIcon sx={{ mr: 1, fontSize: 20 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  )
}
