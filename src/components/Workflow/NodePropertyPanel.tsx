/**
 * Node Property Panel - Dynamic form for editing node properties
 */

import React, { useState, useEffect } from 'react'
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
  Checkbox,
  ListItemText,
  CircularProgress,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon, Link as LinkIcon, Delete as DeleteIcon, Build as BuildIcon, Save as SaveIcon } from '@mui/icons-material'
import type { WorkflowNode, NodeType } from '@/types/workflow'
import ConnectionConfigPanel from './ConnectionConfigPanel'
import AgentManagementDialog from './AgentManagementDialog'
import ManageToolsDialog from './ManageToolsDialog'
import { type Agent } from '@/services/agentApi'
import { getAgentTools, assignToolsToAgent, type Tool } from '@/services/toolsApi'
import type { ConnectionConfig } from '@/utils/agentWorkflowGenerator'

interface NodePropertyPanelProps {
  node: WorkflowNode | null
  workflow?: { nodes: WorkflowNode[]; edges: Array<{ from_node: string; to_node: string }> } | null
  availableAgents?: Agent[]
  onUpdate: (nodeId: string, updates: Partial<WorkflowNode>) => void
  onDelete?: (nodeId: string) => void
  onConnect?: (sourceNodeId: string, targetAgentId: string, config?: ConnectionConfig) => void
  onAgentsUpdated?: () => void | Promise<void>
  onShowMessage?: (message: string, severity: 'success' | 'error') => void
}

