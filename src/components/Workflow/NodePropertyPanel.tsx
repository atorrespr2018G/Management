/**
 * Node Property Panel - Dynamic form for editing node properties
 */

import React from 'react'
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
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import type { WorkflowNode, NodeType } from '@/types/workflow'

interface NodePropertyPanelProps {
  node: WorkflowNode | null
  availableAgents?: Array<{ id: string; name: string }>
  onUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onDelete?: (nodeId: string) => void
}

export default function NodePropertyPanel({
  node,
  availableAgents = [],
  onUpdate,
  onDelete,
}: NodePropertyPanelProps) {
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
                <InputLabel>Agent</InputLabel>
                <Select
                  value={node.agent_id || ''}
                  label="Agent"
                  onChange={(e) => handleUpdate('agent_id', e.target.value)}
                >
                  {availableAgents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              <TextField
                label="Merge Key"
                value={node.params?.merge_key || ''}
                onChange={(e) => handleParamsUpdate('merge_key', e.target.value)}
                size="small"
                placeholder="final"
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
                helperText="Comma-separated list of keys to wait for"
              />
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
    </Box>
  )
}
