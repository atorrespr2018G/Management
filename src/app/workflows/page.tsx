// Management/src/app/workflows/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Alert, Box, Typography } from '@mui/material';
import type { Workflow } from '@/types/workflow';
import { listWorkflows, createWorkflow, createDefaultWorkflowTemplate } from '@/lib/api/workflows';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export default function WorkflowsPage() {
    const router = useRouter();
    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Check auth status on mount
    useEffect(() => {
        checkAuth();
    }, []);

    // Fetch workflows when authenticated
    useEffect(() => {
        if (authStatus === 'authenticated') {
            loadWorkflows();
        }
    }, [authStatus]);

    async function checkAuth() {
        try {
            const response = await fetch('/api/auth/me', {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setAuthStatus('authenticated');
            } else if (response.status === 401) {
                setAuthStatus('unauthenticated');
            } else {
                setAuthStatus('unauthenticated');
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            setAuthStatus('unauthenticated');
        }
    }

    async function loadWorkflows() {
        try {
            setLoading(true);
            const data = await listWorkflows();
            setWorkflows(data);
            setError(null);
        } catch (err) {
            // Only show error if it's NOT a 401 (auth errors handled separately)
            if (err instanceof Error && !err.message.includes('401')) {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate() {
        if (authStatus !== 'authenticated') {
            return;
        }

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

    // Loading state
    if (authStatus === 'loading') {
        return (
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated state
    if (authStatus === 'unauthenticated') {
        return (
            <div className="container mx-auto p-6 max-w-6xl">
                <div className="px-4 py-5 sm:px-6">
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">Workflows</h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage and execute your workflows</p>
                </div>

                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                        Please log in to access workflows
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        You need to be logged in to view and create workflows.
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => router.push('/login')}
                    >
                        Go to Login
                    </Button>
                </Box>
            </div>
        );
    }

    // Authenticated state - show full workflows UI
    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold leading-6 text-gray-900">Workflows</h1>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage and execute your workflows</p>
                </div>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    color="primary"
                    disabled={creating}
                >
                    + Create Workflow
                </Button>
            </div>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {loading && (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-600">Loading workflows...</p>
                </div>
            )}
            {(!loading && workflows.length > 0) && (
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(workflow.updatedAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button
                                            onClick={() => router.push(`/workflows/${workflow.id}`)}
                                            variant="text"
                                            color="primary"
                                            size="small"
                                        >
                                            View
                                        </Button>
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
