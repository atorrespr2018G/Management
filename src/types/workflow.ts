// Management/src/types/workflow.ts
/**
 * Workflow system types matching backend contracts
 */

export interface ValidationIssue {
    code: string;
    message: string;
    nodeId?: string;
    edgeId?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationIssue[];
}


export interface WorkflowGraph {
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    viewport?: any;
}

export interface WorkflowNode {
    id: string;
    type: 'start' | 'add_action' | 'send_message' | 'invoke_agent';
    position?: { x: number; y: number };
    data?: {
        message?: string;
        agentId?: string;
        input?: string;
    };
    config?: {
        message?: string;
        agentId?: string;
        input?: string;
    };
}

export interface WorkflowEdge {
    id?: string;
    source: string;
    target: string;
}

export interface Workflow {
    id?: string;
    userId: string;
    name: string;
    description?: string;
    graph: WorkflowGraph;
    validationStatus: 'unvalidated' | 'valid' | 'invalid';
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
}

// WorkflowRun - matches GET /api/workflows/{id}/runs/{runId} response
export interface WorkflowRun {
    id: string;
    workflowId: string;
    userId: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed';
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    error?: string;  // Run-level error message
    nodeResults: Record<string, NodeResult>;
}

// NodeResult - embedded in WorkflowRun.nodeResults
export interface NodeResult {
    status: 'pending' | 'running' | 'succeeded' | 'failed' | 'skipped';
    inputs?: Record<string, string>;  // String inputs only
    output?: string;  // String output only (not any)
    outputPreview?: string;
    outputTruncated?: boolean;
    executionMs?: number;
    startedAt?: string;
    completedAt?: string;
    error?: string;  // Node-level error message
    logs?: string[];
}

export interface WorkflowCreateRequest {
    name: string;
    description?: string;
    graph: WorkflowGraph;
}

// RunResponse - matches POST /api/workflows/{id}/runs response
export interface WorkflowRunCreateResponse {
    runId: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed';
    workflowId: string;
}
