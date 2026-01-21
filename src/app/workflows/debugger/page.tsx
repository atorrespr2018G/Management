/**
 * Workflow Debugger Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  BugReport as DebuggerIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { addBreakpoint, getTraces } from '@/services/workflowApi'

export default function WorkflowDebuggerPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [breakpointDialogOpen, setBreakpointDialogOpen] = useState(false)
  const [breakpointId, setBreakpointId] = useState('')
  const [breakpointType, setBreakpointType] = useState('')
  const [breakpointNodeId, setBreakpointNodeId] = useState('')
  const [breakpointCondition, setBreakpointCondition] = useState('')

  const [traces, setTraces] = useState<Array<{ trace_id: string; node_id: string; event_type: string; timestamp: string }>>([])
  const [traceNodeId, setTraceNodeId] = useState('')
  const [traceEventType, setTraceEventType] = useState('')

  useEffect(() => {
    loadTraces()
  }, [])

  const loadTraces = async () => {
    try {
      const data = await getTraces(traceNodeId || undefined, traceEventType || undefined)
      setTraces(data)
    } catch (error) {
      console.error('Failed to load traces:', error)
    }
  }

  const handleAddBreakpoint = async () => {
    try {
      await addBreakpoint(
        breakpointId,
        breakpointType,
        breakpointNodeId || undefined,
        breakpointCondition || undefined
      )
      setBreakpointDialogOpen(false)
      setSnackbar({ open: true, message: 'Breakpoint added successfully', severity: 'success' })
      setBreakpointId('')
      setBreakpointType('')
      setBreakpointNodeId('')
      setBreakpointCondition('')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to add breakpoint', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <DebuggerIcon sx={{ mr: 1 }} />
          Workflow Debugger
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBreakpointDialogOpen(true)}>
          Add Breakpoint
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Breakpoints
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Set breakpoints to pause workflow execution at specific nodes or conditions for debugging.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Debug Traces
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              View execution traces to understand workflow behavior and identify issues.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Traces Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Node ID (optional)"
            value={traceNodeId}
            onChange={(e) => setTraceNodeId(e.target.value)}
            size="small"
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Event Type (optional)</InputLabel>
            <Select
              value={traceEventType}
              label="Event Type (optional)"
              onChange={(e) => setTraceEventType(e.target.value)}
            >
              <MenuItem value="">All Events</MenuItem>
              <MenuItem value="node.started">Node Started</MenuItem>
              <MenuItem value="node.completed">Node Completed</MenuItem>
              <MenuItem value="node.failed">Node Failed</MenuItem>
              <MenuItem value="workflow.started">Workflow Started</MenuItem>
              <MenuItem value="workflow.completed">Workflow Completed</MenuItem>
              <MenuItem value="workflow.failed">Workflow Failed</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadTraces}>
            Refresh Traces
          </Button>
        </Box>
      </Paper>

      {/* Traces Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Trace ID</TableCell>
              <TableCell>Node ID</TableCell>
              <TableCell>Event Type</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {traces.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No traces found. Traces will appear here when workflows are executed with debugging enabled.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              traces.map((trace) => (
                <TableRow key={trace.trace_id}>
                  <TableCell>{trace.trace_id}</TableCell>
                  <TableCell>{trace.node_id || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={trace.event_type} size="small" />
                  </TableCell>
                  <TableCell>{new Date(trace.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Breakpoint Dialog */}
      <Dialog open={breakpointDialogOpen} onClose={() => setBreakpointDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Breakpoint</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Breakpoint ID"
              value={breakpointId}
              onChange={(e) => setBreakpointId(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={breakpointType}
                label="Type"
                onChange={(e) => setBreakpointType(e.target.value)}
              >
                <MenuItem value="node">Node</MenuItem>
                <MenuItem value="condition">Condition</MenuItem>
                <MenuItem value="error">Error</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Node ID (optional)"
              value={breakpointNodeId}
              onChange={(e) => setBreakpointNodeId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Condition (optional)"
              value={breakpointCondition}
              onChange={(e) => setBreakpointCondition(e.target.value)}
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., state.result > 100"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBreakpointDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBreakpoint} variant="contained" disabled={!breakpointId || !breakpointType}>
            Add Breakpoint
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
