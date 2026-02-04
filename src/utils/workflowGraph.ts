/**
 * Workflow Graph Utilities
 * 
 * Pure functions for graph manipulation, used by Redux slice.
 * Handles linear node deletion with edge splicing.
 */

import type { WorkflowDefinition, WorkflowNode, WorkflowEdge, NodeType } from '@/types/workflow'

type WorkflowGraph = Pick<WorkflowDefinition, 'nodes' | 'edges' | 'entry_node_id'>

/**
 * Check if a node type is special (non-linear)
 */
function isSpecialNodeType(nodeType: NodeType): boolean {
    return nodeType === 'conditional' || nodeType === 'fanout' || nodeType === 'loop' || nodeType === 'merge'
}

/**
 * Check if a node qualifies for linear splice delete
 * 
 * Rules:
 * - Must be agent node
 * - Exactly 1 incoming edge
 * - Exactly 1 outgoing edge
 * - Adjacent nodes must not be special types
 */
function isLinearNode(graph: WorkflowGraph, nodeId: string): boolean {
    const node = graph.nodes.find(n => n.id === nodeId)
    if (!node || node.type !== 'agent') {
        return false
    }

    const incoming = graph.edges.filter(e => e.to_node === nodeId)
    const outgoing = graph.edges.filter(e => e.from_node === nodeId)

    // Must have exactly 1 incoming and 1 outgoing
    if (incoming.length !== 1 || outgoing.length !== 1) {
        return false
    }

    // Check adjacent nodes are not special types
    const fromNode = graph.nodes.find(n => n.id === incoming[0].from_node)
    const toNode = graph.nodes.find(n => n.id === outgoing[0].to_node)

    if (!fromNode || !toNode) {
        return false
    }

    return !isSpecialNodeType(fromNode.type) && !isSpecialNodeType(toNode.type)
}

/**
 * Recompute entry node after deletion
 * 
 * Returns first node with no incoming edges, or first node if none found
 */
function recomputeEntryNode(nodes: WorkflowNode[], edges: WorkflowEdge[]): string | undefined {
    // Find nodes with no incoming edges
    const nodesWithIncoming = new Set(edges.map(e => e.to_node))
    const rootNodes = nodes.filter(n => !nodesWithIncoming.has(n.id))

    // Return first root node, or first node if no roots
    return rootNodes[0]?.id || nodes[0]?.id
}

/**
 * Delete a node with linear splicing
 * 
 * For linear agent nodes (1 in + 1 out), reconnects neighbors.
 * For loop nodes, also deletes associated loop_body and loop_exit helpers.
 * Otherwise, performs simple delete (removes node + incident edges).
 * 
 * @param graph - Current workflow graph
 * @param nodeId - Node to delete
 * @returns Updated graph and whether splice occurred
 */
export function deleteNodeAndSplice(
    graph: WorkflowGraph,
    nodeId: string
): { graph: WorkflowGraph; spliced: boolean } {
    const node = graph.nodes.find(n => n.id === nodeId)
    if (!node) {
        // Node not found, return unchanged
        return { graph, spliced: false }
    }

    // If deleting a loop node, also delete its helper nodes (loop_body and loop_exit)
    let nodesToDelete = [nodeId]
    if (node.type === 'loop') {
        const bodyNode = graph.nodes.find(n => n.type === 'loop_body' && n.linkedLoopId === nodeId)
        const exitNode = graph.nodes.find(n => n.type === 'loop_exit' && n.linkedLoopId === nodeId)

        if (bodyNode) nodesToDelete.push(bodyNode.id)
        if (exitNode) nodesToDelete.push(exitNode.id)
    }

    // Collect incident edges for the primary node (for splicing logic)
    const incoming = graph.edges.filter(e => e.to_node === nodeId)
    const outgoing = graph.edges.filter(e => e.from_node === nodeId)

    // Create new graph without the nodes and their edges
    let newNodes = graph.nodes.filter(n => !nodesToDelete.includes(n.id))
    let newEdges = graph.edges.filter(e =>
        !nodesToDelete.includes(e.from_node) && !nodesToDelete.includes(e.to_node)
    )
    let spliced = false

    // Attempt splice if linear (only for non-loop nodes)
    if (node.type !== 'loop' && incoming.length === 1 && outgoing.length === 1) {
        const canSplice = isLinearNode(graph, nodeId)

        if (canSplice) {
            // Create splice edge: incoming.from_node → outgoing.to_node
            const spliceEdge: WorkflowEdge = {
                from_node: incoming[0].from_node,
                to_node: outgoing[0].to_node,
                // Drop conditions for simplicity (can be enhanced later)
            }

            // Check if splice edge doesn't already exist
            const edgeExists = newEdges.some(
                e => e.from_node === spliceEdge.from_node && e.to_node === spliceEdge.to_node
            )

            if (!edgeExists) {
                newEdges.push(spliceEdge)
                spliced = true
            }
        }
    }

    // Recompute entry node if needed
    let newEntryNodeId = graph.entry_node_id

    // If deleted node was entry, or entry doesn't exist in new graph
    if (nodesToDelete.includes(graph.entry_node_id || '') || !newNodes.find(n => n.id === graph.entry_node_id)) {
        newEntryNodeId = recomputeEntryNode(newNodes, newEdges)
    }

    return {
        graph: {
            ...graph,
            nodes: newNodes,
            edges: newEdges,
            entry_node_id: newEntryNodeId,
        },
        spliced,
    }
}
