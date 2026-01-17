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
import { getExecutionHistory } from '@/services/workflowApi'
import type { WorkflowExecution, ExecutionStatus } from '@/types/workflow'

export default function WorkflowsPage() {
  const router = useRouter()
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null)

  useEffect(() => {
    loadExecutions()
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

  const filteredExecutions = executions.filter((exec) =>
    exec.goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exec.run_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Workflow Executions
        </Typography>
        <Button
          variant="contained"
          onClick={() => router.push('/workflows/builder')}
          sx={{ textTransform: 'none' }}
        >
          Create New Workflow
        </Button>
      </Box>

      {/* Search and Filters */}
      <Box sx={{ mb: 2 }}>
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
              router.push(`/workflows/builder?workflowId=${selectedExecution.run_id}`)
            }
            handleMenuClose()
          }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Workflow
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
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
