/**
 * Workflow Graph Editor Component using XYFlow
 */

'use client'

import React, { useCallback, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
} from 'reactflow'
import 'reactflow/dist/style.css'
import './workflow-editor.css'
import { Box } from '@mui/material'
import { nodeTypes } from './nodes/NodeFactory'
import ConditionalEdge from './edges/ConditionalEdge'
import { calculateLayout } from '@/utils/workflowLayout'
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow'

interface WorkflowGraphEditorProps {
  workflow: WorkflowDefinition | null
  onWorkflowChange?: (workflow: WorkflowDefinition) => void
  onNodeAdd?: (nodeType: string, position: { x: number; y: number }) => void
  onNodeClick?: (nodeId: string) => void
  availableAgents?: Array<{ id: string; name: string }>
  readOnly?: boolean
}

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
}

// Convert workflow definition to ReactFlow nodes and edges
function workflowToReactFlow(workflow: WorkflowDefinition | null, availableAgents?: Array<{ id: string; name: string }>) {
  if (!workflow) {
    return { nodes: [], edges: [] }
  }

  // Create nodes with initial positions (from params if available, otherwise simple grid)
  const nodes: Node[] = workflow.nodes.map((node, index) => {
    let position = { x: 0, y: 0 }

    // Try to get position from params
    if (node.params?.position) {
      position = node.params.position
    } else {
      // Simple grid layout fallback
      const cols = Math.ceil(Math.sqrt(workflow.nodes.length))
      const row = Math.floor(index / cols)
      const col = index % cols
      position = { x: col * 250 + 100, y: row * 150 + 100 }
    }

    // For agent nodes, find the agent name
    let agentName: string | undefined
    if (node.type === 'agent' && node.agent_id && availableAgents) {
      const agent = availableAgents.find((a) => a.id === node.agent_id)
      agentName = agent?.name
    }

    // For Loop Body nodes, get max_iters from parent loop
    let maxIters: number | undefined
    if (node.type === 'loop_body' && node.linkedLoopId) {
      const parentLoop = workflow.nodes.find(n => n.id === node.linkedLoopId)
      maxIters = parentLoop?.max_iters
    }

    return {
      id: node.id,
      type: node.type,
      position,
      data: {
        ...node,
        label: node.id,
        agentName,
        max_iters: maxIters !== undefined ? maxIters : node.max_iters,
      },
    }
  })

  const edges: Edge[] = workflow.edges.map((edge, index) => ({
    id: `edge-${edge.from_node}-${edge.to_node}-${index}`,
    source: edge.from_node,
    target: edge.to_node,
    type: edge.condition ? 'conditional' : 'default',
    data: {
      condition: edge.condition,
    },
    animated: false,
  }))

  // Apply auto-layout if nodes don't have positions
  const hasPositions = nodes.some((n) => n.position.x !== 0 || n.position.y !== 0)
  if (!hasPositions && nodes.length > 0 && edges.length > 0) {
    const laidOutNodes = calculateLayout(nodes, edges)
    return { nodes: laidOutNodes, edges }
  }

  return { nodes, edges }
}

// Convert ReactFlow nodes and edges back to workflow definition
function reactFlowToWorkflow(
  nodes: Node[],
  edges: Edge[],
  baseWorkflow: WorkflowDefinition | null
): WorkflowDefinition {
  const workflowNodes: WorkflowNode[] = nodes.map((node) => ({
    id: node.id,
    type: node.data.type || 'agent',
    ...node.data,
    // Preserve position in params so it persists
    params: {
      ...node.data.params,
      position: node.position,
    },
  }))

  const workflowEdges: WorkflowEdge[] = edges.map((edge) => ({
    from_node: edge.source,
    to_node: edge.target,
    condition: edge.data?.condition,
  }))

  return {
    ...(baseWorkflow || {}),
    nodes: workflowNodes,
    edges: workflowEdges,
    entry_node_id: baseWorkflow?.entry_node_id || workflowNodes[0]?.id,
  }
}

