/**
 * Workflow Security Page
 */

'use client'

import React, { useState } from 'react'
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
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
} from '@mui/material'
import {
  Security as SecurityIcon,
  PersonAdd as AddUserIcon,
  VpnKey as TokenIcon,
  Lock as PermissionIcon,
} from '@mui/icons-material'
import { createUser, createToken, grantPermission } from '@/services/workflowApi'
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

export default function WorkflowSecurityPage() {
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // User creation state
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [userId, setUserId] = useState('')
  const [username, setUsername] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userRoles, setUserRoles] = useState<string[]>([])

  // Token creation state
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false)
  const [tokenUserId, setTokenUserId] = useState('')
  const [expiresInHours, setExpiresInHours] = useState(24)
  const [createdToken, setCreatedToken] = useState<string | null>(null)

  // Permission state
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false)
  const [permissionWorkflowId, setPermissionWorkflowId] = useState('')
  const [permissionUserId, setPermissionUserId] = useState('')
  const [permissionType, setPermissionType] = useState<'read' | 'write' | 'execute' | 'admin'>('read')
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])

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

  const handleCreateUser = async () => {
    try {
      await createUser(userId, username, userEmail || undefined, userRoles.length > 0 ? userRoles : undefined)
      setUserDialogOpen(false)
      setSnackbar({ open: true, message: 'User created successfully', severity: 'success' })
      setUserId('')
      setUsername('')
      setUserEmail('')
      setUserRoles([])
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to create user', severity: 'error' })
    }
  }

  const handleCreateToken = async () => {
    try {
      const result = await createToken(tokenUserId, expiresInHours)
      setCreatedToken(result.token)
      setSnackbar({ open: true, message: 'Token created successfully', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to create token', severity: 'error' })
    }
  }

  const handleGrantPermission = async () => {
    try {
      await grantPermission(permissionWorkflowId, permissionUserId, permissionType)
      setPermissionDialogOpen(false)
      setSnackbar({ open: true, message: 'Permission granted successfully', severity: 'success' })
      setPermissionWorkflowId('')
      setPermissionUserId('')
      setPermissionType('read')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to grant permission', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <SecurityIcon sx={{ mr: 1 }} />
          Workflow Security
        </Typography>
      </Box>

      <Paper sx={{ flex: 1 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Users" icon={<AddUserIcon />} iconPosition="start" />
          <Tab label="Tokens" icon={<TokenIcon />} iconPosition="start" />
          <Tab label="Permissions" icon={<PermissionIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<AddUserIcon />} onClick={() => setUserDialogOpen(true)}>
              Create User
            </Button>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                User management allows you to create users and assign roles. Users can be granted permissions to
                specific workflows.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<TokenIcon />} onClick={() => setTokenDialogOpen(true)}>
              Create Token
            </Button>
          </Box>
          {createdToken && (
            <Card sx={{ mb: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Token Created
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {createdToken}
                </Typography>
                <Button
                  size="small"
                  onClick={() => {
                    navigator.clipboard.writeText(createdToken)
                    setSnackbar({ open: true, message: 'Token copied to clipboard', severity: 'success' })
                  }}
                  sx={{ mt: 1 }}
                >
                  Copy Token
                </Button>
              </CardContent>
            </Card>
          )}
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Access tokens allow programmatic access to workflows. Tokens can be configured with expiration times.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" startIcon={<PermissionIcon />} onClick={() => setPermissionDialogOpen(true)}>
              Grant Permission
            </Button>
          </Box>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Grant users permissions to access, modify, or execute specific workflows. Permissions include read,
                write, execute, and admin levels.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Email (optional)"
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={userRoles}
                label="Roles"
                onChange={(e) => setUserRoles(e.target.value as string[])}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="developer">Developer</MenuItem>
                <MenuItem value="viewer">Viewer</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained" disabled={!userId || !username}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Token Dialog */}
      <Dialog open={tokenDialogOpen} onClose={() => setTokenDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Access Token</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="User ID"
              value={tokenUserId}
              onChange={(e) => setTokenUserId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Expires In (hours)"
              type="number"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              fullWidth
              required
              inputProps={{ min: 1, max: 8760 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTokenDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateToken} variant="contained" disabled={!tokenUserId}>
            Create Token
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grant Permission Dialog */}
      <Dialog open={permissionDialogOpen} onClose={() => setPermissionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Grant Permission</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Workflow</InputLabel>
              <Select
                value={permissionWorkflowId}
                label="Workflow"
                onChange={(e) => setPermissionWorkflowId(e.target.value)}
              >
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="User ID"
              value={permissionUserId}
              onChange={(e) => setPermissionUserId(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Permission</InputLabel>
              <Select
                value={permissionType}
                label="Permission"
                onChange={(e) => setPermissionType(e.target.value as 'read' | 'write' | 'execute' | 'admin')}
              >
                <MenuItem value="read">Read</MenuItem>
                <MenuItem value="write">Write</MenuItem>
                <MenuItem value="execute">Execute</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGrantPermission}
            variant="contained"
            disabled={!permissionWorkflowId || !permissionUserId}
          >
            Grant Permission
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
