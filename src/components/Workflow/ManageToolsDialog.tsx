/**
 * Manage Tools Dialog - List tools, Create / Edit / Delete.
 * No hardcoding. All data from API.
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Divider,
  CircularProgress,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  getTools,
  getTool,
  createTool,
  updateTool,
  deleteTool,
  type Tool,
  type CreateToolRequest,
  type UpdateToolRequest,
} from '@/services/toolsApi'

interface ManageToolsDialogProps {
  open: boolean
  onClose: () => void
  onToolChange?: () => void
}

const defaultSpecJson = '{"type":"object","properties":{},"required":[]}'

function specToJson(spec: Record<string, unknown> | undefined): string {
  try {
    const p = (spec && typeof spec === 'object' && 'parameters' in spec && spec.parameters)
      ? spec.parameters
      : {}
    return JSON.stringify(typeof p === 'object' && p !== null ? p : {}, null, 2)
  } catch {
    return defaultSpecJson
  }
}

export default function ManageToolsDialog({ open, onClose, onToolChange }: ManageToolsDialogProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [toolType, setToolType] = useState('function')
  const [specJson, setSpecJson] = useState(defaultSpecJson)
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchTools = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await getTools()
      setTools(list)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tools')
      setTools([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchTools()
      setMode('list')
      setEditId(null)
      setName('')
      setDescription('')
      setToolType('function')
      setSpecJson(defaultSpecJson)
      setError(null)
      setSubmitting(false)
      setDeletingId(null)
    }
  }, [open, fetchTools])

  const handleClose = () => {
    setMode('list')
    setEditId(null)
    setName('')
    setDescription('')
    setToolType('function')
    setSpecJson(defaultSpecJson)
    setError(null)
    onClose()
  }

  const startCreate = () => {
    setMode('create')
    setEditId(null)
    setName('')
    setDescription('')
    setToolType('function')
    setSpecJson(defaultSpecJson)
    setError(null)
  }

  const startEdit = async (id: string) => {
    setError(null)
    try {
      const t = await getTool(id)
      setEditId(id)
      setMode('edit')
      setName(t.name ?? '')
      setDescription(t.description ?? '')
      setToolType(t.type ?? 'function')
      setSpecJson(specToJson(t.spec as Record<string, unknown>))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tool')
    }
  }

  const backToList = () => {
    setMode('list')
    setEditId(null)
    setError(null)
    fetchTools()
  }

  const parseSpec = (): Record<string, unknown> | null => {
    try {
      const v = JSON.parse(specJson || '{}')
      return typeof v === 'object' && v !== null ? v : null
    } catch {
      return null
    }
  }

  const handleCreate = async () => {
    setError(null)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    const spec = parseSpec()
    if (spec === null) {
      setError('Invalid JSON for parameters (spec)')
      return
    }
    setSubmitting(true)
    try {
      const req: CreateToolRequest = {
        name: name.trim(),
        description: description.trim(),
        type: toolType || 'function',
        spec: { parameters: spec },
      }
      await createTool(req)
      onToolChange?.()
      backToList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create tool')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async () => {
    if (!editId) return
    setError(null)
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!description.trim()) {
      setError('Description is required')
      return
    }
    const spec = parseSpec()
    if (spec === null) {
      setError('Invalid JSON for parameters (spec)')
      return
    }
    setSubmitting(true)
    try {
      const req: UpdateToolRequest = {
        name: name.trim(),
        description: description.trim(),
        type: toolType || 'function',
        spec: { parameters: spec },
      }
      await updateTool(editId, req)
      onToolChange?.()
      backToList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update tool')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    setDeletingId(id)
    try {
      await deleteTool(id)
      onToolChange?.()
      if (mode === 'edit' && editId === id) {
        backToList()
      } else {
        fetchTools()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete tool')
    } finally {
      setDeletingId(null)
    }
  }

  const form = (
    <>
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        size="small"
        fullWidth
        required
        placeholder="e.g. solve_statistics_equations"
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        size="small"
        fullWidth
        required
        multiline
        rows={2}
        placeholder="What the tool does; when the model should use it."
      />
      <TextField
        label="Type"
        value={toolType}
        onChange={(e) => setToolType(e.target.value)}
        size="small"
        fullWidth
        placeholder="function"
      />
      <TextField
        label="Parameters (JSON Schema)"
        value={specJson}
        onChange={(e) => setSpecJson(e.target.value)}
        size="small"
        fullWidth
        multiline
        rows={6}
        placeholder='{"type":"object","properties":{...},"required":[]}'
        helperText="JSON object for parameters schema (e.g. type, properties, required)."
      />
    </>
  )

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'list' && 'Manage Tools'}
        {mode === 'create' && 'Create Tool'}
        {mode === 'edit' && 'Edit Tool'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {mode === 'list' && (
          <>
            <Typography variant="body2" color="text.secondary">
              Create, edit, or delete tools. Assign them to agents from Tools Configuration.
            </Typography>
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" color="text.secondary">Loading…</Typography>
              </Box>
            )}
            {!loading && tools.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                No tools yet. Create one below.
              </Typography>
            )}
            {!loading && tools.length > 0 && (
              <List dense disablePadding>
                {tools.map((t) => (
                  <ListItem
                    key={t.id}
                    disablePadding
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.5 }}
                  >
                    <ListItemText
                      primary={t.name}
                      secondary={t.description || t.type}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ sx: { display: 'block', mt: 0.25 } }}
                      sx={{ flex: 1, minWidth: 0, py: 0.5 }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.25, flexShrink: 0, pt: 0.25 }}>
                      <IconButton
                        size="small"
                        aria-label="Edit"
                        onClick={() => startEdit(t.id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Delete"
                        onClick={() => handleDelete(t.id)}
                        disabled={deletingId !== null}
                      >
                        {deletingId === t.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <DeleteIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            )}
            <Divider />
            <Button variant="outlined" onClick={startCreate} fullWidth>
              Create new tool
            </Button>
          </>
        )}
        {(mode === 'create' || mode === 'edit') && (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>{form}</Box>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        {mode === 'list' && (
          <Button onClick={handleClose}>Close</Button>
        )}
        {(mode === 'create' || mode === 'edit') && (
          <>
            <Button onClick={backToList}>Back</Button>
            <Box sx={{ flex: 1 }} />
            {mode === 'edit' && editId && (
              <Button
                color="error"
                onClick={() => handleDelete(editId)}
                disabled={submitting || deletingId !== null}
                startIcon={deletingId === editId ? <CircularProgress size={14} /> : <DeleteIcon />}
              >
                Delete
              </Button>
            )}
            <Button
              variant="contained"
              onClick={mode === 'create' ? handleCreate : handleUpdate}
              disabled={submitting}
            >
              {submitting ? 'Saving…' : mode === 'create' ? 'Create' : 'Update'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
