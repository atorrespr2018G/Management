/**
 * Workflow Collaboration Page
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
  List,
  ListItem,
  ListItemText,
} from '@mui/material'
import {
  People as TeamIcon,
  Share as ShareIcon,
  GroupAdd as AddTeamIcon,
} from '@mui/icons-material'
import { createTeam, shareWorkflow } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowCollaborationPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Team creation state
  const [teamDialogOpen, setTeamDialogOpen] = useState(false)
  const [teamId, setTeamId] = useState('')
  const [teamName, setTeamName] = useState('')
  const [teamDescription, setTeamDescription] = useState('')

  // Share workflow state
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareWorkflowId, setShareWorkflowId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [shareLevel, setShareLevel] = useState<'private' | 'team' | 'public'>('private')
  const [sharedWithUsers, setSharedWithUsers] = useState<string[]>([])
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

  const handleCreateTeam = async () => {
    try {
      await createTeam(teamId, teamName, teamDescription || undefined)
      setTeamDialogOpen(false)
      setSnackbar({ open: true, message: 'Team created successfully', severity: 'success' })
      setTeamId('')
      setTeamName('')
      setTeamDescription('')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to create team', severity: 'error' })
    }
  }

  const handleShareWorkflow = async () => {
    try {
      await shareWorkflow(
        shareWorkflowId,
        ownerId,
        shareLevel,
        sharedWithUsers.length > 0 ? sharedWithUsers : undefined
      )
      setShareDialogOpen(false)
      setSnackbar({ open: true, message: 'Workflow shared successfully', severity: 'success' })
      setShareWorkflowId('')
      setOwnerId('')
      setShareLevel('private')
      setSharedWithUsers([])
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to share workflow', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <TeamIcon sx={{ mr: 1 }} />
          Workflow Collaboration
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
        <Paper sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Teams</Typography>
            <Button variant="contained" startIcon={<AddTeamIcon />} onClick={() => setTeamDialogOpen(true)}>
              Create Team
            </Button>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Teams allow you to organize users and share workflows with groups. Create teams to enable
                collaboration on workflows.
              </Typography>
            </CardContent>
          </Card>
        </Paper>

        <Paper sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Share Workflows</Typography>
            <Button variant="contained" startIcon={<ShareIcon />} onClick={() => setShareDialogOpen(true)}>
              Share Workflow
            </Button>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Share workflows with specific users or make them available to your team or publicly. Control access
                levels for better collaboration.
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Box>

      {/* Create Team Dialog */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Team</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Team ID"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Description (optional)"
              value={teamDescription}
              onChange={(e) => setTeamDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateTeam} variant="contained" disabled={!teamId || !teamName}>
            Create Team
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Workflow Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Workflow</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Workflow</InputLabel>
              <Select
                value={shareWorkflowId}
                label="Workflow"
                onChange={(e) => setShareWorkflowId(e.target.value)}
              >
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Owner ID"
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Share Level</InputLabel>
              <Select
                value={shareLevel}
                label="Share Level"
                onChange={(e) => setShareLevel(e.target.value as 'private' | 'team' | 'public')}
              >
                <MenuItem value="private">Private</MenuItem>
                <MenuItem value="team">Team</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Shared With Users (comma-separated)"
              value={sharedWithUsers.join(', ')}
              onChange={(e) => setSharedWithUsers(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
              fullWidth
              placeholder="user1, user2, user3"
              helperText="Enter user IDs separated by commas"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleShareWorkflow}
            variant="contained"
            disabled={!shareWorkflowId || !ownerId}
          >
            Share
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
