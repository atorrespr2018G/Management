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

export interface NodeError {
    message: string;
    details: string;
}

export interface NodeResult {
    status: 'succeeded' | 'failed';
    inputs: Record<string, string>;
    output: string | null;  // PR5: Allow null for queued nodes
    outputTruncated: boolean;
    outputPreview?: string;
    executionMs: number;
    startedAt: string | null;  // PR5: Allow null for queued nodes
    completedAt: string | null;  // PR5: Allow null for queued nodes
    logs: string[];
    error?: NodeError;
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
    validationStatus: 'unvalidated' | 'valid' | 'invalid';  // PR5: Added 'unvalidated'
    createdAt: string;
    updatedAt: string;
    schemaVersion: number;
}

export interface WorkflowRun {
    id?: string;
    workflowId: string;
    userId: string;
    status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled';
    createdAt: string;
    startedAt?: string;
    completedAt?: string;
    heartbeatAt?: string;
    nodeResults: Record<string, NodeResult>;
    error?: string;
}

export interface WorkflowCreateRequest {
    name: string;
    description?: string;
    graph: WorkflowGraph;
}

export interface WorkflowRunCreateResponse {
    runId: string;
}
