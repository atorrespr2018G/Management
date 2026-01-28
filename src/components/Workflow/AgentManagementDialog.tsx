/**
 * Agent Management Dialog - Create, Update, Delete agents in Foundry
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tabs,
  Tab,
  Box,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import {
  getAllAgents,
  getAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
  type Agent,
  type CreateAgentRequest,
  type UpdateAgentRequest,
} from '@/services/agentApi'

interface AgentManagementDialogProps {
  open: boolean
  onClose: () => void
  onAgentsUpdated?: () => void
}

export default function AgentManagementDialog({
  open,
  onClose,
  onAgentsUpdated,
}: AgentManagementDialogProps) {
  const [tabValue, setTabValue] = useState(0)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editingAgentId, setEditingAgentId] = useState<string>('')
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)

  // Create form state
  const [createFormData, setCreateFormData] = useState<Omit<CreateAgentRequest, 'tools'>>({
    name: '',
    model: 'gpt-4o-mini',
    instructions: '',
    description: '',
  })

  // Edit form state
  const [editFormData, setEditFormData] = useState<Omit<CreateAgentRequest, 'tools'>>({
    name: '',
    model: 'gpt-4o-mini',
    instructions: '',
    description: '',
  })

  const availableModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4', 'gpt-35-turbo']

  useEffect(() => {
    if (open) {
      loadAgents()
    }
  }, [open])

  const loadAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch agents from both config and Foundry, then combine and deduplicate
      const [configAgentsResult, foundryAgentsResult] = await Promise.allSettled([
        getAgents(), // Config-based agents
        getAllAgents().catch(() => []), // Foundry agents (fallback to empty array on error)
      ])
      
      const configAgents = configAgentsResult.status === 'fulfilled' ? configAgentsResult.value : []
      const foundryAgents = foundryAgentsResult.status === 'fulfilled' ? foundryAgentsResult.value : []
      
      // Combine and deduplicate by ID
      const agentMap = new Map<string, Agent>()
      
      // Add config agents first
      configAgents.forEach(agent => {
        if (agent.id) {
          agentMap.set(agent.id, agent)
        }
      })
      
      // Add Foundry agents (will overwrite config agents with same ID if they have more info)
      foundryAgents.forEach(agent => {
        if (agent.id) {
          // If agent already exists, merge the data (prefer Foundry data for name/description)
          const existing = agentMap.get(agent.id)
          if (existing) {
            agentMap.set(agent.id, {
              ...existing,
              ...agent, // Foundry data takes precedence
            })
          } else {
            agentMap.set(agent.id, agent)
          }
        }
      })
      
      setAgents(Array.from(agentMap.values()))
    } catch (err: any) {
      setError(err.message || 'Failed to load agents')
      // Fallback to just config agents
      try {
        const configAgents = await getAgents()
        setAgents(configAgents)
      } catch (fallbackError) {
        console.error('Failed to load config agents:', fallbackError)
        setAgents([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createFormData.name || !createFormData.model || !createFormData.instructions) {
      setError('Name, model, and instructions are required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await createAgent(createFormData as CreateAgentRequest)
      setSuccess(`Agent "${createFormData.name}" created successfully!`)
      setCreateFormData({ name: '', model: 'gpt-4o-mini', instructions: '', description: '' })
      await loadAgents()
      setTabValue(0) // Switch to list tab
      onAgentsUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Failed to create agent')
    } finally {
      setLoading(false)
    }
  }

  const handleEditAgentSelect = async (agentId: string) => {
    setEditingAgentId(agentId)
    if (!agentId) {
      setEditingAgent(null)
      setEditFormData({ name: '', model: 'gpt-4o-mini', instructions: '', description: '' })
      return
    }

    setLoading(true)
    setError(null)
    try {
      const agent = await getAgent(agentId)
      setEditingAgent(agent)
      setEditFormData({
        name: agent.name,
        model: agent.model || 'gpt-4o-mini',
        instructions: agent.instructions || '',
        description: agent.description || '',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to load agent details')
      setEditingAgent(null)
      setEditFormData({ name: '', model: 'gpt-4o-mini', instructions: '', description: '' })
    } finally {
      setLoading(false)
    }
  }

  const handleEditFromList = (agent: Agent) => {
    setEditingAgentId(agent.id)
    setEditingAgent(agent)
    setEditFormData({
      name: agent.name,
      model: agent.model || 'gpt-4o-mini',
      instructions: agent.instructions || '',
      description: agent.description || '',
    })
    setTabValue(2) // Switch to edit tab
  }

  const handleUpdate = async () => {
    if (!editingAgentId || !editFormData.name || !editFormData.model || !editFormData.instructions) {
      setError('Name, model, and instructions are required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateAgent(editingAgentId, editFormData as UpdateAgentRequest)
      setSuccess(`Agent "${editFormData.name}" updated successfully!`)
      setEditingAgentId('')
      setEditingAgent(null)
      setEditFormData({ name: '', model: 'gpt-4o-mini', instructions: '', description: '' })
      await loadAgents()
      setTabValue(0) // Switch to list tab
      onAgentsUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Failed to update agent')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (agentId: string, agentName: string) => {
    if (!confirm(`Are you sure you want to delete agent "${agentName}"?`)) {
      return
    }

    setLoading(true)
    setError(null)
    try {
      await deleteAgent(agentId)
      setSuccess(`Agent "${agentName}" deleted successfully!`)
      await loadAgents()
      onAgentsUpdated?.()
    } catch (err: any) {
      setError(err.message || 'Failed to delete agent')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingAgentId('')
    setEditingAgent(null)
    setEditFormData({ name: '', model: 'gpt-4o-mini', instructions: '', description: '' })
    setError(null)
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Manage Agents</DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label="List Agents" />
            <Tab label="Create Agent" />
            <Tab label="Edit Agent" />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {tabValue === 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Model</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : agents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No agents found
                      </TableCell>
                    </TableRow>
                  ) : (
                    agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>{agent.name}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {agent.id}
                        </TableCell>
                        <TableCell>{agent.model || 'N/A'}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditFromList(agent)}
                            title="Edit agent"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(agent.id, agent.name)}
                            title="Delete agent"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Agent Name"
                value={createFormData.name}
                onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                fullWidth
                required
                size="small"
              />
              <FormControl fullWidth size="small" required>
                <InputLabel>Model</InputLabel>
                <Select
                  value={createFormData.model}
                  label="Model"
                  onChange={(e) => setCreateFormData({ ...createFormData, model: e.target.value })}
                >
                  {availableModels.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Instructions"
                value={createFormData.instructions}
                onChange={(e) => setCreateFormData({ ...createFormData, instructions: e.target.value })}
                fullWidth
                required
                multiline
                rows={4}
                size="small"
                placeholder="Enter system instructions for the agent..."
              />
              <TextField
                label="Description (Optional)"
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                size="small"
                placeholder="Enter a description for the agent..."
              />
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <Select
                  value={editingAgentId}
                  onChange={(e) => handleEditAgentSelect(e.target.value)}
                  displayEmpty
                  renderValue={(value) => {
                    if (!value) {
                      return <em style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Select an agent...</em>
                    }
                    const agent = agents.find(a => a.id === value)
                    return agent ? `${agent.name} (${agent.id})` : value
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        mt: 0.5,
                      },
                    },
                    anchorOrigin: {
                      vertical: 'bottom',
                      horizontal: 'left',
                    },
                    transformOrigin: {
                      vertical: 'top',
                      horizontal: 'left',
                    },
                  }}
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {editingAgent && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>
                    Agent Details
                  </Typography>
                  <TextField
                    label="Agent Name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    fullWidth
                    required
                    size="small"
                  />
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Model</InputLabel>
                    <Select
                      value={editFormData.model}
                      label="Model"
                      onChange={(e) => setEditFormData({ ...editFormData, model: e.target.value })}
                    >
                      {availableModels.map((model) => (
                        <MenuItem key={model} value={model}>
                          {model}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Instructions"
                    value={editFormData.instructions}
                    onChange={(e) => setEditFormData({ ...editFormData, instructions: e.target.value })}
                    fullWidth
                    required
                    multiline
                    rows={4}
                    size="small"
                    placeholder="Enter system instructions for the agent..."
                  />
                  <TextField
                    label="Description (Optional)"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    placeholder="Enter a description for the agent..."
                  />
                </>
              )}

              {!editingAgent && editingAgentId && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Loading agent details...
                </Typography>
              )}

              {!editingAgent && !editingAgentId && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Select an agent from the dropdown above to edit its details
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          {tabValue === 1 && (
            <Button onClick={handleCreate} variant="contained" disabled={loading}>
              Create
            </Button>
          )}
          {tabValue === 2 && (
            <>
              <Button onClick={handleCancelEdit} disabled={loading || !editingAgentId}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate} 
                variant="contained" 
                disabled={loading || !editingAgentId || !editingAgent}
              >
                Update
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </>
  )
}
