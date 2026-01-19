/**
 * Connection Configuration Panel
 * UI for configuring agent connections with state paths and conditions
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import type { ConnectionConfig } from '@/utils/agentWorkflowGenerator'
import type { Agent } from '@/services/agentApi'

interface ConnectionConfigPanelProps {
  open: boolean
  onClose: () => void
  onConfirm: (config: ConnectionConfig) => void
  sourceAgent: Agent | null
  targetAgent: Agent | null
  availableAgents: Agent[]
}

export default function ConnectionConfigPanel({
  open,
  onClose,
  onConfirm,
  sourceAgent,
  targetAgent,
  availableAgents,
}: ConnectionConfigPanelProps) {
  const [selectedTargetAgentId, setSelectedTargetAgentId] = useState<string>(targetAgent?.id || '')
  const [config, setConfig] = useState<ConnectionConfig>({
    sourceAgentId: sourceAgent?.id || '',
    targetAgentId: targetAgent?.id || '',
    sourceOutputPath: '',
    targetInputPath: '',
    condition: '',
    autoConditional: false,
  })

  useEffect(() => {
    if (targetAgent) {
      setSelectedTargetAgentId(targetAgent.id)
      setConfig((prev) => ({ ...prev, targetAgentId: targetAgent.id }))
    } else if (open && !targetAgent) {
      // Reset when dialog opens without target agent
      setSelectedTargetAgentId('')
      setConfig((prev) => ({ ...prev, targetAgentId: '' }))
    }
  }, [targetAgent, open])

  const handleChange = (field: keyof ConnectionConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleConfirm = () => {
    if (!config.sourceAgentId || !config.targetAgentId) {
      return
    }
    onConfirm(config)
    onClose()
    // Reset config
    setConfig({
      sourceAgentId: sourceAgent?.id || '',
      targetAgentId: '',
      sourceOutputPath: '',
      targetInputPath: '',
      condition: '',
      autoConditional: false,
    })
    setSelectedTargetAgentId('')
  }

  const sourceAgentName = availableAgents.find((a) => a.id === config.sourceAgentId)?.name || config.sourceAgentId
  const targetAgentName = availableAgents.find((a) => a.id === config.targetAgentId)?.name || config.targetAgentId || 'Select target agent'

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Configure Agent Connection</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="info" sx={{ mb: 1 }}>
            {sourceAgent ? (
              <>Connecting: <strong>{sourceAgentName}</strong> → <strong>{targetAgentName || 'Select target agent'}</strong></>
            ) : (
              <>Configure connection between agents</>
            )}
          </Alert>

          {!targetAgent && (
            <FormControl fullWidth required>
              <InputLabel>Target Agent</InputLabel>
              <Select
                value={selectedTargetAgentId}
                label="Target Agent"
                onChange={(e) => {
                  setSelectedTargetAgentId(e.target.value)
                  setConfig((prev) => ({ ...prev, targetAgentId: e.target.value }))
                }}
              >
                {availableAgents
                  .filter((a) => a.id !== sourceAgent?.id)
                  .map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          )}

          <TextField
            label="Source Output Path"
            value={config.sourceOutputPath}
            onChange={(e) => handleChange('sourceOutputPath', e.target.value)}
            placeholder="e.g., triage.result"
            helperText="State path where source agent writes its output"
            size="small"
            fullWidth
          />

          <TextField
            label="Target Input Path"
            value={config.targetInputPath}
            onChange={(e) => handleChange('targetInputPath', e.target.value)}
            placeholder="e.g., news.goal"
            helperText="State path where target agent reads its input"
            size="small"
            fullWidth
          />

          <TextField
            label="Condition (Optional)"
            value={config.condition}
            onChange={(e) => handleChange('condition', e.target.value)}
            placeholder="e.g., triage.preferred_agent == 'news'"
            helperText="Condition expression for routing (creates conditional node if enabled)"
            multiline
            rows={2}
            size="small"
            fullWidth
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={config.autoConditional}
                onChange={(e) => handleChange('autoConditional', e.target.checked)}
              />
            }
            label="Auto-generate conditional node if condition is provided"
          />

          {config.condition && config.autoConditional && (
            <Alert severity="info">
              A conditional node will be inserted between the agents with the condition: <code>{config.condition}</code>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={!config.sourceAgentId || !config.targetAgentId || (!targetAgent && !selectedTargetAgentId)}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
