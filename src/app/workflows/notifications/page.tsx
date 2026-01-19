/**
 * Workflow Notifications Page
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
  Chip,
} from '@mui/material'
import {
  Notifications as NotificationIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { addNotificationRule } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowNotificationsPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Notification rule state
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [ruleId, setRuleId] = useState('')
  const [ruleName, setRuleName] = useState('')
  const [eventType, setEventType] = useState('')
  const [ruleWorkflowId, setRuleWorkflowId] = useState('')
  const [channels, setChannels] = useState<string[]>([])
  const [recipients, setRecipients] = useState<string[]>([])

  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])

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

  const handleAddNotificationRule = async () => {
    try {
      await addNotificationRule(
        ruleId,
        ruleName,
        eventType,
        ruleWorkflowId || undefined,
        channels.length > 0 ? channels : undefined,
        recipients.length > 0 ? recipients : undefined
      )
      setRuleDialogOpen(false)
      setSnackbar({ open: true, message: 'Notification rule added successfully', severity: 'success' })
      setRuleId('')
      setRuleName('')
      setEventType('')
      setRuleWorkflowId('')
      setChannels([])
      setRecipients([])
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to add notification rule', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <NotificationIcon sx={{ mr: 1 }} />
          Workflow Notifications
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRuleDialogOpen(true)}>
          Add Notification Rule
        </Button>
      </Box>

      <Paper sx={{ flex: 1, p: 2 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Configure notification rules to receive alerts when workflow events occur. Notifications can be sent
              through various channels to specified recipients.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Create notification rules to stay informed about workflow executions, failures, and important events.
            </Typography>
          </CardContent>
        </Card>
      </Paper>

      {/* Add Notification Rule Dialog */}
      <Dialog open={ruleDialogOpen} onClose={() => setRuleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Notification Rule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Rule ID"
              value={ruleId}
              onChange={(e) => setRuleId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Rule Name"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Workflow (optional)</InputLabel>
              <Select
                value={ruleWorkflowId}
                label="Workflow (optional)"
                onChange={(e) => setRuleWorkflowId(e.target.value)}
              >
                <MenuItem value="">All Workflows</MenuItem>
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Event Type</InputLabel>
              <Select value={eventType} label="Event Type" onChange={(e) => setEventType(e.target.value)}>
                <MenuItem value="workflow.started">Workflow Started</MenuItem>
                <MenuItem value="workflow.completed">Workflow Completed</MenuItem>
                <MenuItem value="workflow.failed">Workflow Failed</MenuItem>
                <MenuItem value="node.started">Node Started</MenuItem>
                <MenuItem value="node.completed">Node Completed</MenuItem>
                <MenuItem value="node.failed">Node Failed</MenuItem>
                <MenuItem value="execution.timeout">Execution Timeout</MenuItem>
                <MenuItem value="execution.error">Execution Error</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Channels</InputLabel>
              <Select
                multiple
                value={channels}
                label="Channels"
                onChange={(e) => setChannels(e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="email">Email</MenuItem>
                <MenuItem value="slack">Slack</MenuItem>
                <MenuItem value="webhook">Webhook</MenuItem>
                <MenuItem value="sms">SMS</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Recipients (comma-separated)"
              value={recipients.join(', ')}
              onChange={(e) => setRecipients(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              fullWidth
              placeholder="user@example.com, user2@example.com"
              helperText="Enter recipient addresses separated by commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRuleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddNotificationRule}
            variant="contained"
            disabled={!ruleId || !ruleName || !eventType}
          >
            Add Rule
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
