/**
 * Workflow Integrations Page
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
  Tabs,
  Tab,
} from '@mui/material'
import {
  Webhook as WebhookIcon,
  Event as EventIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { createWebhook, subscribeToEvents } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function WorkflowIntegrationsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Webhook state
  const [webhookDialogOpen, setWebhookDialogOpen] = useState(false)
  const [webhookId, setWebhookId] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])
  const [webhookWorkflowId, setWebhookWorkflowId] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')

  // Event subscription state
  const [eventDialogOpen, setEventDialogOpen] = useState(false)
  const [subscriptionId, setSubscriptionId] = useState('')
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [eventWorkflowId, setEventWorkflowId] = useState('')
  const [callbackUrl, setCallbackUrl] = useState('')

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

  const handleCreateWebhook = async () => {
    try {
      await createWebhook(
        webhookId,
        webhookUrl,
        'POST',
        webhookWorkflowId || undefined
      )
      setWebhookDialogOpen(false)
      setSnackbar({ open: true, message: 'Webhook created successfully', severity: 'success' })
      setWebhookId('')
      setWebhookUrl('')
      setWebhookWorkflowId('')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to create webhook', severity: 'error' })
    }
  }

  const handleSubscribeToEvents = async () => {
    try {
      await subscribeToEvents(
        subscriptionId,
        eventType,
        eventWorkflowId || undefined,
        webhookUrl || undefined
      )
      setEventDialogOpen(false)
      setSnackbar({ open: true, message: 'Event subscription created successfully', severity: 'success' })
      setSubscriptionId('')
      setEventType('')
      setEventWorkflowId('')
      setWebhookUrl('')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to subscribe to events', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <WebhookIcon sx={{ mr: 1 }} />
          Workflow Integrations
        </Typography>
      </Box>

      <Paper sx={{ flex: 1 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Webhooks" icon={<WebhookIcon />} iconPosition="start" />
          <Tab label="Event Subscriptions" icon={<EventIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setWebhookDialogOpen(true)}>
              Create Webhook
            </Button>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Webhooks allow external systems to receive notifications when workflow events occur. Configure webhooks
                to integrate with external services.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEventDialogOpen(true)}>
              Subscribe to Events
            </Button>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Event subscriptions allow you to listen to specific workflow events and trigger callbacks. Subscribe
                to events to build reactive integrations.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Create Webhook Dialog */}
      <Dialog open={webhookDialogOpen} onClose={() => setWebhookDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Webhook</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Webhook ID"
              value={webhookId}
              onChange={(e) => setWebhookId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Webhook URL"
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              fullWidth
              required
              placeholder="https://example.com/webhook"
            />
            <FormControl fullWidth>
              <InputLabel>Workflow (optional)</InputLabel>
              <Select
                value={webhookWorkflowId}
                label="Workflow (optional)"
                onChange={(e) => setWebhookWorkflowId(e.target.value)}
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
              <InputLabel>Events</InputLabel>
              <Select
                multiple
                value={webhookEvents}
                label="Events"
                onChange={(e) => setWebhookEvents(e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="workflow.started">Workflow Started</MenuItem>
                <MenuItem value="workflow.completed">Workflow Completed</MenuItem>
                <MenuItem value="workflow.failed">Workflow Failed</MenuItem>
                <MenuItem value="node.started">Node Started</MenuItem>
                <MenuItem value="node.completed">Node Completed</MenuItem>
                <MenuItem value="node.failed">Node Failed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Secret (optional)"
              type="password"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              fullWidth
              helperText="Optional secret for webhook authentication"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebhookDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateWebhook}
            variant="contained"
            disabled={!webhookId || !webhookUrl}
          >
            Create Webhook
          </Button>
        </DialogActions>
      </Dialog>

      {/* Subscribe to Events Dialog */}
      <Dialog open={eventDialogOpen} onClose={() => setEventDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subscribe to Events</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Subscription ID"
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Workflow (optional)</InputLabel>
              <Select
                value={eventWorkflowId}
                label="Workflow (optional)"
                onChange={(e) => setEventWorkflowId(e.target.value)}
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
              <InputLabel>Event Types</InputLabel>
              <Select
                multiple
                value={eventTypes}
                label="Event Types"
                onChange={(e) => setEventTypes(e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="workflow.started">Workflow Started</MenuItem>
                <MenuItem value="workflow.completed">Workflow Completed</MenuItem>
                <MenuItem value="workflow.failed">Workflow Failed</MenuItem>
                <MenuItem value="node.started">Node Started</MenuItem>
                <MenuItem value="node.completed">Node Completed</MenuItem>
                <MenuItem value="node.failed">Node Failed</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Callback URL (optional)"
              type="url"
              value={callbackUrl}
              onChange={(e) => setCallbackUrl(e.target.value)}
              fullWidth
              placeholder="https://example.com/callback"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubscribeToEvents}
            variant="contained"
            disabled={!subscriptionId || !eventType}
          >
            Subscribe
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
