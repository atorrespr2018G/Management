// Management/src/app/workflows/[id]/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import type { Workflow, WorkflowGraph, ValidationIssue, NodeResult } from '@/types/workflow';
import { getWorkflow, validateWorkflow, runWorkflow, getWorkflowRun, createWorkflow, updateWorkflow } from '@/lib/api/workflows';
import WorkflowViewer from '@/components/WorkflowViewer/WorkflowViewer';
import ValidationResultsPanel from '@/components/workflows/ValidationResultsPanel';
import WorkflowRunResultsDialog from '@/components/workflows/WorkflowRunResultsDialog';

export default function WorkflowDetailPage() {
    const params = useParams();
    const router = useRouter();
    const initialWorkflowId = params.id as string;

    // Persistence state
    const [workflowId, setWorkflowId] = useState<string | null>(initialWorkflowId !== 'new' ? initialWorkflowId : null);
    const [workflow, setWorkflow] = useState<Workflow | null>(null);
    const [validationStatus, setValidationStatus] = useState<'unvalidated' | 'valid' | 'invalid'>('unvalidated');
    const [validationErrors, setValidationErrors] = useState<ValidationIssue[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isChanging, setIsChanging] = useState(false);
    const [lastValidatedAt, setLastValidatedAt] = useState<string | null>(null);

    // Save state
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Current graph state (source of truth for the canvas)
    const [currentGraph, setCurrentGraph] = useState<WorkflowGraph | null>(null);

    // Run state (PR6 Phase 2)
    const [currentRunId, setCurrentRunId] = useState<string | null>(null);
    const [runStatus, setRunStatus] = useState<'queued' | 'running' | 'succeeded' | 'failed' | null>(null);
    const [runError, setRunError] = useState<string | null>(null);
    const [nodeResults, setNodeResults] = useState<Record<string, NodeResult> | null>(null);
    const [executionOrder, setExecutionOrder] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [isResultsOpen, setIsResultsOpen] = useState(false);

    // Ref to track last status for transition logging without causing re-renders
    const lastStatusRef = useRef<typeof runStatus>(null);

    useEffect(() => {
        if (workflowId) {
            loadWorkflow();
        } else {
            // Initialize with empty workflow for creation
            const emptyGraph: WorkflowGraph = {
                nodes: [{ id: 'start', type: 'start', position: { x: 100, y: 150 } }],
                edges: []
            };
            setCurrentGraph(emptyGraph);
            setLoading(false);
            setIsChanging(true); // New workflow needs to be saved
        }
    }, [workflowId]);

    // PR6 Phase 2: Poll run status with console logging (optimized - no runStatus dependency)
    useEffect(() => {
        if (!currentRunId || !workflowId) return;

        console.log(`[PR6 Polling] Starting polling for run ${currentRunId}`);
        setIsPolling(true);

        const poll = async () => {
            try {
                const run = await getWorkflowRun(workflowId, currentRunId);

                // Stale data guard - ignore if runId changed
                if (run.id !== currentRunId) {
                    console.log(`[PR6 Polling] Ignoring stale response for run ${run.id}`);
                    return;
                }

                // Log status transitions using ref (no dependency churn)
                if (run.status !== lastStatusRef.current) {
                    console.log(`[PR6 Polling] Status transition: ${lastStatusRef.current} → ${run.status}`);
                    lastStatusRef.current = run.status;
                }

                // Update state
                setRunStatus(run.status);
                setNodeResults(run.nodeResults);
                setRunError(run.error || null);

                // Derive execution order from nodeResults
                const order = Object.keys(run.nodeResults).sort((a, b) => {
                    const aStarted = run.nodeResults[a]?.startedAt;
                    const bStarted = run.nodeResults[b]?.startedAt;
                    if (!aStarted) return 1;
                    if (!bStarted) return -1;
                    return new Date(aStarted).getTime() - new Date(bStarted).getTime();
                });
                setExecutionOrder(order);

                // Log node results summary
                const resultsCount = Object.keys(run.nodeResults).length;
                console.log(`[PR6 Polling] NodeResults: ${resultsCount} nodes`);
                Object.entries(run.nodeResults).forEach(([nodeId, result]) => {
                    const preview = result.output?.substring(0, 50) || '(no output)';
                    console.log(`  - ${nodeId}: ${result.status} | ${preview}`);
                });

                // Terminal state - stop polling
                if (run.status === 'succeeded' || run.status === 'failed') {
                    console.log(`[PR6 Polling] Run ${currentRunId} ${run.status}`);
                    console.log(`[PR6 Polling] Final execution order:`, order);
                    if (run.error) {
                        console.error(`[PR6 Polling] Run error:`, run.error);
                    }
                    setIsRunning(false);
                    setIsPolling(false);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error(`[PR6 Polling] Poll error:`, err);
            }
        };

        // Initial poll
        poll();

        // Poll every 1.5s
        const interval = setInterval(poll, 1500);

        return () => {
            console.log(`[PR6 Polling] Cleanup for run ${currentRunId}`);
            clearInterval(interval);
            setIsPolling(false);
        };
    }, [currentRunId, workflowId]);

    async function loadWorkflow() {
        try {
            setLoading(true);
            const data = await getWorkflow(workflowId!);
            setWorkflow(data);
            setCurrentGraph(data.graph);
            // setValidationStatus(data.validationStatus || 'unvalidated');
            setValidationStatus('valid')
            setError(null);
            setIsChanging(false);  // Freshly loaded = no changes yet
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workflow');
        } finally {
            setLoading(false);
        }
    }

    // // B) Serialize currentGraph to backend format
    // const serializeGraph = useCallback((): WorkflowGraph => {
    //     if (!currentGraph) throw new Error('No graph to serialize');

    //     // Filter out add_action placeholder nodes
    //     const filteredNodes = currentGraph.nodes
    //         .filter(n => n.type !== 'AddAction')
    //         .map(n => ({
    //             id: n.id,
    //             type: n.type === 'StartNode' ? 'StartNode' :
    //                 n.type === 'SendMessage' ? 'SendMessage' :
    //                     n.type === 'InvokeAgent' ? 'InvokeAgent' : n.type,
    //             position: n.position,
    //             data: n.data,
    //             config: n.data  // Backend may expect config field
    //         }));

    //     // Filter edges to only include real nodes
    //     const realNodeIds = new Set(filteredNodes.map(n => n.id));
    //     const filteredEdges = currentGraph.edges
    //         .filter(e => realNodeIds.has(e.source) && realNodeIds.has(e.target))
    //         .map(e => ({
    //             id: e.id,
    //             source: e.source,
    //             target: e.target
    //         }));

    //     return {
    //         nodes: filteredNodes,
    //         edges: filteredEdges,
    //         viewport: currentGraph.viewport
    //     };
    // }, [currentGraph]);

    // Save workflow (draft persistence)
    async function handleSave() {
        if (!currentGraph) return;

        try {
            setIsSaving(true);
            setError(null);

            const workflowData = {
                name: workflow?.name || 'New Workflow',
                description: workflow?.description || 'Created from viewer',
                graph: currentGraph
            };

            // Create or update workflow
            if (!workflowId) {
                const created = await createWorkflow(workflowData);
                setWorkflowId(created.id!);
                setWorkflow(created);
            } else {
                const updated = await updateWorkflow(workflowId, workflowData);
                setWorkflow(updated);
            }

            // Update state
            setIsChanging(false);
            setLastSavedAt(new Date().toISOString());

        } catch (err) {
            console.error('Save error:', err);
            setError(err instanceof Error ? err.message : 'Failed to save workflow');
        } finally {
            setIsSaving(false);
        }
    }

    // ========================================================================
    // DEMO: Validation disabled - not part of PR6 Phase 2 demo
    // ========================================================================
    /*
    async function handleValidate() {
        if (!currentGraph) return;

        try {
            setIsValidating(true);
            setValidationErrors([]);  // Clear previous errors

            // currentGraph is already in backend format thanks to WorkflowViewer's onGraphChange
            const workflowData = {
                name: workflow?.name || 'New Workflow',
                description: workflow?.description || 'Created from viewer',
                graph: currentGraph  // Already serialized by WorkflowViewer!
            };

            // Save before validating if needed
            if (!workflowId) {
                const created = await createWorkflow(workflowData);
                setWorkflowId(created.id!);
                setWorkflow(created);
            } else if (isChanging) {
                await updateWorkflow(workflowId, workflowData);
                setIsChanging(false);
                setLastSavedAt(new Date().toISOString());
            }

            // 3. Validate
            const result = await validateWorkflow(workflowId || workflow?.id!);

            // 4. Update UI state
            // setValidationStatus(result.valid ? 'valid' : 'invalid');
            setValidationStatus('valid');
            setValidationErrors(result.errors || []);
            setLastValidatedAt(new Date().toISOString());
            // setIsChanging(false);  // Successfully validated current state - this is now handled by the save logic above

        } catch (err) {
            console.error('Validation error:', err);
            setError(err instanceof Error ? err.message : 'Validation failed');
        } finally {
            setIsValidating(false);
        }
    }
    */
    // ========================================================================

    // Handle graph changes from WorkflowViewer
    const handleGraphChange = useCallback((newGraph: WorkflowGraph) => {
        setCurrentGraph(newGraph);
        setIsChanging(true);
        // setValidationStatus('unvalidated');  // Reset status
        setValidationStatus('valid')
        setValidationErrors([]);
    }, []);

    // PR6 Phase 2: Run workflow with simplified guardrails (demo version)
    async function handleRun() {
        // Guardrail 1: Must have saved workflowId
        if (!workflowId) {
            console.error('No workflowId - save workflow first');
            setError('Please save the workflow before running');
            return;
        }

        // Guardrail 2: No unsaved changes
        if (isChanging) {
            console.error('Unsaved changes detected');
            setError('Please save changes before running');
            return;
        }

        // Guardrail 3: Not already running
        if (isRunning) {
            console.error('Run already in progress');
            return;
        }

        try {
            console.log(`Starting workflow ${workflowId}`);
            setIsRunning(true);
            setError(null);

            const result = await runWorkflow(workflowId);

            console.log(`Created run ${result.runId} with status ${result.status}`);
            setCurrentRunId(result.runId);
            setRunStatus(result.status);
            setNodeResults({});
            setExecutionOrder([]);
            setIsResultsOpen(true); // Auto-open dialog
        } catch (err) {
            console.error('Failed to start:', err);
            setError(err instanceof Error ? err.message : 'Failed to start run');
            setIsRunning(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading workflow...</p>
                </div>
            </div>
        );
    }

    if (error && !currentGraph) {
        return (
            <div className="container mx-auto p-6 max-w-4xl">
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded">
                    <h2 className="font-bold mb-2">Error</h2>
                    <p>{error}</p>
                    <Button
                        onClick={() => router.push('/workflows')}
                        variant="text"
                        color="primary"
                        sx={{ mt: 2 }}
                    >
                        ← Back to Workflows
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* Top Action Bar */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between">
                <Button
                    onClick={() => router.push('/workflows')}
                    variant="text"
                    sx={{ color: 'text.secondary' }}
                >
                    ← Back to Workflows
                </Button>

                <div className="flex items-center gap-3">
                    {/* Status indicators */}
                    {isChanging && !isSaving && (
                        <span className="text-sm text-orange-600 font-medium">
                            ⚠️ Unsaved changes
                        </span>
                    )}
                    {lastSavedAt && !isChanging && (
                        <span className="text-sm text-gray-500">
                            ✓ Saved {new Date(lastSavedAt).toLocaleTimeString()}
                        </span>
                    )}

                    {/* Save button */}
                    <Button
                        onClick={handleSave}
                        disabled={!isChanging || isSaving || isRunning}
                        variant="contained"
                        color="primary"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </Button>

                    {/* Validate button */}
                    {/* <button
                        onClick={handleValidate}
                        disabled={isValidating || isSaving}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded font-medium transition-colors"
                    >
                        {isValidating ? 'Validating...' : 'Validate'}
                    </button> */}

                    {/* Run button - simplified guardrails */}
                    <Button
                        onClick={handleRun}
                        disabled={isRunning || isChanging || isSaving || !workflowId}
                        variant="contained"
                        color="success"
                    >
                        {isRunning ? 'Running...' : 'Run Workflow'}
                    </Button>
                </div>
            </div>

            {/* Run Status Banner (if active) */}
            {currentRunId && runStatus && (
                <div className={`px-6 py-2 text-sm font-medium ${runStatus === 'succeeded' ? 'bg-green-50 text-green-800' :
                    runStatus === 'failed' ? 'bg-red-50 text-red-800' :
                        'bg-blue-50 text-blue-800'
                    }`}>
                    Run Status: {runStatus.toUpperCase()} (ID: {currentRunId})
                    {runError && runStatus === 'failed' && (
                        <span className="ml-4 font-normal">| Error: {runError}</span>
                    )}
                    {(runStatus === 'succeeded' || runStatus === 'failed') && (
                        <button
                            onClick={() => setIsResultsOpen(true)}
                            className="ml-4 underline hover:no-underline"
                        >
                            View Results
                        </button>
                    )}
                </div>
            )}

            {/* D) Validation Results Panel */}
            {/* {(validationStatus === 'valid' || validationStatus === 'invalid') && !isChanging && (
                <div className="px-6 py-3 bg-gray-50 border-b">
                    <ValidationResultsPanel
                        result={{
                            valid: validationStatus === 'valid',
                            errors: validationErrors
                        }}
                    />
                </div>
            )} */}

            {/* Workflow Visual Display */}
            {currentGraph && (
                <div className="flex-1">
                    <WorkflowViewer
                        graph={currentGraph}
                        name={workflow?.name || 'New Workflow'}
                        validationStatus={validationStatus}
                        validationErrors={validationErrors}
                        onGraphChange={handleGraphChange}
                    />
                </div>
            )}

            <WorkflowRunResultsDialog
                open={isResultsOpen}
                onClose={() => setIsResultsOpen(false)}
                runId={currentRunId}
                runStatus={runStatus}
                runError={runError}
                nodeResults={nodeResults}
                executionOrder={executionOrder}
            />
        </div>
    );
}
