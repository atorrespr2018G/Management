/**
 * Agent Setup Panel - Reusable component for agent configuration
 * Extracted from Agents page to be used in multiple places
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  TextField,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Select,
  MenuItem,
  Slider,
  Link,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  Save as SaveIcon,
} from '@mui/icons-material'
import type { Agent } from '@/services/agentApi'

interface AgentSetupPanelProps {
  agent: Agent | null
  onSave?: (agentId: string, updates: Partial<Agent>) => Promise<void>
  onShowMessage?: (message: string, severity: 'success' | 'error') => void
  showPlaygroundButton?: boolean
  onPlaygroundClick?: () => void
}

export default function AgentSetupPanel({
  agent,
  onSave,
  onShowMessage,
  showPlaygroundButton = false,
  onPlaygroundClick,
}: AgentSetupPanelProps) {
  const [agentName, setAgentName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [description, setDescription] = useState('')
  const [temperature, setTemperature] = useState(1)
  const [topP, setTopP] = useState(1)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form when agent changes
  useEffect(() => {
    if (agent) {
      setAgentName(agent.name || '')
      setInstructions(agent.instructions || '')
      setDescription(agent.description || '')
      // Temperature and Top P are not part of Agent interface, so we keep defaults
      // These could be stored in agent.params or similar if needed
    } else {
      setAgentName('')
      setInstructions('')
      setDescription('')
      setTemperature(1)
      setTopP(1)
    }
  }, [agent])

  const handleSave = async () => {
    if (!agent?.id) {
      onShowMessage?.('No agent selected', 'error')
      return
    }

    if (!onSave) {
      onShowMessage?.('Save function not provided', 'error')
      return
    }

    setIsSaving(true)
    try {
      await onSave(agent.id, {
        name: agentName,
        instructions,
        description,
      })
      onShowMessage?.('Agent configuration saved successfully', 'success')
    } catch (error) {
      onShowMessage?.(
        error instanceof Error ? error.message : 'Failed to save agent configuration',
        'error'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (!agent) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          No agent selected
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Setup
        </Typography>
        {showPlaygroundButton && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={onPlaygroundClick}
            sx={{ textTransform: 'none' }}
          >
            Try in playground
          </Button>
        )}
      </Box>

      {/* Agent ID */}
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
          Agent ID
        </Typography>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
          {agent.id}
        </Typography>
      </Box>

      {/* Agent Name */}
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
          Agent name
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          sx={{ fontSize: '0.875rem' }}
        />
      </Box>

      {/* Deployment */}
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
          Deployment
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ flexGrow: 1 }}>
            <Select
              value={`${agent.model || 'gpt-4o-mini'} (version:2024-07-18)`}
              sx={{ fontSize: '0.875rem' }}
              disabled
            >
              <MenuItem value={`${agent.model || 'gpt-4o-mini'} (version:2024-07-18)`}>
                {agent.model || 'gpt-4o-mini'} (version:2024-07-18)
              </MenuItem>
            </Select>
          </FormControl>
          <Link href="#" sx={{ fontSize: '0.875rem', textDecoration: 'none' }}>
            + Create new deployment
          </Link>
        </Box>
      </Box>

      {/* Instructions */}
      <Box>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
          Instructions
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          size="small"
          sx={{ fontSize: '0.875rem' }}
        />
      </Box>

      {/* Agent Description */}
      <Accordion sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Agent Description
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
          />
        </AccordionDetails>
      </Accordion>

      {/* Knowledge */}
      <Accordion sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Knowledge (0)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
            Knowledge gives the agent access to data sources for grounding responses.{' '}
            <Link href="#" sx={{ fontSize: '0.875rem' }}>
              Learn more
            </Link>
          </Typography>
          <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
            + Add
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Actions */}
      <Accordion sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Actions (0)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
            Actions give the agent the ability to perform tasks.{' '}
            <Link href="#" sx={{ fontSize: '0.875rem' }}>
              Learn more
            </Link>
          </Typography>
          <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
            + Add
          </Button>
        </AccordionDetails>
      </Accordion>

      {/* Connected agents */}
      <Accordion sx={{ boxShadow: 'none', border: 1, borderColor: 'divider' }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Connected agents (0)
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
            Hand-off thread context to other agents to focus on specialized tasks.{' '}
            <Link href="#" sx={{ fontSize: '0.875rem' }}>
              Learn more
            </Link>
          </Typography>
          <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
            + Add
          </Button>
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 1 }} />

      {/* Model settings */}
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
        Model settings
      </Typography>

      {/* Temperature */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Temperature
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {temperature}
          </Typography>
        </Box>
        <Slider
          value={temperature}
          onChange={(e, newValue) => setTemperature(newValue as number)}
          min={0}
          max={2}
          step={0.1}
          valueLabelDisplay="auto"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Top P */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            Top P
          </Typography>
          <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
            {topP}
          </Typography>
        </Box>
        <Slider
          value={topP}
          onChange={(e, newValue) => setTopP(newValue as number)}
          min={0}
          max={1}
          step={0.1}
          valueLabelDisplay="auto"
          sx={{ mt: 1 }}
        />
      </Box>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          startIcon={isSaving ? <CircularProgress size={14} /> : <SaveIcon />}
          disabled={isSaving}
          onClick={handleSave}
          sx={{ textTransform: 'none' }}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Box>
  )
}
