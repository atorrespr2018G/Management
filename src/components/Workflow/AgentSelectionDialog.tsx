/**
 * Agent Selection Dialog
 * Dialog for selecting an agent when adding an agent node
 */

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  InputAdornment,
} from '@mui/material'
import { AutoAwesome as AgentIcon, Search as SearchIcon } from '@mui/icons-material'
import type { Agent } from '@/services/agentApi'

interface AgentSelectionDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (agentId: string) => void
  availableAgents: Agent[]
}

export default function AgentSelectionDialog({
  open,
  onClose,
  onSelect,
  availableAgents,
}: AgentSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>(availableAgents)

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAgents(availableAgents)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredAgents(
        availableAgents.filter(
          (agent) =>
            agent.name.toLowerCase().includes(term) ||
            agent.id.toLowerCase().includes(term) ||
            agent.description?.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, availableAgents])

  const handleSelect = (agentId: string) => {
    onSelect(agentId)
    onClose()
    setSearchTerm('')
  }

  const handleClose = () => {
    onClose()
    setSearchTerm('')
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Agent</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {filteredAgents.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
              No agents found
            </Typography>
          ) : (
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {filteredAgents.map((agent) => (
                <ListItem key={agent.id} disablePadding>
                  <ListItemButton onClick={() => handleSelect(agent.id)}>
                    <ListItemIcon>
                      <AgentIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={agent.name}
                      secondary={
                        <Box>
                          <Typography variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                            {agent.id}
                          </Typography>
                          {agent.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                              {agent.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  )
}
