/**
 * Workflow Layout Utilities
 * Auto-layout algorithms for workflow graphs
 */

import dagre from 'dagre'
import type { Node, Edge } from 'reactflow'
import type { WorkflowDefinition } from '@/types/workflow'

const NODE_WIDTH = 200
const NODE_HEIGHT = 100

/**
 * Calculate layout for workflow nodes using dagre
 */
export function calculateLayout(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): Node[] {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    }
  })
}

/**
 * Auto-layout workflow definition
 */
export function autoLayoutWorkflow(workflow: WorkflowDefinition): WorkflowDefinition {
  // Convert to ReactFlow format
  const nodes: Node[] = workflow.nodes.map((node, index) => ({
    id: node.id,
    type: node.type,
    position: { x: index * 250, y: 0 }, // Temporary position
    data: node,
  }))

  const edges: Edge[] = workflow.edges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.from_node,
    target: edge.to_node,
    data: { condition: edge.condition },
  }))

  // Calculate layout
  const laidOutNodes = calculateLayout(nodes, edges)

  // Update workflow with new positions (stored in node data for now)
  const updatedNodes = workflow.nodes.map((node) => {
    const laidOutNode = laidOutNodes.find((n) => n.id === node.id)
    return {
      ...node,
      // Store position in params for persistence
      params: {
        ...node.params,
        position: laidOutNode?.position,
      },
    }
  })

  return {
    ...workflow,
    nodes: updatedNodes,
  }
}
