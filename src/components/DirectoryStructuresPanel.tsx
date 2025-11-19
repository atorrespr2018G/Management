'use client';

import React, { useState } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Paper,
    Typography,
    Chip,
    Button,
    IconButton,
    Alert,
    CircularProgress,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import DatabaseIcon from '@mui/icons-material/Storage';

import type { FileStructure } from '@/types/neo4j';
import DirectoryNodeStructure from './DirectoryNodeStructure';
import NeoDirectoryStructureCard from './NeoDirectoryStructureCard';
import { useNeo4jStructure } from '@/hooks/useNeo4jStructure';

interface DirectoryStructuresPanelProps {
    /** Root of the scanned directory tree */
    scanResults: FileStructure;

    /** Current machine id (used to enable/disable Store in Neo4j button) */
    machineId: string | null;

    /** Whether we are currently storing the directory metadata in Neo4j */
    isStoring: boolean;

    /** Status message for storing in Neo4j (success/error/info) */
    storeMessage?: string;

    /** Trigger storing the scanned directory in Neo4j */
    onStoreInNeo4j: () => void;

    /** Fetch Graph Data to render new/deleted relationships */
    onGraphDataChanged?: () => Promise<void>;
}

/**
 * Shows the LOCAL (scanned) directory structure and the Neo4j directory structure side-by-side
 */
const DirectoryStructuresPanel = ({
    scanResults,
    machineId,
    isStoring,
    storeMessage,
    onStoreInNeo4j,
    onGraphDataChanged
}: DirectoryStructuresPanelProps) => {
    const [copied, setCopied] = useState(false)
    const { fetchNeo4jStructure } = useNeo4jStructure({
        machineId,
        node: scanResults,
        autoFetch: true, // preserves the old "load on mount / scan change" behaviour
    });

    const handleCopy = () => {
        const dataStr = JSON.stringify(scanResults, null, 2)
        navigator.clipboard.writeText(dataStr).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleDownload = () => {
        const dataStr = JSON.stringify(scanResults, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `scan-results-${new Date().toISOString()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <Grid container spacing={2}>
            {/* Scanned / Local Directory */}
            <Grid item xs={12} md={6}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1,
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography whiteSpace="nowrap" fontWeight={600}>
                                    Directory Structure (Scanned)
                                </Typography>
                                <Chip
                                    label="LOCAL"
                                    size="small"
                                    sx={{ bgcolor: 'grey.200', color: 'grey.700' }}
                                />
                            </Box>

                            {scanResults && (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={onStoreInNeo4j}
                                        disabled={isStoring || !machineId}
                                        startIcon={isStoring ? <CircularProgress size={16} /> : <DatabaseIcon />}
                                    >
                                        {isStoring ? 'Storing...' : 'Store in Neo4j'}
                                    </Button>
                                    <IconButton onClick={handleCopy} size="small">
                                        <ContentCopyIcon />
                                    </IconButton>
                                    <IconButton onClick={handleDownload} size="small">
                                        <DownloadIcon />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>

                        {/* Status message */}
                        {storeMessage && (
                            <Alert
                                severity={storeMessage.startsWith('✅') ? 'success' : storeMessage.startsWith('❌') ? 'error' : 'info'}
                                sx={{ mb: 2 }}
                            >
                                {storeMessage}
                            </Alert>
                        )}

                        {copied && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                Copied to clipboard!
                            </Alert>
                        )}
                        {storeMessage && (
                            <Alert severity={storeMessage.includes('❌') ? 'error' : 'success'} sx={{ mb: 2 }}>
                                {storeMessage}
                            </Alert>
                        )}

                        {/* Tree */}
                        <Box sx={{ pt: 0 }}>
                            <DirectoryNodeStructure node={scanResults} fetchNeo4jStructure={fetchNeo4jStructure} />
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Neo4j Directory */}
            <Grid item xs={12} md={6}>
                <NeoDirectoryStructureCard fetchNeo4jStructure={fetchNeo4jStructure} onGraphDataChanged={onGraphDataChanged} />
            </Grid>
        </Grid>
    );
};

export default DirectoryStructuresPanel;
