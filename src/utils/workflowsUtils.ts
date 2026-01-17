// management/utils/workflowsUtils.ts
import { Node, Edge } from '@xyflow/react'

export type Graph = { nodes: Node[]; edges: Edge[] };

export function toWorkflowPayload(nodes: Node[], edges: Edge[]) {
    return { nodes, edges }
}

// ============================================================================
// BASIC GRAPH QUERIES
// ============================================================================

/**
 * Get all edges pointing TO a node
 */
export function incomingEdges(graph: Graph, nodeId: string): Edge[] {
    return graph.edges.filter(edge => edge.target === nodeId);
}

/**
 * Get all edges pointing FROM a node
 */
export function outgoingEdges(graph: Graph, nodeId: string): Edge[] {
    return graph.edges.filter(edge => edge.source === nodeId);
}

/**
 * Get parent node IDs (sources of incoming edges)
 */
export function parents(graph: Graph, nodeId: string): string[] {
    return incomingEdges(graph, nodeId).map(edge => edge.source);
}

/**
 * Get child node IDs (targets of outgoing edges)
 */
export function children(graph: Graph, nodeId: string): string[] {
    return outgoingEdges(graph, nodeId).map(edge => edge.target);
}

/**
 * Find a node by ID
 */
export function findNode(graph: Graph, nodeId: string): Node | undefined {
    return graph.nodes.find(n => n.id === nodeId);
}

// ============================================================================
// NODE TYPE CHECKS
// ============================================================================

export function isFanOut(node: Node): boolean {
    return node.type === 'fan_out';
}

export function isFanIn(node: Node): boolean {
    return node.type === 'fan_in';
}

export function isStart(node: Node): boolean {
    return node.type === 'start';
}

export function isInvokeAgent(node: Node): boolean {
    return node.type === 'invoke_agent';
}

// ============================================================================
// GRAPH MANIPULATION
// ============================================================================

/**
 * Remove a node and all its incident edges
 */
export function removeNodeAndIncidentEdges(graph: Graph, nodeId: string): Graph {
    return {
        nodes: graph.nodes.filter(n => n.id !== nodeId),
        edges: graph.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
    };
}

/**
 * Add an edge between two nodes with a generated ID
 */
export function addEdge(graph: Graph, source: string, target: string): Graph {
    const newEdge: Edge = {
        id: `${source}-${target}-${Date.now()}`,
        source,
        target,
        type: 'default'
    };

    return {
        ...graph,
        edges: [...graph.edges, newEdge]
    };
}

/**
 * Remove an edge by ID
 */
export function removeEdge(graph: Graph, edgeId: string): Graph {
    return {
        ...graph,
        edges: graph.edges.filter(e => e.id !== edgeId)
    };
}

/**
 * Remove multiple edges by IDs
 */
export function removeEdges(graph: Graph, edgeIds: string[]): Graph {
    const edgeIdSet = new Set(edgeIds);
    return {
        ...graph,
        edges: graph.edges.filter(e => !edgeIdSet.has(e.id))
    };
}

/**
 * Remove multiple nodes and all their incident edges
 */
export function removeNodes(graph: Graph, nodeIds: string[]): Graph {
    const nodeIdSet = new Set(nodeIds);
    return {
        nodes: graph.nodes.filter(n => !nodeIdSet.has(n.id)),
        edges: graph.edges.filter(e => !nodeIdSet.has(e.source) && !nodeIdSet.has(e.target))
    };
}

// ============================================================================
// PARALLEL BLOCK DETECTION
// ============================================================================

/**
 * Check if a node is a branch agent (has FanOut parent and FanIn child)
 */
export function isBranchAgent(graph: Graph, nodeId: string): boolean {
    const node = findNode(graph, nodeId);
    if (!node || !isInvokeAgent(node)) return false;

    const parentIds = parents(graph, nodeId);
    const childIds = children(graph, nodeId);

    // Must have exactly 1 parent and 1 child
    if (parentIds.length !== 1 || childIds.length !== 1) return false;

    const parentNode = findNode(graph, parentIds[0]);
    const childNode = findNode(graph, childIds[0]);

    // Both must exist and have correct types
    if (!parentNode || !childNode) return false;

    return isFanOut(parentNode) && isFanIn(childNode);
}

/**
 * Count branch agents for a FanOut node
 */
export function countBranches(graph: Graph, fanOutId: string): number {
    const fanOutNode = findNode(graph, fanOutId);
    if (!fanOutNode || !isFanOut(fanOutNode)) return 0;

    const childIds = children(graph, fanOutId);
    return childIds.length;
}

/**
 * Find the FanIn node that a FanOut block connects to
 */
