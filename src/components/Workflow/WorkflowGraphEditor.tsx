/**
 * Workflow Graph Editor Component using XYFlow
 */

'use client'

import React, { useCallback, useMemo, useState } from 'react'
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
import '@reactflow/background/dist/style.css'
import '@reactflow/controls/dist/style.css'
import 'reactflow/dist/style.css'
import { Box } from '@mui/material'
import { nodeTypes } from './nodes/NodeFactory'
import ConditionalEdge from './edges/ConditionalEdge'
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow'

interface WorkflowGraphEditorProps {
  workflow: WorkflowDefinition | null
  onWorkflowChange?: (workflow: WorkflowDefinition) => void
  readOnly?: boolean
}

const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
}

// Convert workflow definition to ReactFlow nodes and edges
function workflowToReactFlow(workflow: WorkflowDefinition | null) {
  if (!workflow) {
    return { nodes: [], edges: [] }
  }

  // Calculate positions using a simple layout algorithm
  const nodes: Node[] = workflow.nodes.map((node, index) => {
    // Simple grid layout - can be improved with dagre later
    const cols = Math.ceil(Math.sqrt(workflow.nodes.length))
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = col * 250 + 100
    const y = row * 150 + 100

    return {
      id: node.id,
      type: node.type,
      position: { x, y },
      data: {
        ...node,
        label: node.id,
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
  readOnly = false,
}: WorkflowGraphEditorProps) {
  const initialFlow = useMemo(() => workflowToReactFlow(workflow), [workflow])
  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlow.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlow.edges)

  // Update nodes/edges when workflow prop changes
  React.useEffect(() => {
    const newFlow = workflowToReactFlow(workflow)
    setNodes(newFlow.nodes)
    setEdges(newFlow.edges)
  }, [workflow, setNodes, setEdges])

  // Notify parent of changes
  React.useEffect(() => {
    if (onWorkflowChange) {
      const updatedWorkflow = reactFlowToWorkflow(nodes, edges, workflow)
      onWorkflowChange(updatedWorkflow)
    }
  }, [nodes, edges, onWorkflowChange, workflow])

  const onConnect = useCallback(
    (params: Connection) => {
      if (readOnly) return

      const newEdge: Edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        type: 'default',
      }
      setEdges((eds) => addEdge(newEdge, eds))
    },
    [readOnly, setEdges]
  )

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    // Node selection can be handled by parent component
  }, [])

  const onEdgeClick = useCallback((_event: React.MouseEvent, edge: Edge) => {
    // Edge selection can be handled by parent component
  }, [])

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
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
