/**
 * Workflow Builder Page - Visual editor for creating workflows
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  IconButton,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Delete as ClearIcon,
  CheckCircle as ValidateIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/store'
import {
  setWorkflow,
  addNode,
  clearWorkflow,
  setSelectedNode,
  setError,
} from '@/store/slices/workflowSlice'
import WorkflowGraphEditor from '@/components/Workflow/WorkflowGraphEditor'
import NodePropertyPanel from '@/components/Workflow/NodePropertyPanel'
import NodePalette from '@/components/Workflow/NodePalette'
import AgentConnectionWizard from '@/components/Workflow/AgentConnectionWizard'
import {
  saveWorkflowDefinition,
  validateWorkflowDefinition,
  executeWorkflow,
  getWorkflowDefinition,
  listWorkflows,
  setActiveWorkflow,
  getActiveWorkflow,
  getWorkflowVisualization,
  getWorkflowSummary,
  getWorkflowVersions,
  getWorkflowVersion,
  analyzeWorkflow,
} from '@/services/workflowApi'
import { getAgents } from '@/services/agentApi'
import type { WorkflowDefinition, NodeType } from '@/types/workflow'
import type { Agent } from '@/services/agentApi'
import { validateWorkflow as validateWorkflowClient } from '@/utils/workflowValidation'
import { v4 as uuidv4 } from 'uuid'

export default function WorkflowBuilderPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { currentWorkflow, selectedNodeId, error } = useSelector(
    (state: RootState) => state.workflow
  )
  const [workflowName, setWorkflowName] = useState('')
  const [workflowDescription, setWorkflowDescription] = useState('')
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [executeGoal, setExecuteGoal] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [savedWorkflows, setSavedWorkflows] = useState<Array<{ workflow_id: string; name: string; description?: string; created_at?: string; updated_at?: string }>>([])
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)
  const [connectionWizardOpen, setConnectionWizardOpen] = useState(false)
  const [isActiveWorkflow, setIsActiveWorkflow] = useState(false)
  const [visualizationDialogOpen, setVisualizationDialogOpen] = useState(false)
  const [visualizationFormat, setVisualizationFormat] = useState<'mermaid' | 'dot' | 'json'>('mermaid')
  const [visualizationContent, setVisualizationContent] = useState<string>('')
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false)
  const [workflowSummary, setWorkflowSummary] = useState<any>(null)
  const [versioningDialogOpen, setVersioningDialogOpen] = useState(false)
  const [workflowVersions, setWorkflowVersions] = useState<Array<{ version: string; created_at?: string; description?: string }>>([])
  const [analysisDialogOpen, setAnalysisDialogOpen] = useState(false)
  const [workflowAnalysis, setWorkflowAnalysis] = useState<any>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const selectedNode = currentWorkflow?.nodes.find((n) => n.id === selectedNodeId) || null

  useEffect(() => {
    loadAgents()
    loadWorkflows()
    checkActiveWorkflow()
  }, [])

  const loadAgents = async () => {
    try {
      const agents = await getAgents()
      setAvailableAgents(agents)
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const loadWorkflows = async () => {
    setIsLoadingWorkflows(true)
    try {
      const workflows = await listWorkflows()
      setSavedWorkflows(workflows)
    } catch (error) {
      console.error('Failed to load workflows:', error)
      setSnackbar({ open: true, message: 'Failed to load saved workflows', severity: 'error' })
    } finally {
      setIsLoadingWorkflows(false)
    }
  }

  const checkActiveWorkflow = async () => {
    try {
      const active = await getActiveWorkflow()
      if (active && currentWorkflow) {
        // Check if current workflow is active
        const activeWorkflowId = (active as any).workflow_id
        if (activeWorkflowId && currentWorkflow.workflow_id === activeWorkflowId) {
          setIsActiveWorkflow(true)
        }
      }
    } catch (error) {
      // No active workflow is fine
      console.debug('No active workflow found')
    }
  }

  const handleLoadWorkflow = async () => {
    if (!selectedWorkflowId) {
      setSnackbar({ open: true, message: 'Please select a workflow to load', severity: 'error' })
      return
    }

    try {
      const workflow = await getWorkflowDefinition(undefined, selectedWorkflowId)
      dispatch(setWorkflow(workflow))
      setWorkflowName(workflow.name || '')
      setWorkflowDescription(workflow.description || '')
      
      // Check if this workflow is active
      await checkActiveWorkflow()
      
      setSnackbar({ open: true, message: 'Workflow loaded successfully', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to load workflow', severity: 'error' })
    }
  }

  const handleWorkflowChange = useCallback(
    (workflow: WorkflowDefinition) => {
      dispatch(setWorkflow(workflow))
    },
    [dispatch]
  )

  const handleNodeTypeSelect = useCallback(
    (type: NodeType) => {
      const newNodeId = `${type}_${uuidv4().substring(0, 8)}`
      const newNode = {
        id: newNodeId,
        type,
        inputs: {},
        outputs: {},
        params: {},
      }
      dispatch(addNode(newNode))
      dispatch(setSelectedNode(newNodeId))
    },
    [dispatch]
  )

  const handleSave = async () => {
    if (!currentWorkflow) {
      setSnackbar({ open: true, message: 'No workflow to save', severity: 'error' })
      return
    }

    try {
      const workflowToSave: WorkflowDefinition = {
        ...currentWorkflow,
        name: workflowName || currentWorkflow.name || 'Untitled Workflow',
        description: workflowDescription || currentWorkflow.description,
      }
      const saveResult = await saveWorkflowDefinition(workflowToSave, workflowName)
      
      // Set as active workflow if isActiveWorkflow is true
      if (isActiveWorkflow && saveResult.workflow_id) {
        try {
          await setActiveWorkflow(saveResult.workflow_id)
          setSnackbar({ open: true, message: 'Workflow saved and set as active successfully', severity: 'success' })
        } catch (error: any) {
          // Workflow saved but failed to set as active
          setSnackbar({ open: true, message: `Workflow saved but failed to set as active: ${error.message}`, severity: 'warning' })
        }
      } else {
        setSnackbar({ open: true, message: 'Workflow saved successfully', severity: 'success' })
      }
      
      // Refresh the workflow list to include the newly saved workflow
      await loadWorkflows()
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to save workflow', severity: 'error' })
    }
  }

  const handleValidate = async () => {
    if (!currentWorkflow) {
      setSnackbar({ open: true, message: 'No workflow to validate', severity: 'error' })
      return
    }

    // Client-side validation first
    const clientErrors = validateWorkflowClient(currentWorkflow)
    if (clientErrors.length > 0) {
      setSnackbar({
        open: true,
        message: `Validation errors: ${clientErrors.map((e) => e.message).join(', ')}`,
        severity: 'error',
      })
      return
    }

    // Backend validation
    try {
      const result = await validateWorkflowDefinition(currentWorkflow)
      if (result.valid) {
        setSnackbar({ open: true, message: 'Workflow is valid', severity: 'success' })
      } else {
        setSnackbar({
          open: true,
          message: `Validation errors: ${result.errors?.join(', ')}`,
          severity: 'error',
        })
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Validation failed', severity: 'error' })
    }
  }

  const handleExecute = async () => {
    if (!currentWorkflow || !executeGoal) {
      setSnackbar({ open: true, message: 'Please enter a goal', severity: 'error' })
      return
    }

    setIsExecuting(true)
    try {
      const result = await executeWorkflow({
        goal: executeGoal,
        use_graph: true,
        workflow_definition: currentWorkflow, // Pass the workflow definition directly
      })
      setSnackbar({
        open: true,
        message: `Workflow executed successfully. Run ID: ${result.run_id}`,
        severity: 'success',
      })
      setExecuteDialogOpen(false)
      setExecuteGoal('')
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Execution failed', severity: 'error' })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleExport = () => {
    if (!currentWorkflow) {
      setSnackbar({ open: true, message: 'No workflow to export', severity: 'error' })
      return
    }

    const dataStr = JSON.stringify(currentWorkflow, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflowName || 'workflow'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const workflow = JSON.parse(e.target?.result as string) as WorkflowDefinition
        dispatch(setWorkflow(workflow))
        setWorkflowName(workflow.name || '')
        setWorkflowDescription(workflow.description || '')
        setSnackbar({ open: true, message: 'Workflow imported successfully', severity: 'success' })
      } catch (err) {
        setSnackbar({ open: true, message: 'Failed to parse workflow file', severity: 'error' })
      }
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    dispatch(clearWorkflow())
    setWorkflowName('')
    setWorkflowDescription('')
  }

  const handleVisualize = async () => {
    if (!currentWorkflow) {
      setSnackbar({ open: true, message: 'No workflow to visualize', severity: 'error' })
      return
    }

    try {
      // Try to get visualization from backend if workflow has an ID
      if (currentWorkflow.workflow_id) {
        try {
          const visualization = await getWorkflowVisualization(currentWorkflow.workflow_id, visualizationFormat)
          if (visualization.content) {
            setVisualizationContent(visualization.content)
          } else if (visualization.graph) {
            setVisualizationContent(JSON.stringify(visualization.graph, null, 2))
          }
          setVisualizationDialogOpen(true)
          return
        } catch (error) {
          // Fall through to client-side generation
          console.debug('Backend visualization failed, using client-side generation')
        }
      }
      
      // Client-side visualization generation
      if (visualizationFormat === 'json') {
        setVisualizationContent(JSON.stringify(currentWorkflow, null, 2))
      } else {
        // Generate simple Mermaid or DOT format
        const nodes = currentWorkflow.nodes.map(n => n.id).join(', ')
        const edges = currentWorkflow.edges.map(e => `${e.from_node} --> ${e.to_node}`).join('\n    ')
        
        if (visualizationFormat === 'mermaid') {
          setVisualizationContent(`graph LR\n    ${currentWorkflow.nodes.map(n => `${n.id}[${n.id}]`).join('\n    ')}\n    ${edges}`)
        } else {
          setVisualizationContent(`digraph workflow {\n    ${currentWorkflow.nodes.map(n => `"${n.id}"`).join('; ')}\n    ${currentWorkflow.edges.map(e => `"${e.from_node}" -> "${e.to_node}"`).join('\n    ')}\n}`)
        }
      }
      
      setVisualizationDialogOpen(true)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to generate visualization', severity: 'error' })
    }
  }

  const handleViewSummary = async () => {
    if (!currentWorkflow) {
      setSnackbar({ open: true, message: 'No workflow to summarize', severity: 'error' })
      return
    }

    try {
      // Try to get summary from backend if workflow has an ID
      if (currentWorkflow.workflow_id) {
        try {
          const summary = await getWorkflowSummary(currentWorkflow.workflow_id)
          setWorkflowSummary(summary)
          setSummaryDialogOpen(true)
          return
        } catch (error) {
          // Fall through to client-side generation
          console.debug('Backend summary failed, using client-side generation')
        }
      }
      
      // Client-side summary generation
      const nodeTypes = [...new Set(currentWorkflow.nodes.map(n => n.type))]
      const terminalNodes = currentWorkflow.nodes
        .filter(n => !currentWorkflow.edges.some(e => e.from_node === n.id))
        .map(n => n.id)
      const hasLoops = currentWorkflow.nodes.some(n => n.type === 'loop')
      
      const summary = {
        total_nodes: currentWorkflow.nodes.length,
        total_edges: currentWorkflow.edges.length,
        entry_node: currentWorkflow.entry_node_id || currentWorkflow.nodes[0]?.id || 'N/A',
        has_loops,
        node_types: nodeTypes,
        terminal_nodes,
      }
      
      setWorkflowSummary(summary)
      setSummaryDialogOpen(true)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to get workflow summary', severity: 'error' })
    }
  }

  const handleViewVersions = async () => {
    if (!currentWorkflow?.workflow_id) {
      setSnackbar({ open: true, message: 'Workflow must be saved to view versions', severity: 'error' })
      return
    }

    try {
      const versions = await getWorkflowVersions(currentWorkflow.workflow_id)
      setWorkflowVersions(versions)
      setVersioningDialogOpen(true)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to load workflow versions', severity: 'error' })
    }
  }

  const handleLoadVersion = async (version: string) => {
    if (!currentWorkflow?.workflow_id) return

    try {
      const versionWorkflow = await getWorkflowVersion(currentWorkflow.workflow_id, version)
      dispatch(setWorkflow(versionWorkflow))
      setWorkflowName(versionWorkflow.name || '')
      setWorkflowDescription(versionWorkflow.description || '')
      setVersioningDialogOpen(false)
      setSnackbar({ open: true, message: `Loaded version ${version}`, severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to load version', severity: 'error' })
    }
  }

  const handleGenerateWorkflow = (generatedWorkflow: WorkflowDefinition) => {
    // Merge generated workflow with current workflow
    if (currentWorkflow) {
      const mergedNodes = [...currentWorkflow.nodes, ...generatedWorkflow.nodes]
      const mergedEdges = [...currentWorkflow.edges, ...generatedWorkflow.edges]
      dispatch(
        setWorkflow({
          ...currentWorkflow,
          nodes: mergedNodes,
          edges: mergedEdges,
          entry_node_id: currentWorkflow.entry_node_id || generatedWorkflow.entry_node_id,
        })
      )
    } else {
      // No current workflow, use generated one
      dispatch(setWorkflow(generatedWorkflow))
      setWorkflowName(generatedWorkflow.name || '')
      setWorkflowDescription(generatedWorkflow.description || '')
    }
    setSnackbar({ open: true, message: 'Workflow structure generated successfully', severity: 'success' })
  }

  const handleConnectAgent = (
    sourceNodeId: string,
    targetAgentId: string,
    config?: import('@/utils/agentWorkflowGenerator').ConnectionConfig
  ) => {
    if (!currentWorkflow) {
      setSnackbar({ open: true, message: 'No workflow to connect agents in', severity: 'error' })
      return
    }

    const targetAgent = availableAgents.find((a) => a.id === targetAgentId)
    if (!targetAgent) {
      setSnackbar({ open: true, message: 'Target agent not found', severity: 'error' })
      return
    }

    // Check if target node already exists
    let targetNode = currentWorkflow.nodes.find((n) => n.agent_id === targetAgentId && n.type === 'agent')
    
    // Create target node if it doesn't exist
    if (!targetNode) {
      const newNodeId = targetAgentId.toLowerCase().replace(/\s+/g, '_')
      targetNode = {
        id: newNodeId,
        type: 'agent',
        agent_id: targetAgentId,
        inputs: config?.targetInputPath ? { goal: config.targetInputPath } : {},
        outputs: { result: newNodeId },
        params: {},
      }
      dispatch(addNode(targetNode))
    }

    // Create edge
    const newEdge = {
      from_node: sourceNodeId,
      to_node: targetNode.id,
      condition: config?.condition,
    }

    // If autoConditional is enabled and condition exists, create conditional node
    if (config?.autoConditional && config.condition) {
      const conditionalNodeId = `conditional_${uuidv4().substring(0, 8)}`
      const conditionalNode = {
        id: conditionalNodeId,
        type: 'conditional' as const,
        condition: config.condition,
        params: {},
      }
      dispatch(addNode(conditionalNode))

      // Update edges: source -> conditional -> target
      const edges = [
        { from_node: sourceNodeId, to_node: conditionalNodeId },
        { from_node: conditionalNodeId, to_node: targetNode.id, condition: config.condition },
      ]
      dispatch(
        setWorkflow({
          ...currentWorkflow,
          edges: [...currentWorkflow.edges, ...edges],
        })
      )
    } else {
      // Direct connection
      dispatch(
        setWorkflow({
          ...currentWorkflow,
          edges: [...currentWorkflow.edges, newEdge],
        })
      )
    }

    setSnackbar({ open: true, message: 'Agents connected successfully', severity: 'success' })
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Paper sx={{ p: 1, mb: 1 }}>
        <Toolbar disableGutters>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 2, fontWeight: 600 }}>
            Workflow Builder
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Load Workflow</InputLabel>
              <Select
                value={selectedWorkflowId}
                label="Load Workflow"
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
                disabled={isLoadingWorkflows}
              >
                <MenuItem value="">
                  <em>Select a workflow...</em>
                </MenuItem>
                {savedWorkflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="outlined"
              size="small"
              onClick={handleLoadWorkflow}
              disabled={!selectedWorkflowId || isLoadingWorkflows}
            >
              Load
            </Button>
            <TextField
              size="small"
              placeholder="Workflow name"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={isActiveWorkflow}
                  onChange={(e) => setIsActiveWorkflow(e.target.checked)}
                  size="small"
                />
              }
              label="Set as Active"
              sx={{ ml: 1 }}
            />
            {isActiveWorkflow && (
              <Chip
                label="Will be set as active"
                color="primary"
                size="small"
                sx={{ ml: 1 }}
              />
            )}
            <Button
              variant="contained"
              size="small"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!currentWorkflow}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ValidateIcon />}
              onClick={handleValidate}
              disabled={!currentWorkflow}
            >
              Validate
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<PlayIcon />}
              onClick={() => setExecuteDialogOpen(true)}
              disabled={!currentWorkflow}
            >
              Execute
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ExportIcon />}
              onClick={handleExport}
              disabled={!currentWorkflow}
            >
              Export
            </Button>
            <Button variant="outlined" size="small" component="label" startIcon={<ImportIcon />}>
              Import
              <input type="file" accept=".json" hidden onChange={handleImport} />
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleVisualize}
              disabled={!currentWorkflow}
            >
              Visualize
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleViewSummary}
              disabled={!currentWorkflow}
            >
              Summary
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setConnectionWizardOpen(true)}
            >
              Connect Agents
            </Button>
            {currentWorkflow?.workflow_id && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleViewVersions}
                  disabled={!currentWorkflow.workflow_id}
                >
                  Versions
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAnalyze}
                  disabled={!currentWorkflow.workflow_id}
                >
                  Analyze
                </Button>
              </>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={handleClear}
              color="error"
            >
              Clear
            </Button>
          </Box>
        </Toolbar>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, gap: 1, overflow: 'hidden' }}>
        {/* Node Palette */}
        <Box sx={{ width: 200, borderRight: 1, borderColor: 'divider' }}>
          <NodePalette onNodeTypeSelect={handleNodeTypeSelect} />
        </Box>

        {/* Graph Editor */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <WorkflowGraphEditor
            workflow={currentWorkflow}
            onWorkflowChange={handleWorkflowChange}
            readOnly={false}
          />
        </Box>

        {/* Property Panel */}
        <Box sx={{ width: 350, borderLeft: 1, borderColor: 'divider' }}>
          <NodePropertyPanel
            node={selectedNode}
            availableAgents={availableAgents}
            onUpdate={(nodeId, updates) => {
              // Update node in workflow
              if (currentWorkflow) {
                const updatedNodes = currentWorkflow.nodes.map((n) =>
                  n.id === nodeId ? { ...n, ...updates } : n
                )
                dispatch(setWorkflow({ ...currentWorkflow, nodes: updatedNodes }))
              }
            }}
            onDelete={(nodeId) => {
              if (currentWorkflow) {
                const updatedNodes = currentWorkflow.nodes.filter((n) => n.id !== nodeId)
                const updatedEdges = currentWorkflow.edges.filter(
                  (e) => e.from_node !== nodeId && e.to_node !== nodeId
                )
                dispatch(setWorkflow({ ...currentWorkflow, nodes: updatedNodes, edges: updatedEdges }))
                dispatch(setSelectedNode(null))
              }
            }}
            onConnect={handleConnectAgent}
          />
        </Box>
      </Box>

      {/* Execute Dialog */}
      <Dialog open={executeDialogOpen} onClose={() => setExecuteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Execute Workflow</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Goal"
            fullWidth
            multiline
            rows={4}
            value={executeGoal}
            onChange={(e) => setExecuteGoal(e.target.value)}
            placeholder="Enter the goal for this workflow execution..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecuteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleExecute} variant="contained" disabled={isExecuting || !executeGoal}>
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Agent Connection Wizard */}
      <AgentConnectionWizard
        open={connectionWizardOpen}
        onClose={() => setConnectionWizardOpen(false)}
        onGenerate={handleGenerateWorkflow}
        availableAgents={availableAgents}
      />

      {/* Visualization Dialog */}
      <Dialog
        open={visualizationDialogOpen}
        onClose={() => setVisualizationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Workflow Visualization
          <FormControl size="small" sx={{ ml: 2, minWidth: 120 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={visualizationFormat}
              label="Format"
              onChange={(e) => setVisualizationFormat(e.target.value as 'mermaid' | 'dot' | 'json')}
            >
              <MenuItem value="mermaid">Mermaid</MenuItem>
              <MenuItem value="dot">DOT</MenuItem>
              <MenuItem value="json">JSON</MenuItem>
            </Select>
          </FormControl>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {visualizationFormat === 'json' ? (
              <pre style={{ fontSize: '0.875rem', overflow: 'auto', background: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
                {visualizationContent}
              </pre>
            ) : (
              <Box
                component="pre"
                sx={{
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  background: '#f5f5f5',
                  padding: '1rem',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {visualizationContent}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            navigator.clipboard.writeText(visualizationContent)
            setSnackbar({ open: true, message: 'Visualization copied to clipboard', severity: 'success' })
          }}>
            Copy
          </Button>
          <Button onClick={() => setVisualizationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog
        open={summaryDialogOpen}
        onClose={() => setSummaryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Workflow Summary</DialogTitle>
        <DialogContent>
          {workflowSummary && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Total Nodes:</strong> {workflowSummary.total_nodes || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Edges:</strong> {workflowSummary.total_edges || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Entry Node:</strong> {workflowSummary.entry_node || 'N/A'}
                </Typography>
                {workflowSummary.has_loops !== undefined && (
                  <Typography variant="body2">
                    <strong>Has Loops:</strong> {workflowSummary.has_loops ? 'Yes' : 'No'}
                  </Typography>
                )}
                {workflowSummary.node_types && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Node Types:</strong> {workflowSummary.node_types.join(', ')}
                  </Typography>
                )}
              </Box>
              {workflowSummary.terminal_nodes && workflowSummary.terminal_nodes.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Terminal Nodes
                  </Typography>
                  <Typography variant="body2">
                    {workflowSummary.terminal_nodes.join(', ')}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSummaryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Versioning Dialog */}
      <Dialog
        open={versioningDialogOpen}
        onClose={() => setVersioningDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Workflow Versions</DialogTitle>
        <DialogContent>
          {workflowVersions.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2 }}>
              No versions available for this workflow
            </Typography>
          ) : (
            <Box sx={{ mt: 2 }}>
              {workflowVersions.map((version) => (
                <Paper
                  key={version.version}
                  sx={{
                    p: 2,
                    mb: 1,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => handleLoadVersion(version.version)}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Version {version.version}
                      </Typography>
                      {version.description && (
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                          {version.description}
                        </Typography>
                      )}
                      {version.created_at && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {new Date(version.created_at).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                    <Button size="small" variant="outlined">
                      Load
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersioningDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Analysis Dialog */}
      <Dialog
        open={analysisDialogOpen}
        onClose={() => setAnalysisDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Workflow Analysis & Optimization</DialogTitle>
        <DialogContent>
          {workflowAnalysis && (
            <Box sx={{ mt: 2 }}>
              {workflowAnalysis.recommendations && workflowAnalysis.recommendations.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                    Optimization Recommendations
                  </Typography>
                  {workflowAnalysis.recommendations.map((rec: any, index: number) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'start', gap: 1 }}>
                        <Chip
                          label={rec.severity || 'info'}
                          size="small"
                          color={
                            rec.severity === 'high'
                              ? 'error'
                              : rec.severity === 'medium'
                              ? 'warning'
                              : 'default'
                          }
                        />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {rec.type || 'Recommendation'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {rec.description || rec.message}
                          </Typography>
                          {rec.impact && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                              Impact: {rec.impact}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No optimization recommendations available
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnalysisDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
