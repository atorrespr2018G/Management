/**
 * Agent Workflow Generator Utilities
 * Functions for generating workflows from agent connections
 */

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow'
import type { Agent } from '@/services/agentApi'
import { v4 as uuidv4 } from 'uuid'
import { autoLayoutWorkflow } from './workflowLayout'

export interface ConnectionConfig {
  sourceAgentId: string
  targetAgentId: string
  sourceOutputPath?: string // e.g., "triage.result"
  targetInputPath?: string // e.g., "news.goal"
  condition?: string // Optional condition expression
  autoConditional?: boolean // Auto-generate conditional node
}

export interface ConditionalRoute {
  condition: string
  targetAgentId: string
  label?: string
}

export interface Position {
  x: number
  y: number
}

/**
 * Generate an agent node
 */
export function generateAgentNode(
  agent: Agent,
  nodeId: string,
  position?: Position
): WorkflowNode {
  return {
    id: nodeId,
    type: 'agent',
    agent_id: agent.id,
    inputs: {},
    outputs: {
      result: nodeId,
    },
    params: position ? { position } : {},
  }
}

/**
 * Generate a conditional node
 */
export function generateConditionalNode(
  nodeId: string,
  condition: string,
  position?: Position
): WorkflowNode {
  return {
    id: nodeId,
    type: 'conditional',
    condition,
    params: position ? { position } : {},
  }
}

/**
 * Create an edge between two nodes
 */
export function createAgentConnection(
  sourceNode: string,
  targetNode: string,
  condition?: string
): WorkflowEdge {
  return {
    from_node: sourceNode,
    to_node: targetNode,
    condition,
  }
}

/**
 * Generate a linear workflow (A → B → C)
 */
export function generateLinearWorkflow(
  agents: Agent[],
  config?: Partial<ConnectionConfig>
): WorkflowDefinition {
  if (agents.length < 2) {
    throw new Error('At least 2 agents are required for a linear workflow')
  }

  const nodes: WorkflowNode[] = agents.map((agent, index) => {
    const nodeId = agent.id.toLowerCase().replace(/\s+/g, '_')
    return generateAgentNode(agent, nodeId, {
      x: index * 250,
      y: 100,
    })
  })

  const edges: WorkflowEdge[] = []
  for (let i = 0; i < nodes.length - 1; i++) {
    const sourceNode = nodes[i]
    const targetNode = nodes[i + 1]

    // Configure inputs/outputs if provided
    if (config?.sourceOutputPath && i === 0) {
      sourceNode.outputs = {
        result: config.sourceOutputPath,
      }
    }
    if (config?.targetInputPath && i === nodes.length - 2) {
      targetNode.inputs = {
        goal: config.targetInputPath,
      }
    }

    edges.push(createAgentConnection(sourceNode.id, targetNode.id, config?.condition))
  }

  const workflow: WorkflowDefinition = {
    name: `Linear Workflow: ${agents.map((a) => a.name).join(' → ')}`,
    description: `Linear workflow connecting ${agents.length} agents`,
    entry_node_id: nodes[0].id,
    nodes,
    edges,
    limits: {
      max_steps: 100,
      timeout_ms: 300000,
      max_parallel: 1,
    },
  }

  return autoLayoutWorkflow(workflow)
}

/**
 * Generate a conditional workflow (A → [condition] → B or C)
 */
export function generateConditionalWorkflow(
  sourceAgent: Agent,
  conditions: ConditionalRoute[]
): WorkflowDefinition {
  if (conditions.length < 2) {
    throw new Error('At least 2 conditional routes are required')
  }

  const sourceNodeId = sourceAgent.id.toLowerCase().replace(/\s+/g, '_')
  const sourceNode = generateAgentNode(sourceAgent, sourceNodeId, { x: 100, y: 100 })

  const conditionalNodeId = `route_${uuidv4().substring(0, 8)}`
  const conditionalNode = generateConditionalNode(conditionalNodeId, '', { x: 350, y: 100 })

  const targetNodes: WorkflowNode[] = []
  const edges: WorkflowEdge[] = []

  // Create edge from source to conditional
  edges.push(createAgentConnection(sourceNode.id, conditionalNode.id))

  // Create target nodes and edges
  conditions.forEach((route, index) => {
    const targetAgent = { id: route.targetAgentId, name: route.label || route.targetAgentId } as Agent
    const targetNodeId = route.targetAgentId.toLowerCase().replace(/\s+/g, '_')
    const targetNode = generateAgentNode(targetAgent, targetNodeId, {
      x: 600,
      y: 100 + index * 150,
    })
    targetNodes.push(targetNode)

    // Set condition on conditional node (use first condition as default)
    if (index === 0 && route.condition) {
      conditionalNode.condition = route.condition
    }

    // Create edge from conditional to target with condition
    edges.push(
      createAgentConnection(conditionalNode.id, targetNode.id, route.condition || undefined)
    )
  })

  const workflow: WorkflowDefinition = {
    name: `Conditional Workflow: ${sourceAgent.name}`,
    description: `Conditional routing from ${sourceAgent.name} to ${conditions.length} targets`,
    entry_node_id: sourceNode.id,
    nodes: [sourceNode, conditionalNode, ...targetNodes],
    edges,
    limits: {
      max_steps: 100,
      timeout_ms: 300000,
      max_parallel: 1,
    },
  }

  return autoLayoutWorkflow(workflow)
}

/**
 * Auto-layout nodes based on edges
 */
export function autoLayoutNodes(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const workflow: WorkflowDefinition = {
    nodes,
    edges,
  }
  const laidOut = autoLayoutWorkflow(workflow)
  return laidOut.nodes
}
