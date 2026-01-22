'use client'

import React, { Fragment } from 'react'
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
    Divider,
    CircularProgress,
    Chip,
    Grid,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import type { ConnectorPath } from '@/types/neo4j'
import type { FileStructure } from '@/types/neo4j'
import ScanResultsDisplay from '@/components/ScanResultsDisplay'
import ScannedDirectoryStructureCard from './DirectoryStructure/ScannedDirectoryStructureCard'
import NeoDirectoryStructureCard from './DirectoryStructure/NeoDirectoryStructureCard'
import { useSelector } from 'react-redux'
import { useMachineId } from '@/hooks/useMachineId'
import { useNeo4jStructure } from '@/hooks/useNeo4jStructure'
import { useStoreDirectoryInNeo4j } from '@/hooks/useStoreDirectoryInNeo4j'

type AllPathResult = {
    path: ConnectorPath
    data: FileStructure
    results: {
        totalFiles: number
        totalFolders: number
        source?: string
    }
}

type Props = {
    currentTab: number
    paths: ConnectorPath[]
    selectedPathId: string | null
    scanning: boolean
    scanningAll: boolean
    allPathResults: Map<string, AllPathResult>
    scanData: FileStructure | null
    scanResults: {
        totalFiles: number
        totalFolders: number
        source?: string
    } | null
    onPathClick: (path: ConnectorPath) => void
    onRequestDeletePath: (path: ConnectorPath) => void;
}

export const ConnectorTabContent: React.FC<Props> = ({
    currentTab,
    paths,
    selectedPathId,
    scanning,
    scanningAll,
    allPathResults,
    scanData,
    scanResults,
    onPathClick,
    onRequestDeletePath,
}) => {
    const handleDeleteClick = (path: ConnectorPath) => {
        onRequestDeletePath(path);
    };

    return (
        <>
            {/* === TAB 0: Paths === */}
            {currentTab === 0 && (
                <>
                    <Paper sx={{ p: 3, mb: 3, borderRadius: 0 }}>
                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                            Configured Paths ({paths.length})
                        </Typography>

                        {paths.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body1" color="text.secondary">
                                    No paths configured yet. Add a path above to get started.
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {paths.map((path, index) => (
                                    <Fragment key={path.id}>
                                        <ListItem
                                            disablePadding
                                            secondaryAction={
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteClick(path)
                                                    }}
                                                    color="error"
                                                    sx={{ mr: 1, }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            }
                                        >
                                            <ListItemButton
                                                onClick={() => {
                                                    if (selectedPathId !== path.id)
                                                        onPathClick(path)
                                                }}
                                                selected={selectedPathId === path.id}
                                                disabled={scanning}
                                                sx={{ cursor: (selectedPathId !== path.id) ? 'pointer' : 'default' }}
                                            >
                                                <ListItemText
                                                    primary={path.name}
                                                    secondary={path.path}
                                                    primaryTypographyProps={{ fontWeight: 500 }}
                                                />
                                                {scanning && selectedPathId === path.id && (
                                                    <CircularProgress size={20} sx={{ ml: 2 }} />
                                                )}
                                            </ListItemButton>
                                        </ListItem>
                                        {index < paths.length - 1 && <Divider />}
                                    </Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>

                    {/* Scan Results for selected path */}
                    {scanData && scanResults && (
                        <Box sx={{ mt: 4 }}>
                            <ScanResultsDisplay
                                scanResults={{
                                    data: scanData,
                                    totalFiles: scanResults.totalFiles,
                                    totalFolders: scanResults.totalFolders,
                                    source: scanResults.source || 'local',
                                    metadata: { source: scanResults.source || 'local' },
                                }}
                            />
                        </Box>
                    )}
                </>
            )}

            {/* === TAB 1: All Results === */}
            {currentTab === 1 && (
                <Box>
                    {scanningAll && (
                        <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography variant="body1" color="text.secondary">
                                Scanning all paths...
                            </Typography>
                        </Paper>
                    )}

                    {!scanningAll && allPathResults.size === 0 && paths.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                No paths configured
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Add a path above to get started
                            </Typography>
                        </Paper>
                    ) : !scanningAll && allPathResults.size === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center' }}>
                            <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                                No scanned results yet
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Use &quot;Scan All Paths&quot; to populate results
                            </Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ mt: 0 }}>
                            {[...allPathResults.values()].map((pathResult, index) => (
                                <Box key={pathResult.path.id}>
                                    <Paper
                                        sx={{
                                            p: 2,
                                            borderRadius: 0,
                                            bgcolor: 'primary.main',
                                            color: 'primary.contrastText',
                                        }}
                                    >
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            {pathResult.path.name}
                                        </Typography>
                                        <Typography variant="body2">{pathResult.path.path}</Typography>
                                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                            <Chip
                                                label={`Files: ${pathResult.results.totalFiles}`}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                            />
                                            <Chip
                                                label={`Folders: ${pathResult.results.totalFolders}`}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                            />
                                        </Box>
                                    </Paper>

                                    {/* Directory Structures - Side by Side for All Results */}
                                    <AllResultsDirectoryStructures
                                        node={pathResult.data}
                                        machineId={null}
                                    />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            )}
        </>
    )
}

/**
 * Component to display Directory Structures (LOCAL and NEO4J) side by side for All Results
 */
const AllResultsDirectoryStructures: React.FC<{
    node: FileStructure | null
    machineId: string | null
}> = ({ node, machineId: propMachineId }) => {
    const { machineId: hookMachineId } = useMachineId()
    const finalMachineId = propMachineId || hookMachineId

    const { fetchNeo4jStructure } = useNeo4jStructure({
        machineId: finalMachineId,
        node,
    })

    const {
        isStoring,
        storeMessage,
        handleStoreInNeo4j,
    } = useStoreDirectoryInNeo4j({
        scanData: node,
        metadata: {},
        machineId: finalMachineId,
        onAfterStore: fetchNeo4jStructure,
    })

    if (!node) return null

    return (
        <Box sx={{ mt: 0 }}>
            <Grid container spacing={2}>
                {/* Scanned / Local Directory */}
                <Grid item xs={12} md={6}>
                    <ScannedDirectoryStructureCard
                        node={node}
                        machineId={finalMachineId}
                        storeMessage={storeMessage}
                        isStoring={isStoring}
                        onStoreInNeo4j={handleStoreInNeo4j}
                        fetchNeo4jStructure={fetchNeo4jStructure}
                        areActionsEnabled={false}
                    />
                </Grid>

                {/* Neo4j Directory - specific to this path */}
                <Grid item xs={12} md={6}>
                    <NeoDirectoryStructureCard
                        fetchNeo4jStructure={fetchNeo4jStructure}
                        onResetNeoStatus={() => {}}
                        areActionsEnabled={false}
                        rootPath={node.fullPath}
                        machineId={finalMachineId}
                    />
                </Grid>
            </Grid>
        </Box>
    )
}