export default function WorkflowGraphEditor({
  workflow,
  onWorkflowChange,
  onNodeAdd,
  onNodeClick,
  availableAgents,
  readOnly = false,
}: WorkflowGraphEditorProps) {
  const initialFlow = useMemo(() => workflowToReactFlow(workflow, availableAgents), [workflow, availableAgents])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges)
  const workflowRef = React.useRef<WorkflowDefinition | null>(workflow)
  const workflowNodesRef = React.useRef<string>('')
  const isUpdatingFromProps = React.useRef(false)
  const reactFlowWrapper = useRef<HTMLDivElement>(null)

  // Track previous availableAgents count to detect when agents finish loading
  const prevAgentsCountRef = React.useRef(0)

  // Update nodes/edges when workflow prop changes OR when agents finish loading
  React.useEffect(() => {
    if (!workflow) {
      setNodes([])
      setEdges([])
      workflowRef.current = null
      workflowNodesRef.current = ''
      prevAgentsCountRef.current = 0
      return
    }

    // Serialize node agent_ids to detect changes
    const nodesKey = JSON.stringify(workflow.nodes.map((n) => ({ id: n.id, agent_id: n.agent_id })))
    const workflowChanged = workflow !== workflowRef.current
    const nodesChanged = nodesKey !== workflowNodesRef.current

    // Detect when agents finish loading (count goes from 0 to > 0, or changes)
    const agentsCount = availableAgents?.length || 0
    const agentsLoaded = agentsCount > 0 && prevAgentsCountRef.current !== agentsCount

    // Trigger update when workflow changes, nodes change, OR agents finish loading
    // This ensures agent names display even if agents load after workflow
    const needsUpdate = workflowChanged || nodesChanged || agentsLoaded

    if (needsUpdate) {
      isUpdatingFromProps.current = true
      const newFlow = workflowToReactFlow(workflow, availableAgents)

      // Preserve positions of existing nodes
      setNodes((currentNodes) => {
        const nodeMap = new Map(currentNodes.map((n) => [n.id, n]))
        return newFlow.nodes.map((newNode) => {
          const existingNode = nodeMap.get(newNode.id)
          if (existingNode) {
            // Preserve the position of existing nodes
            return {
              ...newNode,
              position: existingNode.position,
            }
          }
          // New node - use position from workflow or calculated position
          return newNode
        })
      })

      setEdges(newFlow.edges)
      workflowRef.current = workflow
      workflowNodesRef.current = nodesKey
      prevAgentsCountRef.current = agentsCount
      // Reset flag after update completes
      setTimeout(() => {
        isUpdatingFromProps.current = false
      }, 100)
    }
  }, [workflow, availableAgents, setNodes, setEdges])

  // Notify parent of changes (only when user makes changes, not when syncing from props)
  React.useEffect(() => {
    if (onWorkflowChange && !isUpdatingFromProps.current && !readOnly) {
      const timeoutId = setTimeout(() => {
        const updatedWorkflow = reactFlowToWorkflow(nodes, edges, workflow)
        // Only call if workflow actually changed
        const workflowStr = JSON.stringify(updatedWorkflow)
        const currentWorkflowStr = JSON.stringify(workflow)
        if (workflowStr !== currentWorkflowStr) {
          onWorkflowChange(updatedWorkflow)
        }
      }, 500) // Debounce for 500ms

      return () => clearTimeout(timeoutId)
    }
  }, [nodes, edges, onWorkflowChange, workflow, readOnly])

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return

      // Validate loop cluster connections  
      if (workflow && params.source && params.target) {
        let sourceNode = workflow.nodes.find(n => n.id === params.source)
        let targetNode = workflow.nodes.find(n => n.id === params.target)

        // Helper to identify loop helper nodes
        const isHelper = (type?: string) => type === 'loop_body' || type === 'loop_exit'

        // Auto-reverse: if user dragged into a helper (B → LoopBody), interpret as LoopBody → B
        if (isHelper(targetNode?.type) && !isHelper(sourceNode?.type)) {
          params = {
            ...params,
            source: params.target,
            target: params.source,
            sourceHandle: params.targetHandle,
            targetHandle: params.sourceHandle,
          }
          // Update node references after swap
          const temp = sourceNode
          sourceNode = targetNode as any
          targetNode = temp as any
        }

        // Rule 1: Loop can only connect to helper cards (enforces proper loop cluster usage)
        if (sourceNode?.type === 'loop' && !isHelper(targetNode?.type)) {
          alert('Loop can only connect to Loop Body or Exit Loop helper cards. Use the helper cards to attach body/exit nodes.')
          return
        }

        // Rule 2: Cannot connect between loop helper cards
        if (isHelper(targetNode?.type) && isHelper(sourceNode?.type)) {
          alert('Cannot connect between loop helper cards.')
          return
        }

        // Rule 3: Loop Body can only connect to ONE real node (ignore UI cluster edges)
        if (sourceNode?.type === 'loop_body') {
          const existingBodyEdges = workflow.edges.filter(e =>
            e.from_node === params.source && e.condition !== '__ui_cluster__'
          )
          if (existingBodyEdges.length >= 1) {
            alert('Loop Body can connect to only one body entry node.')
            return
          }
        }

        // Rule 3: Exit Loop can only connect to ONE real node (ignore UI cluster edges)
        if (sourceNode?.type === 'loop_exit') {
          const existingExitEdges = workflow.edges.filter(e =>
            e.from_node === params.source && e.condition !== '__ui_cluster__'
          )
          if (existingExitEdges.length >= 1) {
            alert('Exit Loop can connect to only one exit node.')
            return
          }
        }
      }

      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'default',
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [readOnly, setEdges, workflow]
  )

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Hide property panel for helper nodes and start node
      if (node.data.type === 'start' || node.data.type === 'loop_body' || node.data.type === 'loop_exit') {
        // Clear selection by calling with null
        if (onNodeClick) {
          onNodeClick(null as any)
        }
        return
      }

      if (onNodeClick) {
        onNodeClick(node.id)
      }
    },
    [onNodeClick]
  )

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Edge selection can be handled by parent component
  }, [])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      if (readOnly || !onNodeAdd) return

      const nodeType = event.dataTransfer.getData('application/reactflow')

      if (!nodeType) return

      // Get position relative to ReactFlow wrapper
      if (reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()
        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        }
        onNodeAdd(nodeType, position)
      }
    },
    [readOnly, onNodeAdd]
  )

  return (
    <Box ref={reactFlowWrapper} sx={{ width: '100%', height: '100%' }} onDragOver={onDragOver} onDrop={onDrop}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => {
          // Clear selection when clicking on background
          if (onNodeClick) {
            onNodeClick(null as any)
          }
        }}
        nodeTypes={nodeTypes as NodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'agent':
                return '#1976d2'
              case 'conditional':
                return '#ed6c02'
              case 'fanout':
                return '#0288d1'
              case 'loop':
                return '#9c27b0'
              case 'merge':
                return '#2e7d32'
              default:
                return '#ccc'
            }
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </Box>
  )
}