export default function NodePropertyPanel({
  node,
  workflow,
  availableAgents = [] as Agent[],
  onUpdate,
  onDelete,
  onConnect,
  onAgentsUpdated,
  onShowMessage,
}: NodePropertyPanelProps) {
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)
  const [selectedTargetAgent, setSelectedTargetAgent] = useState<Agent | null>(null)
  const [agentManagementDialogOpen, setAgentManagementDialogOpen] = useState(false)
  const [manageToolsDialogOpen, setManageToolsDialogOpen] = useState(false)
  const [tools, setTools] = useState<Tool[]>([])
  const [assignedToolIds, setAssignedToolIds] = useState<string[]>([])
  const [selectedToolIds, setSelectedToolIds] = useState<string[]>([])
  const [loadingAgentTools, setLoadingAgentTools] = useState(false)
  const [savingTools, setSavingTools] = useState(false)

  const fetchAgentTools = React.useCallback(async (agentId: string) => {
    setLoadingAgentTools(true)
    try {
      const { tools: t, assigned_ids: a } = await getAgentTools(agentId)
      setTools(t)
      const validIds = a.filter((id) => t.some((x) => x.id === id))
      setAssignedToolIds(validIds)
      setSelectedToolIds(validIds)
    } catch {
      setTools([])
      setAssignedToolIds([])
      setSelectedToolIds([])
    } finally {
      setLoadingAgentTools(false)
    }
  }, [])

  useEffect(() => {
    if (!node || node.type !== 'agent' || !node.agent_id) {
      setTools([])
      setAssignedToolIds([])
      setSelectedToolIds([])
      return
    }
    fetchAgentTools(node.agent_id)
  }, [node?.id, node?.type, node?.agent_id, fetchAgentTools])

  useEffect(() => {
    setSelectedToolIds((prev) => prev.filter((id) => tools.some((x) => x.id === id)))
  }, [tools])

  const handleToolsSave = async () => {
    if (!node?.agent_id || node.type !== 'agent') return
    setSavingTools(true)
    try {
      await assignToolsToAgent(node.agent_id, selectedToolIds)
      setAssignedToolIds(selectedToolIds)
      onAgentsUpdated?.()
      onShowMessage?.('Tools saved to agent successfully', 'success')
    } catch (e) {
      onShowMessage?.(e instanceof Error ? e.message : 'Failed to save tools', 'error')
    } finally {
      setSavingTools(false)
    }
  }

  const handleToolCreated = () => {
    if (node?.agent_id && node.type === 'agent') fetchAgentTools(node.agent_id)
  }

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
            startIcon={<DeleteIcon />}
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

            {/* Agent Information - Show when agent node has selected agent */}
            {node.type === 'agent' && sourceAgent && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5, fontWeight: 600 }}>
                  Agent Information
                </Typography>
                <TextField
                  label="Agent Name"
                  value={sourceAgent.name || 'N/A'}
                  size="small"
                  disabled
                  fullWidth
                />
                <TextField
                  label="Agent ID"
                  value={sourceAgent.id || 'N/A'}
                  size="small"
                  disabled
                  fullWidth
                  sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                />
                {sourceAgent.model && (
                  <TextField
                    label="Model"
                    value={sourceAgent.model}
                    size="small"
                    disabled
                    fullWidth
                  />
                )}
                {sourceAgent.description && (
                  <TextField
                    label="Description"
                    value={sourceAgent.description}
                    size="small"
                    disabled
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
                {sourceAgent.instructions && (
                  <TextField
                    label="Instructions"
                    value={sourceAgent.instructions}
                    size="small"
                    disabled
                    fullWidth
                    multiline
                    rows={4}
                  />
                )}
              </>
            )}

            {/* Show message if agent node but no agent selected */}
            {node.type === 'agent' && !sourceAgent && node.agent_id && (
              <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                Agent {node.agent_id} not found in available agents list
              </Typography>
            )}
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
                      <strong>{agent.name}</strong> &ensp; ({agent.id})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {!node.agent_id && (
                <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                  Select an agent from the dropdown above to configure this node
                </Typography>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => setAgentManagementDialogOpen(true)}
                >
                  Manage Agents
                </Button>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Tools Configuration - only for agent nodes. No agent: message only; no dropdown, Manage Tools, or Save. */}
      {node.type === 'agent' && (
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle2">Tools Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {!node.agent_id && (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  Select an agent above to configure tools.
                </Typography>
              )}
              {node.agent_id && (
                <>
                  <FormControl size="small" fullWidth disabled={loadingAgentTools}>
                    <InputLabel id="tools-select-label" shrink>
                      Select Tools
                    </InputLabel>
                    <Select
                      multiple
                      value={selectedToolIds}
                      labelId="tools-select-label"
                      label="Select Tools"
                      onChange={(e) => setSelectedToolIds(e.target.value as string[])}
                      displayEmpty
                      notched
                      renderValue={(sel) => {
                        const validSel = sel.filter((id) => tools.some((x) => x.id === id))
                        if (validSel.length === 0) {
                          return <span style={{ color: 'rgba(0, 0, 0, 0.6)' }}>No tools selected</span>
                        }
                        return (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {validSel.map((id) => {
                              const o = tools.find((x) => x.id === id)
                              return <Chip key={id} label={o?.name || id} size="small" sx={{ height: 24 }} />
                            })}
                          </Box>
                        )
                      }}
                    >
                      {tools.length === 0 ? (
                        <MenuItem disabled value="__empty__">
                          <ListItemText primary="No tools available" primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }} />
                        </MenuItem>
                      ) : (
                        tools.map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            <Checkbox checked={selectedToolIds.indexOf(opt.id) > -1} />
                            <ListItemText primary={opt.name} />
                          </MenuItem>
                        ))
                      )}
                    </Select>
                    {tools.length === 0 && !loadingAgentTools && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        Create tools with Manage Tools, then assign them here.
                      </Typography>
                    )}
                  </FormControl>
                  {loadingAgentTools && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="caption" color="text.secondary">
                        Loading agent tools…
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<BuildIcon />}
                      onClick={() => setManageToolsDialogOpen(true)}
                    >
                      Manage Tools
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      startIcon={savingTools ? <CircularProgress size={14} /> : <SaveIcon />}
                      disabled={savingTools}
                      onClick={handleToolsSave}
                    >
                      Save
                    </Button>
                  </Box>
                </>
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
      {node.type === 'fanout' && (() => {
        // Derive branches from graph edges
        const outgoingEdges = workflow?.edges?.filter(e => e.from_node === node.id) || []
        const derivedBranches = [...new Set(outgoingEdges.map(e => e.to_node))]

        return (
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">Branches</Typography>
              &ensp;
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0 }}>
                (Derived from connections)
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Branch nodes are automatically derived from outgoing connections.
                </Typography>
                {derivedBranches.length > 0 ? (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {derivedBranches.map(branchId => (
                      <Chip
                        key={branchId}
                        label={branchId}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                    Connect at least two nodes to create parallel branches.
                  </Typography>
                )}
                {derivedBranches.length === 1 && (
                  <Typography variant="caption" sx={{ color: 'warning.main' }}>
                    ⚠️ Parallel workflows require at least 2 branches.
                  </Typography>
                )}
              </Box>
            </AccordionDetails>
          </Accordion>
        )
      })()}

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
                  value={node.params?.strategy || 'concat_text'}
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
          availableAgents={availableAgents}
        />
      )}

      {/* Agent Management Dialog */}
      <AgentManagementDialog
        open={agentManagementDialogOpen}
        onClose={() => setAgentManagementDialogOpen(false)}
        onAgentsUpdated={() => {
          onAgentsUpdated?.()
        }}
      />

      {/* Manage Tools Dialog */}
      <ManageToolsDialog
        open={manageToolsDialogOpen}
        onClose={() => setManageToolsDialogOpen(false)}
        onToolChange={handleToolCreated}
      />
    </Box>
  )
}
