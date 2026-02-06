/**
 * Client-side workflow validation
 * Validates workflow structure before sending to backend
 */

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow'

export interface ValidationError {
  field: string
  message: string
}

export function validateWorkflow(workflow: WorkflowDefinition | null): ValidationError[] {
  const errors: ValidationError[] = []

  if (!workflow) {
    return [{ field: 'workflow', message: 'Workflow is required' }]
  }

  // Validate nodes
  if (!workflow.nodes || workflow.nodes.length === 0) {
    errors.push({ field: 'nodes', message: 'Workflow must have at least one node' })
  }

  const nodeIds = new Set<string>()
  workflow.nodes?.forEach((node, index) => {
    // Check for duplicate node IDs
    if (nodeIds.has(node.id)) {
      errors.push({ field: `nodes[${index}].id`, message: `Duplicate node ID: ${node.id}` })
    }
    nodeIds.add(node.id)

    // Validate node type
    const validTypes = ['agent', 'conditional', 'fanout', 'loop', 'merge', 'loop_body', 'loop_exit']
    if (!validTypes.includes(node.type)) {
      errors.push({
        field: `nodes[${index}].type`,
        message: `Invalid node type: ${node.type}`,
      })
    }

    // Type-specific validation
    if (node.type === 'agent' && !node.agent_id) {
      errors.push({
        field: `nodes[${index}].agent_id`,
        message: `Agent node ${node.id} must have an agent_id`,
      })
    }

    if (node.type === 'fanout') {
      // Derive branches from graph edges (graph is source of truth)
      const outgoingEdges = workflow.edges?.filter(e => e.from_node === node.id) || []
      const branchTargets = [...new Set(outgoingEdges.map(e => e.to_node))]

      // Validate: Fanout must have at least 2 branch targets (parallel requires ≥2)
      if (branchTargets.length < 2) {
        errors.push({
          field: `nodes[${index}]`,
          //         message: `Fanout node ${node.id} must have at least one branch`,
          message: `Fanout node ${node.id} must connect to at least two branch nodes. Current connections: ${branchTargets.length}`,
        })
      }

      // Optional: warn if branches property exists but doesn't match graph
      if (node.branches && node.branches.length > 0) {
        const branchSet = new Set(node.branches)
        const edgeSet = new Set(branchTargets)
        const same = branchSet.size === edgeSet.size && [...branchSet].every(b => edgeSet.has(b))

        if (!same) {
          errors.push({
            field: `nodes[${index}].branches`,
            message: `Fanout node ${node.id} branches property [${node.branches.join(', ')}] doesn't match graph connections [${branchTargets.join(', ')}]. Connections are used.`,
          })
        }
      }
    }

    if (node.type === 'loop' && !node.max_iters) {
      errors.push({
        field: `nodes[${index}].max_iters`,
        message: `Loop node ${node.id} must have max_iters`,
      })
    }

    if (node.type === 'conditional' && !node.condition) {
      errors.push({
        field: `nodes[${index}].condition`,
        message: `Conditional node ${node.id} must have a condition`,
      })
    }
  })

  // Validate edges
  workflow.edges?.forEach((edge, index) => {
    // Check if source node exists
    if (!nodeIds.has(edge.from_node)) {
      errors.push({
        field: `edges[${index}].from_node`,
        message: `Edge references unknown source node: ${edge.from_node}`,
      })
    }

    // Check if target node exists
    if (!nodeIds.has(edge.to_node)) {
      errors.push({
        field: `edges[${index}].to_node`,
        message: `Edge references unknown target node: ${edge.to_node}`,
      })
    }

    // Check for self-loops (might be intentional for loops, but warn)
    if (edge.from_node === edge.to_node) {
      errors.push({
        field: `edges[${index}]`,
        message: `Self-loop detected: ${edge.from_node} -> ${edge.to_node}`,
      })
    }
  })

  // Validate entry node
  if (workflow.entry_node_id && !nodeIds.has(workflow.entry_node_id)) {
    errors.push({
      field: 'entry_node_id',
      message: `Entry node ${workflow.entry_node_id} not found in nodes`,
    })
  }

  // Check for orphaned nodes (nodes with no connections)
  const connectedNodes = new Set<string>()
  workflow.edges?.forEach((edge) => {
    connectedNodes.add(edge.from_node)
    connectedNodes.add(edge.to_node)
  })

  workflow.nodes?.forEach((node) => {
    if (!connectedNodes.has(node.id) && workflow.nodes.length > 1) {
      errors.push({
        field: `nodes`,
        message: `Node ${node.id} is not connected to any other node`,
      })
    }
  })

  return errors
}

export function validateWorkflowNode(node: WorkflowNode): ValidationError[] {
  const errors: ValidationError[] = []

  if (!node.id) {
    errors.push({ field: 'id', message: 'Node ID is required' })
  }

  if (!node.type) {
    errors.push({ field: 'type', message: 'Node type is required' })
  }

  return errors
}
