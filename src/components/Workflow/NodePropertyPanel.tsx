/**
 * Node Property Panel - Dynamic form for editing node properties
 */

import React, { useState } from 'react'
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon, Link as LinkIcon } from '@mui/icons-material'
import type { WorkflowNode, NodeType } from '@/types/workflow'
import ConnectionConfigPanel from './ConnectionConfigPanel'
import type { Agent } from '@/services/agentApi'
import type { ConnectionConfig } from '@/utils/agentWorkflowGenerator'

interface NodePropertyPanelProps {
  node: WorkflowNode | null
  availableAgents?: Array<{ id: string; name: string }>
  onUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onDelete?: (nodeId: string) => void
  onConnect?: (sourceNodeId: string, targetAgentId: string, config?: ConnectionConfig) => void
}

export default function NodePropertyPanel({
  node,
  availableAgents = [],
  onUpdate,
  onDelete,
  onConnect,
}: NodePropertyPanelProps) {
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  const [selectedTargetAgent, setSelectedTargetAgent] = useState<Agent | null>(null)
  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Select a node to edit its properties
        </Typography>
      </Box>
    )
  }

  const handleUpdate = (field: keyof WorkflowNode, value: any) => {
    onUpdate(node.id, { [field]: value })
  }

  const handleParamsUpdate = (key: string, value: any) => {
    onUpdate(node.id, {
      params: {
        ...node.params,
        [key]: value,
      },
    })
  }

  const handleConnectClick = () => {
    if (node && node.type === 'agent' && availableAgents.length > 0) {
      // First show agent selection, then configuration
      setConnectionDialogOpen(true)
    }
  }

  const handleConnectionConfirm = (config: ConnectionConfig) => {
    if (onConnect && node) {
      onConnect(node.id, config.targetAgentId, config)
    }
    setConnectionDialogOpen(false)
    setSelectedTargetAgent(null)
  }

  const sourceAgent = node && node.type === 'agent' 
    ? availableAgents.find((a) => a.id === node.agent_id) || null
    : null

  return (
    <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Node Properties
        </Typography>
        {onDelete && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => onDelete(node.id)}
          >
            Delete
          </Button>
        )}
      </Box>

      {/* Basic Properties */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Basic Properties</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Node ID"
              value={node.id}
              size="small"
              disabled
              helperText="Node ID cannot be changed"
            />
            <FormControl size="small">
              <InputLabel>Node Type</InputLabel>
              <Select
                value={node.type}
                label="Node Type"
                disabled
                onChange={(e) => handleUpdate('type', e.target.value as NodeType)}
              >
                <MenuItem value="agent">Agent</MenuItem>
                <MenuItem value="conditional">Conditional</MenuItem>
                <MenuItem value="fanout">Fanout</MenuItem>
                <MenuItem value="loop">Loop</MenuItem>
                <MenuItem value="merge">Merge</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Agent-specific properties */}
      {node.type === 'agent' && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Agent Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel id="agent-select-label" shrink={!!node.agent_id}>
                  Select Agent
                </InputLabel>
                <Select
                  value={node.agent_id || ''}
                  labelId="agent-select-label"
                  label="Select Agent"
                  onChange={(e) => handleUpdate('agent_id', e.target.value || undefined)}
                  displayEmpty
                  notched={!!node.agent_id}
                  renderValue={(selected) => {
                    if (!selected || selected === '') {
                      return ''
                    }
                    const selectedAgent = availableAgents.find((a) => a.id === selected)
                    return selectedAgent ? `${selectedAgent.name} (${selectedAgent.id})` : selected
                  }}
                >
                  <MenuItem value="">
                    <em>No agent selected</em>
                  </MenuItem>
                  {availableAgents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!node.agent_id && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Select an agent from the dropdown above to configure this node
                </Typography>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Conditional-specific properties */}
      {node.type === 'conditional' && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Condition</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TextField
              label="Condition Expression"
              value={node.condition || ''}
              onChange={(e) => handleUpdate('condition', e.target.value)}
              multiline
              rows={3}
              size="small"
              fullWidth
              placeholder="e.g., triage.preferred_agent == 'sql'"
              helperText="Enter a condition expression for routing"
            />
          </AccordionDetails>
        </Accordion>
      )}

      {/* Fanout-specific properties */}
      {node.type === 'fanout' && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Branches</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Branch Node IDs (comma-separated)
              </Typography>
              <TextField
                value={node.branches?.join(', ') || ''}
                onChange={(e) =>
                  handleUpdate(
                    'branches',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                size="small"
                placeholder="branch1, branch2"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Loop-specific properties */}
      {node.type === 'loop' && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Loop Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Max Iterations"
                type="number"
                value={node.max_iters || ''}
                onChange={(e) => handleUpdate('max_iters', parseInt(e.target.value) || undefined)}
                size="small"
                inputProps={{ min: 1, max: 100 }}
              />
              <TextField
                label="Loop Condition"
                value={node.loop_condition || ''}
                onChange={(e) => handleUpdate('loop_condition', e.target.value)}
                multiline
                rows={2}
                size="small"
                placeholder="e.g., verdicts.current_fanout_item[-1].decision != 'accept'"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Merge-specific properties */}
      {node.type === 'merge' && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Merge Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl size="small" fullWidth>
                <InputLabel>Merge Strategy</InputLabel>
                <Select
                  value={node.params?.strategy || 'stitch'}
                  label="Merge Strategy"
                  onChange={(e) => handleParamsUpdate('strategy', e.target.value)}
                >
                  <MenuItem value="stitch">Stitch (with headers)</MenuItem>
                  <MenuItem value="concat_text">Concat Text</MenuItem>
                  <MenuItem value="collect_list">Collect List</MenuItem>
                  <MenuItem value="merge_dict">Merge Dictionary</MenuItem>
                  <MenuItem value="custom_template">Custom Template</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                  {node.params?.strategy === 'stitch' && 'Stitch with headers (for reporter outputs)'}
                  {node.params?.strategy === 'concat_text' && 'Concatenate text values with separator'}
                  {node.params?.strategy === 'collect_list' && 'Collect values into a list'}
                  {node.params?.strategy === 'merge_dict' && 'Merge dictionaries (deep merge)'}
                  {node.params?.strategy === 'custom_template' && 'Use custom template from params'}
                </Typography>
              </FormControl>
              <TextField
                label="Merge Key"
                value={node.params?.merge_key || ''}
                onChange={(e) => handleParamsUpdate('merge_key', e.target.value)}
                size="small"
                placeholder="final"
                helperText="Key in state to merge from (e.g., 'final', 'drafts')"
              />
              <TextField
                label="Expected Keys"
                value={
                  Array.isArray(node.params?.expected_keys)
                    ? node.params.expected_keys.join(', ')
                    : node.params?.expected_keys || ''
                }
                onChange={(e) =>
                  handleParamsUpdate(
                    'expected_keys',
                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                  )
                }
                size="small"
                placeholder="key1, key2"
                helperText="Comma-separated list of keys to wait for (join barrier)"
              />
              {node.params?.strategy === 'stitch' && (
                <>
                  <TextField
                    label="Header Template"
                    value={node.params?.header_template || '### {key}'}
                    onChange={(e) => handleParamsUpdate('header_template', e.target.value)}
                    size="small"
                    placeholder="### {key}"
                    helperText="Template for headers (use {key} placeholder)"
                  />
                  <TextField
                    label="Separator"
                    value={node.params?.separator || '\n\n---\n\n'}
                    onChange={(e) => handleParamsUpdate('separator', e.target.value)}
                    size="small"
                    placeholder="\n\n---\n\n"
                    helperText="Separator between stitched items"
                  />
                </>
              )}
              {node.params?.strategy === 'concat_text' && (
                <TextField
                  label="Separator"
                  value={node.params?.separator || '\n\n'}
                  onChange={(e) => handleParamsUpdate('separator', e.target.value)}
                  size="small"
                  placeholder="\n\n"
                  helperText="Separator between concatenated text values"
                />
              )}
              {node.params?.strategy === 'custom_template' && (
                <TextField
                  label="Template"
                  value={node.params?.template || '{items}'}
                  onChange={(e) => handleParamsUpdate('template', e.target.value)}
                  multiline
                  rows={3}
                  size="small"
                  placeholder="{items}"
                  helperText="Custom template (use {items} and {count} placeholders)"
                />
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Input/Output Mappings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">Input/Output Mappings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Inputs
              </Typography>
              {node.inputs && Object.keys(node.inputs).length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(node.inputs).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  No inputs configured
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                Outputs
              </Typography>
              {node.outputs && Object.keys(node.outputs).length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {Object.entries(node.outputs).map(([key, value]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${value}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  No outputs configured
                </Typography>
              )}
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Connection Config Dialog */}
      {onConnect && (
        <ConnectionConfigPanel
          open={connectionDialogOpen}
          onClose={() => {
            setConnectionDialogOpen(false)
            setSelectedTargetAgent(null)
          }}
          onConfirm={handleConnectionConfirm}
          sourceAgent={sourceAgent}
          targetAgent={selectedTargetAgent}
          availableAgents={availableAgents as Agent[]}
        />
      )}
    </Box>
  )
}
