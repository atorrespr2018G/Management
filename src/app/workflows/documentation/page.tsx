/**
 * Workflow Documentation Page
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
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material'
import {
  Description as DocIcon,
  Add as AddIcon,
  AutoAwesome as GenerateIcon,
} from '@mui/icons-material'
import { addDocumentation, getWorkflowDocumentation, generateWorkflowDocs } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowDocumentationPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])
  const [documentation, setDocumentation] = useState<
    Array<{ doc_id: string; title: string; type: string; content: string }>
  >([])

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [docId, setDocId] = useState('')
  const [docType, setDocType] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [docContent, setDocContent] = useState('')

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadWorkflows()
  }, [])

  useEffect(() => {
    if (selectedWorkflowId) {
      loadDocumentation()
    } else {
      setDocumentation([])
    }
  }, [selectedWorkflowId])

  const loadWorkflows = async () => {
    try {
      const data = await listWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  const loadDocumentation = async () => {
    if (!selectedWorkflowId) return
    try {
      setLoading(true)
      const data = await getWorkflowDocumentation(selectedWorkflowId)
      setDocumentation(data)
    } catch (error) {
      console.error('Failed to load documentation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDocumentation = async () => {
    try {
      await addDocumentation(docId, docType, docTitle, docContent, selectedWorkflowId || undefined)
      setAddDialogOpen(false)
      setSnackbar({ open: true, message: 'Documentation added successfully', severity: 'success' })
      setDocId('')
      setDocType('')
      setDocTitle('')
      setDocContent('')
      if (selectedWorkflowId) {
        loadDocumentation()
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to add documentation', severity: 'error' })
    }
  }

  const handleGenerateDocs = async () => {
    if (!selectedWorkflowId) {
      setSnackbar({ open: true, message: 'Please select a workflow', severity: 'error' })
      return
    }

    try {
      setLoading(true)
      await generateWorkflowDocs(selectedWorkflowId)
      setSnackbar({ open: true, message: 'Documentation generated successfully', severity: 'success' })
      loadDocumentation()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to generate documentation', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <DocIcon sx={{ mr: 1 }} />
          Workflow Documentation
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
          {selectedWorkflowId && (
            <Button
              variant="outlined"
              startIcon={<GenerateIcon />}
              onClick={handleGenerateDocs}
              disabled={loading}
            >
              Auto-Generate
            </Button>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
            Add Documentation
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Loading...
          </Typography>
        </Box>
      )}

      {documentation.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              {selectedWorkflowId
                ? 'No documentation found. Add documentation or use auto-generation.'
                : 'Select a workflow to view or manage documentation.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {documentation.map((doc) => (
            <ListItem key={doc.doc_id} component={Paper} variant="outlined" sx={{ mb: 1 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6">{doc.title}</Typography>
                    <Chip label={doc.type} size="small" />
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      {doc.content}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      ID: {doc.doc_id}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {/* Add Documentation Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Documentation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Document ID"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select value={docType} label="Type" onChange={(e) => setDocType(e.target.value)}>
                <MenuItem value="user_guide">User Guide</MenuItem>
                <MenuItem value="api_reference">API Reference</MenuItem>
                <MenuItem value="tutorial">Tutorial</MenuItem>
                <MenuItem value="troubleshooting">Troubleshooting</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Content"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              fullWidth
              required
              multiline
              rows={8}
            />
            <FormControl fullWidth>
              <InputLabel>Workflow (optional)</InputLabel>
              <Select
                value={selectedWorkflowId}
                label="Workflow (optional)"
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
              >
                <MenuItem value="">General Documentation</MenuItem>
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddDocumentation} variant="contained" disabled={!docId || !docType || !docTitle || !docContent}>
            Add
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
