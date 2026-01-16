// Management/src/components/workflows/RunStatusPanel.tsx
import { useState } from 'react';
import type { WorkflowRun } from '@/types/workflow';

interface RunStatusPanelProps {
    run: WorkflowRun;
}

export default function RunStatusPanel({ run }: RunStatusPanelProps) {
    const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());

    const toggleOutput = (nodeId: string) => {
        setExpandedOutputs((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'succeeded':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'running':
                return 'bg-blue-100 text-blue-800';
            case 'queued':
                return 'bg-gray-100 text-gray-800';
            case 'canceled':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const nodeResults = Object.entries(run.nodeResults || {});

    return (
        <div>
            <h2 className="text-xl font-bold mb-3">Run Status</h2>

            {/* Run metadata */}
            <div className="bg-white rounded-lg shadow p-4 mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Status</div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getStatusColor(run.status)}`}>
                            {run.status}
                        </span>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Run ID</div>
                        {/* FIX 3: Defensive rendering for run.id */}
                        <code className="text-xs">{run.id ? run.id.slice(0, 8) : 'N/A'}</code>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Started</div>
                        {/* FIX 3: Defensive rendering for timestamps */}
                        <div className="text-xs">
                            {run.startedAt ? new Date(run.startedAt).toLocaleTimeString() : '-'}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Completed</div>
                        <div className="text-xs">
                            {run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : '-'}
                        </div>
                    </div>
                </div>

                {run.error && (
                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                        <strong>Error:</strong> {run.error}
                    </div>
                )}
            </div>

            {/* Node results table */}
            {nodeResults.length > 0 && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b">
                        <h3 className="font-semibold">Node Results ({nodeResults.length})</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Node ID</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time (ms)</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Output</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {nodeResults.map(([nodeId, result]) => (
                                    <tr key={nodeId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{nodeId}</code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded ${result.status === 'succeeded' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {result.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {/* FIX 3: Defensive rendering for executionMs */}
                                            {typeof result.executionMs === 'number' ? result.executionMs.toFixed(1) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {result.outputTruncated ? (
                                                <div>
                                                    {expandedOutputs.has(nodeId) ? (
                                                        <div>
                                                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-40">
                                                                {result.output ? result.output : (
                                                                    <span className="text-gray-500 italic">
                                                                        Full output not available; showing preview only.<br />
                                                                        {result.outputPreview}
                                                                    </span>
                                                                )}
                                                            </pre>
                                                            <button
                                                                onClick={() => toggleOutput(nodeId)}
                                                                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                                            >
                                                                Show preview
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <pre className="text-xs bg-yellow-50 p-2 rounded">
                                                                {result.outputPreview || (result.output ? result.output.slice(0, 100) + '...' : '(no preview)')}
                                                            </pre>
                                                            <button
                                                                onClick={() => toggleOutput(nodeId)}
                                                                className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                                                            >
                                                                Expand full output
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <pre className="text-xs bg-gray-50 p-2 rounded max-w-md overflow-auto">
                                                    {result.output}
                                                </pre>
                                            )}

                                            {result.error && (
                                                <div className="mt-2 text-xs text-red-600">
                                                    <strong>Error:</strong> {result.error}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
