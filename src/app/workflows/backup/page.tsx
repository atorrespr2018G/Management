/**
 * Workflow Backup Page
 */

'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
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
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { createBackup, restoreBackup } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowBackupPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [backupDialogOpen, setBackupDialogOpen] = useState(false)
  const [backupType, setBackupType] = useState<'full' | 'incremental'>('full')
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([])
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [restoreBackupId, setRestoreBackupId] = useState('')
  const [overwrite, setOverwrite] = useState(false)

  React.useEffect(() => {
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

  const handleCreateBackup = async () => {
    try {
      const result = await createBackup(backupType, selectedWorkflows.length > 0 ? selectedWorkflows : undefined)
      setBackupDialogOpen(false)
      setSnackbar({
        open: true,
        message: `Backup created successfully: ${result.backup_id}`,
        severity: 'success',
      })
      setBackupType('full')
      setSelectedWorkflows([])
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to create backup', severity: 'error' })
    }
  }

  const handleRestoreBackup = async () => {
    try {
      const result = await restoreBackup(restoreBackupId, overwrite)
      setRestoreDialogOpen(false)
      setSnackbar({
        open: true,
        message: `Backup restored successfully: ${result.restored_count} workflows restored`,
        severity: 'success',
      })
      setRestoreBackupId('')
      setOverwrite(false)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to restore backup', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <BackupIcon sx={{ mr: 1 }} />
          Workflow Backup & Restore
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<RestoreIcon />} onClick={() => setRestoreDialogOpen(true)}>
            Restore Backup
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setBackupDialogOpen(true)}>
            Create Backup
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Create Backup
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Create a backup of your workflows. Choose between full backup (all workflows) or incremental backup
              (only changed workflows).
            </Typography>
            <Button variant="contained" startIcon={<BackupIcon />} onClick={() => setBackupDialogOpen(true)}>
              Create Backup
            </Button>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Restore Backup
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Restore workflows from a previous backup. You can choose to overwrite existing workflows or keep them.
            </Typography>
            <Button variant="outlined" startIcon={<RestoreIcon />} onClick={() => setRestoreDialogOpen(true)}>
              Restore Backup
            </Button>
          </CardContent>
        </Card>
      </Box>

      {/* Create Backup Dialog */}
      <Dialog open={backupDialogOpen} onClose={() => setBackupDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Backup Type</InputLabel>
              <Select
                value={backupType}
                label="Backup Type"
                onChange={(e) => setBackupType(e.target.value as 'full' | 'incremental')}
              >
                <MenuItem value="full">Full Backup</MenuItem>
                <MenuItem value="incremental">Incremental Backup</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Workflows (optional - leave empty for all)</InputLabel>
              <Select
                multiple
                value={selectedWorkflows}
                label="Workflows (optional - leave empty for all)"
                onChange={(e) => setSelectedWorkflows(e.target.value as string[])}
                renderValue={(selected) => `${(selected as string[]).length} workflow(s) selected`}
              >
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
          <Button onClick={() => setBackupDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateBackup} variant="contained">
            Create Backup
          </Button>
        </DialogActions>
      </Dialog>

      {/* Restore Backup Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Restore Backup</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Backup ID"
              value={restoreBackupId}
              onChange={(e) => setRestoreBackupId(e.target.value)}
              fullWidth
              required
            />
            <FormControlLabel
              control={<Checkbox checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />}
              label="Overwrite existing workflows"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRestoreBackup} variant="contained" disabled={!restoreBackupId}>
            Restore
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
