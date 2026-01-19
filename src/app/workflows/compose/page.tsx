/**
 * Workflow Composer Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as ComposeIcon,
  AccountTree as ComposeWorkflowIcon,
} from '@mui/icons-material'
import { composeWorkflows } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store/store'
import { setWorkflow } from '@/store/slices/workflowSlice'

export default function WorkflowComposerPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([])
  const [composeStrategy, setComposeStrategy] = useState<'sequential' | 'parallel' | 'conditional'>('sequential')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const data = await listWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  const handleAddWorkflow = (workflowId: string) => {
    if (!selectedWorkflows.includes(workflowId)) {
      setSelectedWorkflows([...selectedWorkflows, workflowId])
    }
  }

  const handleRemoveWorkflow = (workflowId: string) => {
    setSelectedWorkflows(selectedWorkflows.filter((id) => id !== workflowId))
  }

  const handleCompose = async () => {
    if (selectedWorkflows.length < 2) {
      setSnackbar({ open: true, message: 'Select at least 2 workflows to compose', severity: 'error' })
      return
    }

    try {
      setLoading(true)
      const result = await composeWorkflows(selectedWorkflows, composeStrategy)
      dispatch(setWorkflow(result.composed_workflow))
      setSnackbar({
        open: true,
        message: `Successfully composed ${selectedWorkflows.length} workflows`,
        severity: 'success',
      })
      router.push('/workflows/builder')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to compose workflows', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getWorkflowName = (workflowId: string) => {
    return workflows.find((w) => w.workflow_id === workflowId)?.name || workflowId
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <ComposeWorkflowIcon sx={{ mr: 1 }} />
          Workflow Composer
        </Typography>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Select Workflows
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Add Workflow</InputLabel>
              <Select
                value=""
                label="Add Workflow"
                onChange={(e) => handleAddWorkflow(e.target.value)}
                renderValue={() => 'Select a workflow...'}
              >
                {workflows
                  .filter((wf) => !selectedWorkflows.includes(wf.workflow_id))
                  .map((wf) => (
                    <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                      {wf.name || wf.workflow_id}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Selected Workflows ({selectedWorkflows.length})
            </Typography>
            {selectedWorkflows.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 2 }}>
                No workflows selected. Add workflows to compose them together.
              </Typography>
            ) : (
              <List>
                {selectedWorkflows.map((workflowId, index) => (
                  <ListItem
                    key={workflowId}
                    secondaryAction={
                      <IconButton edge="end" onClick={() => handleRemoveWorkflow(workflowId)}>
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={`${index + 1}. ${getWorkflowName(workflowId)}`}
                      secondary={workflowId}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Composition Strategy
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Strategy</InputLabel>
              <Select
                value={composeStrategy}
                label="Strategy"
                onChange={(e) => setComposeStrategy(e.target.value as 'sequential' | 'parallel' | 'conditional')}
              >
                <MenuItem value="sequential">Sequential</MenuItem>
                <MenuItem value="parallel">Parallel</MenuItem>
                <MenuItem value="conditional">Conditional</MenuItem>
              </Select>
            </FormControl>

            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Strategy Description
                </Typography>
                {composeStrategy === 'sequential' && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Workflows execute one after another in order. The output of one workflow becomes the input of the
                    next.
                  </Typography>
                )}
                {composeStrategy === 'parallel' && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Workflows execute simultaneously. Results are merged at the end.
                  </Typography>
                )}
                {composeStrategy === 'conditional' && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Workflows execute based on conditions. Only workflows matching the conditions will run.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Button
              variant="contained"
              fullWidth
              startIcon={<ComposeIcon />}
              onClick={handleCompose}
              disabled={selectedWorkflows.length < 2 || loading}
              size="large"
            >
              {loading ? 'Composing...' : 'Compose Workflows'}
            </Button>
          </Paper>
        </Grid>
      </Grid>

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
