/**
 * Workflow Serialization Utilities
 * Handles conversion between UI format (with loop clusters) and backend format
 */

import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '@/types/workflow'

// UI-only cluster edge marker - used to visually group Loop, Loop Body, and Exit Loop
export const UI_CLUSTER_CONDITION = '__ui_cluster__'

// Helper function to check if an edge condition is a UI cluster marker
export function isUIClusterEdge(condition?: string): boolean {
    if (!condition) return false
    // Defensive check for both single and double underscore variations
    return condition === '__ui_cluster__' || condition === 'ui_cluster'
}


/**
 * Serialize workflow for backend - removes UI helper nodes and converts cluster edges
 * to proper loop_continue/loop_exit conditions
 */
export function serializeWorkflowForBackend(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
): { nodes: WorkflowNode[], edges: WorkflowEdge[] } {

    console.log('[Serialization] Starting with', nodes.length, 'nodes and', edges.length, 'edges')

    // Filter out UI-only helper nodes
    const backendNodes = nodes.filter(n => !n.isUIHelper)
    console.log('[Serialization] After filtering helpers:', backendNodes.length, 'nodes')

    // Convert helper edges to loop edges with conditions
    const backendEdges: WorkflowEdge[] = []

    for (const edge of edges) {
        // Skip UI-only cluster edges (defensive check for both forms)
        if (isUIClusterEdge(edge.condition)) {
            console.log(`[Serialization] ✓ Filtering UI cluster edge: ${edge.from_node}→${edge.to_node} [${edge.condition}]`)
            continue
        }

        const sourceNode = nodes.find(n => n.id === edge.from_node)

        // Edge from Loop Body -> X becomes Loop -> X with loop_continue
        if (sourceNode?.type === 'loop_body') {
            const loopEdge = {
                from_node: sourceNode.linkedLoopId!,
                to_node: edge.to_node,
                condition: 'loop_continue'
            }
            console.log(`[Serialization] ✓ Converting body edge to loop_continue: ${loopEdge.from_node}→${loopEdge.to_node}`)
            backendEdges.push(loopEdge)
            continue
        }

        // Edge from Exit Loop -> Y becomes Loop -> Y with loop_exit
        if (sourceNode?.type === 'loop_exit') {
            const loopEdge = {
                from_node: sourceNode.linkedLoopId!,
                to_node: edge.to_node,
                condition: 'loop_exit'
            }
            console.log(`[Serialization] ✓ Converting exit edge to loop_exit: ${loopEdge.from_node}→${loopEdge.to_node}`)
            backendEdges.push(loopEdge)
            continue
        }

        // Safety: filter out any untagged loop→* edges (should not exist due to editor validation)
        if (sourceNode?.type === 'loop') {
            console.warn(`[Serialization] ⚠️  Filtering untagged loop edge: ${edge.from_node} -> ${edge.to_node}. Loop should only connect via helper cards.`)
            continue
        }

        // Normal edges pass through
        backendEdges.push(edge)
    }

    // Pre-save validation: check for any remaining UI cluster edges or invalid loop edges
    const loopNodes = backendNodes.filter(n => n.type === 'loop')
    for (const loopNode of loopNodes) {
        const loopEdges = backendEdges.filter(e => e.from_node === loopNode.id)

        console.log(`[Serialization] Loop ${loopNode.id} has ${loopEdges.length} outgoing edges:`)
        loopEdges.forEach(e => {
            console.log(`  - ${e.from_node}→${e.to_node} [${e.condition || 'NO CONDITION'}]`)
        })

        // Check for UI cluster conditions that leaked through
        const uiClusterEdges = loopEdges.filter(e => isUIClusterEdge(e.condition))
        if (uiClusterEdges.length > 0) {
            const error = `SERIALIZATION ERROR: Loop ${loopNode.id} still has UI cluster edges! This should never happen.`
            console.error(error, uiClusterEdges)
            throw new Error(error)
        }

        // Check for untagged edges
        const untaggedEdges = loopEdges.filter(e => !e.condition || e.condition === '')
        if (untaggedEdges.length > 0) {
            console.warn(`WARNING: Loop ${loopNode.id} has ${untaggedEdges.length} untagged edges`)
        }

        // Check for required conditions
        const hasContinue = loopEdges.some(e => e.condition === 'loop_continue')
        const hasExit = loopEdges.some(e => e.condition === 'loop_exit')

        if (!hasContinue) {
            console.error(`ERROR: Loop ${loopNode.id} missing loop_continue edge`)
        }
        if (!hasExit) {
            console.error(`ERROR: Loop ${loopNode.id} missing loop_exit edge`)
        }
    }

    console.log('[Serialization] Final output:', backendNodes.map(n => `${n.id}(${n.type})`))
    console.log('[Serialization] Final edges:', backendEdges.map(e => `${e.from_node}→${e.to_node}${e.condition ? `[${e.condition}]` : ''}`))

    return { nodes: backendNodes, edges: backendEdges }
}

