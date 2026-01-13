// Management/src/lib/api/workflows.ts
/**
 * Workflow API client methods
 * All calls go through Next.js rewrites to Agent backend
 */

import type {
    Workflow,
    WorkflowCreateRequest,
    WorkflowRun,
    WorkflowRunCreateResponse,
    ValidationResult,
} from '@/types/workflow';

const API_BASE = '/api/workflows';
const USE_MOCKS = false; // Disabled for PR5 - using real backend

// FIX 2: Normalize MongoDB _id to id for consistent UI handling
function normalizeWorkflow(workflow: any): Workflow {
    return {
        ...workflow,
        id: workflow.id || workflow._id,
    };
}

function normalizeRun(run: any): WorkflowRun {
    return {
        ...run,
        id: run.id || run._id,
    };
}

// Mock responses for development when backend not ready
const MOCK_WORKFLOW: Workflow = {
    id: 'mock-workflow-1',
    userId: 'test-user',
    name: 'Mock Workflow',
    description: 'Demo workflow',
    graph: {
        nodes: [
            { id: 'start', type: 'start' },
            { id: 'b_send', type: 'send_message', data: { message: 'Tell me about Kevin' } },
            // { id: 'c_send', type: 'SendMessage', data: { message: 'If not, then tell me about Quantum' } },
            { id: 'd_invoke', type: 'invoke_agent', data: { agentId: 'TRIAGE' } },
        ],
        edges: [
            { source: 'start', target: 'b_send' },
            // { source: 'start', target: 'c_send' },
            { source: 'b_send', target: 'd_invoke' },
            // { source: 'c_send', target: 'd_invoke' },
        ],
    },
    validationStatus: 'invalid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
};

/**
 * Create a new workflow
 */
export async function createWorkflow(data: WorkflowCreateRequest): Promise<Workflow> {
    if (USE_MOCKS) {
        return {
            ...MOCK_WORKFLOW,
            name: data.name,
            description: data.description,
            graph: data.graph,
        };
    }

    // TODO: Wire to POST /api/workflows when PR5 endpoints land
    const response = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to create workflow: ${response.statusText}`);
    }

    return normalizeWorkflow(await response.json());
}

/**
 * List all workflows for current user
 */
export async function listWorkflows(): Promise<Workflow[]> {
    if (USE_MOCKS) {
        return [MOCK_WORKFLOW];
    }

    // TODO: Wire to GET /api/workflows when PR5 endpoints land
    const response = await fetch(API_BASE, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to list workflows: ${response.statusText}`);
    }

    const workflows = await response.json();
    return workflows.map(normalizeWorkflow);  // FIX 2: Normalize IDs
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflow(id: string): Promise<Workflow> {
    if (USE_MOCKS) {
        return { ...MOCK_WORKFLOW, id };
    }

    // TODO: Wire to GET /api/workflows/{id} when PR5 endpoints land
    const response = await fetch(`${API_BASE}/${id}`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to get workflow: ${response.statusText}`);
    }

    const workflow = await response.json();
    return normalizeWorkflow(workflow);  // FIX 2: Normalize ID
}

/**
 * Validate a workflow
 */
export async function validateWorkflow(id: string): Promise<ValidationResult> {
    if (USE_MOCKS) {
        return {
            valid: true,
            errors: [],
        };
    }

    // TODO: Wire to POST /api/workflows/{id}/validate when PR5 endpoints land
    const response = await fetch(`${API_BASE}/${id}/validate`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to validate workflow: ${response.statusText}`);
    }

    const result = await response.json();

    // FIX 4: Normalize validation response shape
    return {
        valid: result.valid ?? false,
        errors: Array.isArray(result.errors) ? result.errors.map((err: any) => ({
            code: err.code || 'UNKNOWN_ERROR',
            message: typeof err === 'string' ? err : (err.message || 'Unknown error'),
            nodeId: err.nodeId,
            edgeId: err.edgeId,
        })) : [],
    };
}

/**
 * Update an existing workflow (persist graph changes)
 */
export async function updateWorkflow(id: string, data: WorkflowCreateRequest): Promise<Workflow> {
    const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Failed to update workflow: ${response.statusText}`);
    }

    return normalizeWorkflow(await response.json());
}

/**
 * Start a workflow run
 */
export async function runWorkflow(id: string): Promise<WorkflowRunCreateResponse> {
    if (USE_MOCKS) {
        return { runId: `mock-run-${Date.now()}` };
    }

    // TODO: Wire to POST /api/workflows/{id}/run when PR5 endpoints land
    const response = await fetch(`${API_BASE}/${id}/run`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to start workflow run: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get workflow run status and results
 */
export async function getWorkflowRun(runId: string): Promise<WorkflowRun> {
    if (USE_MOCKS) {
        return {
            id: runId,
            workflowId: 'mock-workflow-1',
            userId: 'test-user',
            status: 'succeeded',
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            nodeResults: {
                start: {
                    status: 'succeeded',
                    inputs: {},
                    output: '{"runId":"' + runId + '"}',
                    outputTruncated: false,
                    executionMs: 5.2,
                    startedAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    logs: [],
                },
                b_send: {
                    status: 'succeeded',
                    inputs: {},
                    output: 'Tell me about Kevin',
                    outputTruncated: false,
                    executionMs: 2.1,
                    startedAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    logs: [],
                },
                // c_send: {
                //     status: 'succeeded',
                //     inputs: {},
                //     output: 'If not, tell me about Quantum',
                //     outputTruncated: false,
                //     executionMs: 2.3,
                //     startedAt: new Date().toISOString(),
                //     completedAt: new Date().toISOString(),
                //     logs: [],
                // },
                d_invoke: {
                    status: 'succeeded',
                    inputs: { b_send: 'Hello, Tell me about Kevin' },
                    output: 'INVOKE_AGENT_STUBBED',
                    outputTruncated: false,
                    executionMs: 10.5,
                    startedAt: new Date().toISOString(),
                    completedAt: new Date().toISOString(),
                    logs: [],
                },
            },
        };
    }

    // TODO: Wire to GET /api/workflows/runs/{runId} when PR5 endpoints land
    const response = await fetch(`${API_BASE}/runs/${runId}`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to get workflow run: ${response.statusText}`);
    }

    const run = await response.json();
    return normalizeRun(run);  // FIX 2: Normalize ID
}

/**
 * Create a default workflow template (diamond graph)
 */
export function createDefaultWorkflowTemplate(): WorkflowCreateRequest {
    return {
        name: 'New Workflow',
        description: 'Diamond graph: Start → B, C → D (InvokeAgent stub)',
        graph: {
            nodes: [
                {
                    id: 'start',
                    type: 'start',
                    position: { x: 250, y: 0 },
                },
                {
                    id: 'b_send',
                    type: 'send_message',
                    position: { x: 100, y: 150 },
                    data: { message: 'Hi, Tell me about Kevin' },
                },
                // {
                //     id: 'c_send',
                //     type: 'SendMessage',
                //     position: { x: 400, y: 150 },
                //     data: { message: 'Hello from C' },
                // },
                {
                    id: 'd_invoke',
                    type: 'invoke_agent',
                    position: { x: 250, y: 300 },
                    data: { agentId: 'TRIAGE', input: 'Question:' },
                },
            ],
            edges: [
                { id: 'e1', source: 'start', target: 'b_send' },
                // { id: 'e2', source: 'start', target: 'c_send' },
                { id: 'e3', source: 'b_send', target: 'd_invoke' },
                // { id: 'e4', source: 'c_send', target: 'd_invoke' },
            ],
        },
    };
}