export function findFanInForFanOut(graph: Graph, fanOutId: string): string | null {
    const branchAgents = children(graph, fanOutId);

    if (branchAgents.length === 0) return null;

    // All branch agents should connect to the same FanIn
    // Check the first branch agent's child
    const firstBranchChildren = children(graph, branchAgents[0]);

    if (firstBranchChildren.length !== 1) return null;

    const fanInCandidate = findNode(graph, firstBranchChildren[0]);

    return fanInCandidate && isFanIn(fanInCandidate) ? fanInCandidate.id : null;
}

// ============================================================================
// DELETE SEMANTICS
// ============================================================================

/**
 * Sequential splice: remove node and connect parent directly to child
 */
function spliceDelete(graph: Graph, nodeId: string, parentId: string, childId: string): Graph {
    // Remove the node
    let result = removeNodeAndIncidentEdges(graph, nodeId);

    // Add edge parent → child
    result = addEdge(result, parentId, childId);

    return result;
}

/**
 * Delete a branch agent from a parallel block
 */
function deleteBranchAgent(graph: Graph, nodeId: string): Graph {
    const parentIds = parents(graph, nodeId);
    const fanOutId = parentIds[0]; // We know it's a branch agent

    const branchCount = countBranches(graph, fanOutId);

    if (branchCount <= 2) {
        console.warn(`Cannot delete branch agent ${nodeId}: only ${branchCount} branches remain (minimum is 3)`);
        return graph; // no-op
    }

    // Remove the agent node and its edges
    return removeNodeAndIncidentEdges(graph, nodeId);
}

/**
 * Delete an entire FanOut parallel block
 */
function deleteFanOutBlock(graph: Graph, fanOutId: string): Graph {
    // 1. Find the FanIn node
    const fanInId = findFanInForFanOut(graph, fanOutId);

    if (!fanInId) {
        console.warn(`Cannot delete FanOut ${fanOutId}: FanIn not found`);
        return graph;
    }

    // 2. Find parent of FanOut and child of FanIn (for splicing)
    const fanOutParents = parents(graph, fanOutId);
    const fanInChildren = children(graph, fanInId);

    if (fanOutParents.length !== 1 || fanInChildren.length !== 1) {
        console.warn(`Cannot delete FanOut block: invalid structure`);
        return graph;
    }

    const parentId = fanOutParents[0];
    const childId = fanInChildren[0];

    // 3. Collect all branch agents
    const branchAgents = children(graph, fanOutId);

    // 4. Remove: FanOut, FanIn, all branch agents
    const nodesToRemove = [fanOutId, fanInId, ...branchAgents];
    let result = removeNodes(graph, nodesToRemove);

    // 5. Splice outer chain: parent → child
    result = addEdge(result, parentId, childId);

    return result;
}

/**
 * Main delete function with all deletion semantics
 */
export function deleteNode(graph: Graph, nodeId: string): Graph {
    const node = findNode(graph, nodeId);

    if (!node) {
        console.warn(`Node ${nodeId} not found`);
        return graph;
    }

    // 1. Check if node is protected
    if (isStart(node)) {
        console.warn(`Cannot delete Start node`);
        return graph;
    }

    if (isFanIn(node)) {
        console.warn(`Cannot delete FanIn node`);
        return graph;
    }

    // 2. Special case: FanOut block deletion
    if (isFanOut(node)) {
        return deleteFanOutBlock(graph, nodeId);
    }

    // 3. Check if it's a branch agent
    if (isBranchAgent(graph, nodeId)) {
        return deleteBranchAgent(graph, nodeId);
    }

    // 4. Sequential splice-delete (1 parent, 1 child)
    const parentIds = parents(graph, nodeId);
    const childIds = children(graph, nodeId);

    if (parentIds.length === 1 && childIds.length === 1) {
        return spliceDelete(graph, nodeId, parentIds[0], childIds[0]);
    }

    // 5. Default: simple delete (remove node and incident edges)
    return removeNodeAndIncidentEdges(graph, nodeId);
}

/**
 * Check if a node is deletable (for UI button visibility)
 */
export function isDeletable(graph: Graph, nodeId: string): boolean {
    const node = findNode(graph, nodeId);

    if (!node) return false;

    // Protected nodes
    if (isStart(node) || isFanIn(node)) return false;

    // FanOut is deletable (deletes entire block)
    if (isFanOut(node)) return true;

    // Branch agent: deletable only if N > 2
    if (isBranchAgent(graph, nodeId)) {
        const parentIds = parents(graph, nodeId);
        const fanOutId = parentIds[0];
        const branchCount = countBranches(graph, fanOutId);
        return branchCount > 2;
    }

    // All other nodes are deletable
    return true;
}

