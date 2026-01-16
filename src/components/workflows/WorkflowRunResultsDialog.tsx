import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Chip,
    Typography,
    Box,
    IconButton,
    Divider,
    Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { NodeResult } from '@/types/workflow';

interface WorkflowRunResultsDialogProps {
    open: boolean;
    onClose: () => void;
    runId: string | null;
    runStatus: 'queued' | 'running' | 'succeeded' | 'failed' | null;
    runError: string | null;
    nodeResults: Record<string, NodeResult> | null;
    executionOrder?: string[];
}

export default function WorkflowRunResultsDialog({
    open,
    onClose,
    runId,
    runStatus,
    runError,
    nodeResults,
    executionOrder = []
}: WorkflowRunResultsDialogProps) {
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

    const handleCopyResults = () => {
        const text = JSON.stringify({
            runId,
            status: runStatus,
            results: nodeResults
        }, null, 2);
        navigator.clipboard.writeText(text);
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case 'succeeded': return 'success';
            case 'failed': return 'error';
            case 'running': return 'primary';
            case 'queued': return 'default';
            default: return 'default';
        }
    };

    const formatTime = (ms?: number) => {
        return typeof ms === 'number' ? `${ms.toFixed(1)}ms` : '-';
    };

    // Derived execution order if not provided
    const displayOrder = executionOrder.length > 0
        ? executionOrder
        : Object.keys(nodeResults || {}).sort();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
        >
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" component="div">
                        Run Results
                    </Typography>
                    {runStatus && (
                        <Chip
                            label={runStatus.toUpperCase()}
                            color={getStatusColor(runStatus) as any}
                            size="small"
                        />
                    )}
                    {runId && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                            ID: {runId.slice(0, 8)}
                        </Typography>
                    )}
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 0 }}>
                {runError && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error">
                            Run Error: {runError}
                        </Alert>
                    </Box>
                )}

                {!nodeResults || Object.keys(nodeResults).length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        {runStatus === 'queued' || runStatus === 'running'
                            ? <Typography>Waiting for execution to start...</Typography>
                            : <Typography>No node results available.</Typography>
                        }
                    </Box>
                ) : (
                    <Box sx={{ width: '100%', overflow: 'hidden' }}>
                        {displayOrder.map((nodeId) => {
                            const result = nodeResults[nodeId];
                            if (!result) return null;

                            const isFailed = result.status === 'failed';

                            return (
                                <Box key={nodeId} sx={{
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    backgroundColor: isFailed ? '#fee2e2' : 'inherit'
                                }}>
                                    <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                        <Box sx={{ flex: 1, minWidth: 0, mr: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, borderRadius: 1 }}>
                                                    {nodeId}
                                                </Typography>
                                                <Chip
                                                    label={result.status}
                                                    size="small"
                                                    variant="outlined"
                                                    color={getStatusColor(result.status) as any}
                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                />
                                                <Typography variant="caption" color="text.secondary">
                                                    {formatTime(result.executionMs)}
                                                </Typography>
                                            </Box>

                                            {/* Output Section */}
                                            <Box sx={{ mt: 1 }}>
                                                {result.outputTruncated ? (
                                                    <Box>
                                                        {expandedOutputs.has(nodeId) ? (
                                                            <Box>
                                                                <pre style={{
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: '#f5f5f5',
                                                                    padding: '8px',
                                                                    borderRadius: '4px',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre-wrap',
                                                                    margin: 0,
                                                                    maxHeight: '300px',
                                                                    overflowY: 'auto'
                                                                }}>
                                                                    {result.output ? result.output : (
                                                                        <span style={{ color: '#666', fontStyle: 'italic' }}>
                                                                            Full output not available; showing preview only.<br />
                                                                            {result.outputPreview}
                                                                        </span>
                                                                    )}
                                                                </pre>
                                                                <Button
                                                                    size="small"
                                                                    onClick={() => toggleOutput(nodeId)}
                                                                    sx={{ mt: 0.5, fontSize: '0.7rem' }}
                                                                >
                                                                    Show Less
                                                                </Button>
                                                            </Box>
                                                        ) : (
                                                            <Box>
                                                                <pre style={{
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: '#fffbeb', // Yellow tint for truncated
                                                                    padding: '8px',
                                                                    borderRadius: '4px',
                                                                    overflowX: 'auto',
                                                                    whiteSpace: 'pre-wrap',
                                                                    margin: 0
                                                                }}>
                                                                    {result.outputPreview || (result.output ? result.output.slice(0, 100) + '...' : '(no preview)')}
                                                                </pre>
                                                                <Button
                                                                    size="small"
                                                                    onClick={() => toggleOutput(nodeId)}
                                                                    sx={{ mt: 0.5, fontSize: '0.7rem' }}
                                                                >
                                                                    Show Full Output
                                                                </Button>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                ) : (
                                                    <pre style={{
                                                        fontSize: '0.75rem',
                                                        backgroundColor: '#f5f5f5',
                                                        padding: '8px',
                                                        borderRadius: '4px',
                                                        overflowX: 'auto',
                                                        whiteSpace: 'pre-wrap',
                                                        margin: 0
                                                    }}>
                                                        {result.output || '(no output)'}
                                                    </pre>
                                                )}
                                            </Box>

                                            {result.error && (
                                                <Box sx={{ mt: 1, color: 'error.main', fontSize: '0.85rem' }}>
                                                    <strong>Error:</strong> {typeof result.error === 'string' ? result.error : (result.error as any).message || JSON.stringify(result.error)}
                                                </Box>
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button
                    startIcon={<ContentCopyIcon />}
                    onClick={handleCopyResults}
                    color="inherit"
                >
                    Copy Results
                </Button>
                <Button onClick={onClose} variant="contained">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}