/**
 * Deserialize workflow from backend - reconstitutes loop clusters from backend edges
 */
export function deserializeWorkflowFromBackend(
    definition: WorkflowDefinition
): { nodes: WorkflowNode[], edges: WorkflowEdge[] } {

    const uiNodes: WorkflowNode[] = []
    const uiEdges: WorkflowEdge[] = []

    // Reconstitute clusters for each loop node
    for (const node of definition.nodes) {
        uiNodes.push(node)

        if (node.type === 'loop') {
            // Create helper nodes
            const bodyNode: WorkflowNode = {
                id: `${node.id}_body`,
                type: 'loop_body',
                isUIHelper: true,
                linkedLoopId: node.id,
                params: {}
            }

            const exitNode: WorkflowNode = {
                id: `${node.id}_exit`,
                type: 'loop_exit',
                isUIHelper: true,
                linkedLoopId: node.id,
                params: {}
            }

            uiNodes.push(bodyNode, exitNode)

            // Add UI-only cluster edges using two-port topology: Loop → Body, Loop → Exit
            uiEdges.push(
                { from_node: node.id, to_node: bodyNode.id, condition: UI_CLUSTER_CONDITION },
                { from_node: node.id, to_node: exitNode.id, condition: UI_CLUSTER_CONDITION }
            )
        }
    }

    // Convert backend edges to UI edges
    for (const edge of definition.edges) {
        const sourceNode = uiNodes.find(n => n.id === edge.from_node)

        // Loop -> X with loop_continue becomes LoopBody -> X
        if (sourceNode?.type === 'loop' && edge.condition === 'loop_continue') {
            const bodyNode = uiNodes.find(n =>
                n.type === 'loop_body' && n.linkedLoopId === sourceNode.id
            )
            if (bodyNode) {
                uiEdges.push({
                    from_node: bodyNode.id,
                    to_node: edge.to_node
                })
                continue
            }
        }

        // Loop -> Y with loop_exit becomes ExitLoop -> Y
        if (sourceNode?.type === 'loop' && edge.condition === 'loop_exit') {
            const exitNode = uiNodes.find(n =>
                n.type === 'loop_exit' && n.linkedLoopId === sourceNode.id
            )
            if (exitNode) {
                uiEdges.push({
                    from_node: exitNode.id,
                    to_node: edge.to_node
                })
                continue
            }
        }

        // Normal edges pass through
        uiEdges.push(edge)
    }

    return { nodes: uiNodes, edges: uiEdges }
}

/**
 * Validate workflow before save - ensure loop clusters are properly configured
 */
export function validateBeforeSave(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
): string[] {
    const errors: string[] = []

    const loopClusters = nodes.filter((n: WorkflowNode) => n.type === 'loop')

    for (const loop of loopClusters) {
        const bodyNode = nodes.find((n: WorkflowNode) =>
            n.type === 'loop_body' && n.linkedLoopId === loop.id
        )
        const exitNode = nodes.find((n: WorkflowNode) =>
            n.type === 'loop_exit' && n.linkedLoopId === loop.id
        )

        if (!bodyNode || !exitNode) {
            errors.push(`Loop ${loop.id} missing helper cards`)
            continue
        }

        // Check Loop Body has attachment (ignore UI-only cluster edges)
        const bodyEdges = edges.filter((e: WorkflowEdge) =>
            e.from_node === bodyNode.id && !isUIClusterEdge(e.condition)
        )
        if (bodyEdges.length === 0) {
            errors.push(`Loop Body must connect to a body entry node.`)
        }

        // Check Exit Loop has attachment (ignore UI-only cluster edges)
        const exitEdges = edges.filter((e: WorkflowEdge) =>
            e.from_node === exitNode.id && !isUIClusterEdge(e.condition)
        )
        if (exitEdges.length === 0) {
            errors.push(`Exit Loop must connect to an exit node.`)
        }
    }

    return errors
}
