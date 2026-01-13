// Management/src/app/workflows/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import type { Workflow } from '@/types/workflow';
import { listWorkflows, createWorkflow, createDefaultWorkflowTemplate } from '@/lib/api/workflows';

export default function WorkflowsPage() {
    const router = useRouter();
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadWorkflows();
    }, []);

    async function loadWorkflows() {
        try {
            setLoading(true);
            const data = await listWorkflows();
            setWorkflows(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workflows');
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        try {
            setCreating(true);
            const template = createDefaultWorkflowTemplate();
            const workflow = await createWorkflow(template);
            router.push(`/workflows/${workflow.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create workflow');
            setCreating(false);
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">Workflows</h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage and execute your workflows</p>
                </div>
                <Button
                    onClick={() => router.push('/workflows/new')}
                    variant="contained"
                    color="primary"
                >
                    + Create Workflow
                </Button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading workflows...</p>
                </div>
            ) : workflows.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-4">No workflows yet</p>
                    <Button
                        onClick={() => router.push('/workflows/new')}
                        variant="text"
                        color="primary"
                    >
                        Create your first workflow →
                    </Button>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Updated
                                </th>

                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {workflows.map((workflow) => (
                                <tr key={workflow.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{workflow.name}</div>
                                        {workflow.description && (
                                            <div className="text-sm text-gray-500">{workflow.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded ${workflow.validationStatus === 'valid'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {workflow.validationStatus}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(workflow.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => router.push(`/workflows/${workflow.id}`)}
                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
