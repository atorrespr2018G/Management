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
  Chip,
  Menu,
} from '@mui/material'
import {
  Save as SaveIcon,
  FileUpload as ImportIcon,
  FileDownload as ExportIcon,
  Delete as DeleteIcon,
  Cancel as ClearIcon,
  CheckCircle as ValidateIcon,
  PlayArrow as PlayIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import type { AppDispatch, RootState } from '@/store/store'
import {
  setWorkflow,
  addNode,
  addEdge,
  clearWorkflow,
  setSelectedNode,
  setError,
  deleteNode,
} from '@/store/slices/workflowSlice'
import WorkflowGraphEditor from '@/components/Workflow/WorkflowGraphEditor'
import NodePropertyPanel from '@/components/Workflow/NodePropertyPanel'
import NodePalette from '@/components/Workflow/NodePalette'
import {
  saveWorkflowDefinition,
  validateWorkflowDefinition,
  executeWorkflow,
  getWorkflowDefinition,
  listWorkflows,
  deleteWorkflow,
  setActiveWorkflow,
  getActiveWorkflow,
  getWorkflowVisualization,
  getWorkflowSummary,
  getWorkflowVersions,
  getWorkflowVersion,
  getAIRecommendations,
} from '@/services/workflowApi'
import { getAgents, getAllAgents } from '@/services/agentApi'
import type { WorkflowDefinition, NodeType, WorkflowEdge } from '@/types/workflow'
import type { Agent } from '@/services/agentApi'
import { validateWorkflow as validateWorkflowClient } from '@/utils/workflowValidation'
import { createLoopCluster } from '@/utils/loopClusterUtils'
import { serializeWorkflowForBackend, deserializeWorkflowFromBackend, validateBeforeSave } from '@/utils/workflowSerialization'
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
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [savedWorkflows, setSavedWorkflows] = useState<Array<{ workflow_id: string; name: string; description?: string; created_at?: string; updated_at?: string }>>([])
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)
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

  // const loadAgents = async () => {
  //   try {
  //     // Fetch agents from both config and Foundry, then combine and deduplicate
  //     const [configAgentsResult, foundryAgentsResult] = await Promise.allSettled([
  //       getAgents(), // Config-based agents
  //       getAllAgents().catch(() => []), // Foundry agents (fallback to empty array on error)
  //     ])

  //     const configAgents = configAgentsResult.status === 'fulfilled' ? configAgentsResult.value : []
  //     const foundryAgents = foundryAgentsResult.status === 'fulfilled' ? foundryAgentsResult.value : []

  //     // Combine and deduplicate by ID
  //     const agentMap = new Map<string, Agent>()

  //     // Add config agents first
  //     configAgents.forEach(agent => {
  //       if (agent.id) {
  //         agentMap.set(agent.id, agent)
  //       }
  //     })

  //     // Add Foundry agents (will overwrite config agents with same ID if they have more info)
  //     foundryAgents.forEach(agent => {
  //       if (agent.id) {
  //         // If agent already exists, merge the data (prefer Foundry data for name/description)
  //         const existing = agentMap.get(agent.id)
  //         if (existing) {
  //           agentMap.set(agent.id, {
  //             ...existing,
  //             ...agent, // Foundry data takes precedence
  //           })
  //         } else {
  //           agentMap.set(agent.id, agent)
  //         }
  //       }
  //     })

  //     setAvailableAgents(Array.from(agentMap.values()))
  //   } catch (error) {
  //     console.error('Failed to load agents:', error)
  //     // Fallback to just config agents
  //     try {
  //       const configAgents = await getAgents()
  //       setAvailableAgents(configAgents)
  //     } catch (fallbackError) {
  //       console.error('Failed to load config agents:', fallbackError)
  //       setAvailableAgents([])
  //     }
  //   }
  // }

  const handleAgentsUpdated = async () => {
    // Refresh agents list when agents are created/updated/deleted
    await loadAgents()
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

      // Deserialize backend format to UI format (reconstitute loop clusters)
      const { nodes: uiNodes, edges: uiEdges } = deserializeWorkflowFromBackend(workflow)

      // Ensure workflow_id is preserved
      const workflowWithId = {
        ...workflow,
        nodes: uiNodes,
        edges: uiEdges,
        workflow_id: workflow.workflow_id || selectedWorkflowId
      }

      dispatch(setWorkflow(workflowWithId))
      setWorkflowName(workflow.name || '')
      setWorkflowDescription(workflow.description || '')

      // Check if this workflow is active
      await checkActiveWorkflow()

      setSnackbar({ open: true, message: 'Workflow loaded successfully', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to load workflow', severity: 'error' })
    }
  }

  const handleDeleteWorkflow = async () => {
    const workflowIdToDelete = currentWorkflow?.workflow_id || selectedWorkflowId

    if (!workflowIdToDelete) {
      setSnackbar({ open: true, message: 'No workflow loaded to delete', severity: 'error' })
      return
    }

    if (!confirm(`Are you sure you want to delete workflow "${currentWorkflow?.name || workflowIdToDelete}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteWorkflow(workflowIdToDelete)
      // Clear the current workflow from the screen
      dispatch(clearWorkflow())
      setWorkflowName('')
      setWorkflowDescription('')
      setSelectedWorkflowId('')
      setIsActiveWorkflow(false)
      // Refresh the workflow list
      await loadWorkflows()
      setSnackbar({ open: true, message: 'Workflow deleted successfully', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to delete workflow', severity: 'error' })
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
      // Special handling for loop: create 3-card cluster
      if (type === 'loop') {
        const { loopNode, bodyNode, exitNode } = createLoopCluster()

        // Add all three nodes
        dispatch(addNode(loopNode))
        dispatch(addNode(bodyNode))
        dispatch(addNode(exitNode))

        // Add UI-only visual connections using two-port topology: Loop → Body, Loop → Exit
        dispatch(addEdge({ from_node: loopNode.id, to_node: bodyNode.id, condition: '__ui_cluster__' }))
        dispatch(addEdge({ from_node: loopNode.id, to_node: exitNode.id, condition: '__ui_cluster__' }))

        dispatch(setSelectedNode(loopNode.id))

        return
      }

      // For click-based addition, add to center of viewport
      // Position will be set by ReactFlow's default layout
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

  const handleNodeDrop = useCallback(
    (nodeType: string, position: { x: number; y: number }) => {
      // Special handling for loop: create 3-card cluster
      if (nodeType === 'loop') {
        const { loopNode, bodyNode, exitNode } = createLoopCluster()

        // Add position to loop node
        // Add position to nodes, merging with existing params
        loopNode.params = { ...loopNode.params, position }
        bodyNode.params = { ...bodyNode.params, position: { x: position.x + 200, y: position.y } }
        exitNode.params = { ...exitNode.params, position: { x: position.x + 400, y: position.y } }

        // Add all three nodes
        dispatch(addNode(loopNode))
        dispatch(addNode(bodyNode))
        dispatch(addNode(exitNode))

        // Add UI-only visual connections using two-port topology: Loop → Body, Loop → Exit
        dispatch(addEdge({ from_node: loopNode.id, to_node: bodyNode.id, condition: '__ui_cluster__' }))
        dispatch(addEdge({ from_node: loopNode.id, to_node: exitNode.id, condition: '__ui_cluster__' }))

        dispatch(setSelectedNode(loopNode.id))

        return
      }

      const newNodeId = `${nodeType}_${uuidv4().substring(0, 8)}`
      const newNode = {
        id: newNodeId,
        type: nodeType as NodeType,
        inputs: {},
        outputs: {},
        params: {
          position,
        },
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
      // Validate loop clusters before save
      const validationErrors = validateBeforeSave(currentWorkflow.nodes, currentWorkflow.edges)
      if (validationErrors.length > 0) {
        setSnackbar({
          open: true,
          message: `Validation errors: ${validationErrors.join('. ')}`,
          severity: 'error'
        })
        return
      }

      // Serialize UI format to backend format
      const { nodes: backendNodes, edges: backendEdges } = serializeWorkflowForBackend(
        currentWorkflow.nodes,
        currentWorkflow.edges
      )

      // PHASE 1 RESTRICTION: Loop cannot be graph entry
      const entryNode = currentWorkflow.nodes.find(n => n.id === currentWorkflow.entry_node_id)
      if (entryNode?.type === 'loop') {
        setSnackbar({
          open: true,
          message: 'Loop cannot be the graph entry in Phase 1. Add an upstream node that produces non-empty output.',
          severity: 'error'
        })
        return
      }

      // CRITICAL: Assert no UI cluster edges leaked through
      const leakedUIEdges = backendEdges.filter(e =>
        e.condition?.includes('ui_cluster')
      )

      if (leakedUIEdges.length > 0) {
        console.error('🚨 UI CLUSTER LEAK DETECTED:', leakedUIEdges)
        setSnackbar({
          open: true,
          message: `Cannot save: ${leakedUIEdges.length} UI cluster edge(s) leaked into backend payload. This is a bug - please report it.`,
          severity: 'error'
        })
        return
      }

      // Verify all loop nodes have required edges
      const loopNodes = backendNodes.filter(n => n.type === 'loop')
      for (const loop of loopNodes) {
        const loopEdges = backendEdges.filter(e => e.from_node === loop.id)
        const hasContinue = loopEdges.some(e => e.condition === 'loop_continue')
        const hasExit = loopEdges.some(e => e.condition === 'loop_exit')

        if (!hasContinue || !hasExit) {
          console.error(`Loop ${loop.id} missing required edges:`, { hasContinue, hasExit, edges: loopEdges })
          setSnackbar({
            open: true,
            message: `Loop ${loop.id} is missing ${!hasContinue ? 'loop_continue' : ''} ${!hasExit ? 'loop_exit' : ''} edge(s)`,
            severity: 'error'
          })
          return
        }
      }

      const workflowToSave: WorkflowDefinition = {
        ...currentWorkflow,
        nodes: backendNodes,
        edges: backendEdges,
        name: workflowName || currentWorkflow.name || 'Untitled Workflow',
        description: workflowDescription || currentWorkflow.description,
      }

      console.log('[Save] Sending to backend:', JSON.stringify(workflowToSave, null, 2))
      const saveResult = await saveWorkflowDefinition(workflowToSave, workflowName)

      // Set as active workflow if isActiveWorkflow is true
      if (isActiveWorkflow && saveResult.workflow_id) {
        try {
          await setActiveWorkflow(saveResult.workflow_id)
          setSnackbar({ open: true, message: 'Workflow saved and set as active successfully', severity: 'success' })
        } catch (error: any) {
          // Workflow saved but failed to set as active
          setSnackbar({ open: true, message: `Workflow saved but failed to set as active: ${error.message}`, severity: 'error' })
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

    // Close the menu now that file is selected
    setMoreMenuAnchor(null)

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
        has_loops: hasLoops,
        node_types: nodeTypes,
        terminal_nodes: terminalNodes,
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

  const handleAnalyze = async () => {
    if (!currentWorkflow?.workflow_id) {
      setSnackbar({ open: true, message: 'Workflow must be saved to analyze', severity: 'error' })
      return
    }

    try {
      const recommendations = await getAIRecommendations(currentWorkflow.workflow_id)
      setWorkflowAnalysis({ recommendations })
      setAnalysisDialogOpen(true)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to analyze workflow', severity: 'error' })
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
      <Paper sx={{ p: 1, mb: 1, overflow: 'auto' }}>
        <Toolbar disableGutters sx={{ flexWrap: 'wrap', minHeight: '64px !important' }}>
          <Typography variant="h6" sx={{ flexGrow: 0, mr: 2, fontWeight: 600 }}>
            Workflow Builder
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDeleteWorkflow}
              disabled={!currentWorkflow?.workflow_id && !selectedWorkflowId}
              title="Delete the currently loaded workflow"
            >
              Delete
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
                color="success"
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
            <IconButton
              size="small"
              onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
              sx={{ border: 1, borderColor: 'divider', ml: 0.5 }}
            >
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={moreMenuAnchor}
              open={Boolean(moreMenuAnchor)}
              onClose={() => setMoreMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  handleClear()
                  setMoreMenuAnchor(null)
                }}
                sx={{ color: 'warning.main' }}
              >
                <ClearIcon sx={{ mr: 1, fontSize: 20 }} />
                Clear
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleExport()
                  setMoreMenuAnchor(null)
                }}
                disabled={!currentWorkflow}
              >
                <ExportIcon sx={{ mr: 1, fontSize: 20 }} />
                Export
              </MenuItem>
              <MenuItem component="label">
                <ImportIcon sx={{ mr: 1, fontSize: 20 }} />
                Import
                <input type="file" accept=".json" hidden onChange={handleImport} />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleVisualize()
                  setMoreMenuAnchor(null)
                }}
                disabled={!currentWorkflow}
              >
                Visualize
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleViewSummary()
                  setMoreMenuAnchor(null)
                }}
                disabled={!currentWorkflow}
              >
                Summary
              </MenuItem>
              {currentWorkflow?.workflow_id && (
                <>
                  <MenuItem
                    onClick={() => {
                      handleViewVersions()
                      setMoreMenuAnchor(null)
                    }}
                    disabled={!currentWorkflow.workflow_id}
                  >
                    Versions
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      handleAnalyze()
                      setMoreMenuAnchor(null)
                    }}
                    disabled={!currentWorkflow.workflow_id}
                  >
                    Analyze
                  </MenuItem>
                </>
              )}
            </Menu>
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
            onNodeAdd={handleNodeDrop}
            onNodeClick={(nodeId: string) => dispatch(setSelectedNode(nodeId))}
            availableAgents={availableAgents}
            readOnly={false}
          />
        </Box>

        {/* Property Panel */}
        <Box sx={{ width: 350, borderLeft: 1, borderColor: 'divider' }}>
          <NodePropertyPanel
            node={selectedNode}
            workflow={currentWorkflow}
            availableAgents={availableAgents}
            onUpdate={(nodeId, updates) => {
              // Update node in workflow
              if (currentWorkflow) {
                const updatedNodes = currentWorkflow.nodes.map((n) => {
                  if (n.id === nodeId) {
                    const updated = { ...n, ...updates }
                    // If agent_id was updated, we need to refresh the node data in ReactFlow
                    // The WorkflowGraphEditor will handle this via the workflow prop change
                    return updated
                  }
                  return n
                })
                dispatch(setWorkflow({ ...currentWorkflow, nodes: updatedNodes }))
              }
            }}
            onAgentsUpdated={handleAgentsUpdated}
            onDelete={(nodeId) => {
              // if (currentWorkflow) {
              //   const updatedNodes = currentWorkflow.nodes.filter((n) => n.id !== nodeId)
              //   const updatedEdges = currentWorkflow.edges.filter(
              //     (e) => e.from_node !== nodeId && e.to_node !== nodeId
              //   )
              //   dispatch(setWorkflow({ ...currentWorkflow, nodes: updatedNodes, edges: updatedEdges }))
              //   dispatch(setSelectedNode(null))
              // }
              // Use Redux deleteNode for splice delete support
              dispatch(deleteNode(nodeId))
            }}
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
                {(workflowSummary.hasLoops !== undefined || workflowSummary.has_loops !== undefined) && (
                  <Typography variant="body2">
                    <strong>Has Loops:</strong> {(workflowSummary.hasLoops ?? workflowSummary.has_loops) ? 'Yes' : 'No'}
                  </Typography>
                )}
                {workflowSummary.node_types && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Node Types:</strong> {workflowSummary.node_types.join(', ')}
                  </Typography>
                )}
              </Box>
              {((workflowSummary.terminalNodes && workflowSummary.terminalNodes.length > 0) || (workflowSummary.terminal_nodes && workflowSummary.terminal_nodes.length > 0)) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Terminal Nodes
                  </Typography>
                  <Typography variant="body2">
                    {(workflowSummary.terminalNodes || workflowSummary.terminal_nodes || []).join(', ')}
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
