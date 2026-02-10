/**
 * Loop Cluster Utilities
 * Helper functions for creating and managing loop 3-card clusters
 */

import { v4 as uuidv4 } from 'uuid'
import type { WorkflowNode, LoopCluster } from '@/types/workflow'

/**
 * Create a loop cluster (Loop + Loop Body + Exit Loop)
 * Returns the 3 nodes positioned in a cluster layout
 */
export function createLoopCluster(basePosition?: { x: number, y: number }): {
    loopNode: WorkflowNode
    bodyNode: WorkflowNode
    exitNode: WorkflowNode
    cluster: LoopCluster
} {
    const loopId = uuidv4()
    const bodyId = `${loopId}_body`
    const exitId = `${loopId}_exit`

    const loopNode: WorkflowNode = {
        id: loopId,
        type: 'loop',
        max_iters: 3,
        params: {},
    }

    const bodyNode: WorkflowNode = {
        id: bodyId,
        type: 'loop_body',
        isUIHelper: true,
        linkedLoopId: loopId,
        params: {},
    }

    const exitNode: WorkflowNode = {
        id: exitId,
        type: 'loop_exit',
        isUIHelper: true,
        linkedLoopId: loopId,
        params: {},
    }

    const cluster: LoopCluster = {
        loopNodeId: loopId,
        bodyNodeId: bodyId,
        exitNodeId: exitId,
    }

    return { loopNode, bodyNode, exitNode, cluster }
}

/**
 * Find all loop clusters in the workflow
 */
export function findLoopClusters(nodes: WorkflowNode[]): LoopCluster[] {
    const clusters: LoopCluster[] = []

    const loopNodes = nodes.filter(n => n.type === 'loop')

    for (const loopNode of loopNodes) {
        const bodyNode = nodes.find(n =>
            n.type === 'loop_body' && n.linkedLoopId === loopNode.id
        )
        const exitNode = nodes.find(n =>
            n.type === 'loop_exit' && n.linkedLoopId === loopNode.id
        )

        if (bodyNode && exitNode) {
            clusters.push({
                loopNodeId: loopNode.id,
                bodyNodeId: bodyNode.id,
                exitNodeId: exitNode.id,
            })
        }
    }

    return clusters
}

/**
 * Get max iterations for a loop cluster's body card display
 */
export function getLoopMaxIters(loopNodeId: string, nodes: WorkflowNode[]): number {
    const loopNode = nodes.find(n => n.id === loopNodeId)
    return loopNode?.max_iters || 0
}
