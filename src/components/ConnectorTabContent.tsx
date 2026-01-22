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
    Button,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import DatabaseIcon from '@mui/icons-material/Storage'
import type { ConnectorPath } from '@/types/neo4j'
import type { FileStructure } from '@/types/neo4j'
import ScanResultsDisplay from '@/components/ScanResultsDisplay'
import ScannedDirectoryStructureCard from './DirectoryStructure/ScannedDirectoryStructureCard'
import NeoDirectoryStructureCard from './DirectoryStructure/NeoDirectoryStructureCard'
import DirectoryNodeStructure from './DirectoryStructure/DirectoryNodeStructure'
import { DirectoryStructureContainer } from './DirectoryStructure/DirectoryStructureContainer'
import { TimedAlert } from './TimedAlert'
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
    
    // Local state for path-specific Neo4j structure
    const [localNeo4jStructure, setLocalNeo4jStructure] = React.useState<FileStructure | null>(null);

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
        onAfterStore: async () => {
            await fetchNeo4jStructure();
            // Also fetch local structure after storing
            if (node?.fullPath && finalMachineId) {
                try {
                    const { getDirectoryFromNeo4j } = await import('@/services/neo4jApi');
                    const result = await getDirectoryFromNeo4j(finalMachineId, node.fullPath);
                    if (result.found && result.structure) {
                        setLocalNeo4jStructure(result.structure);
                    }
                } catch (error) {
                    console.error('Error fetching local Neo4j structure:', error);
                }
            }
        },
    })

    // Fetch the Neo4j structure for this specific path on mount
    React.useEffect(() => {
        if (node?.fullPath && finalMachineId) {
            const fetchLocalStructure = async () => {
                try {
                    const { getDirectoryFromNeo4j } = await import('@/services/neo4jApi');
                    const result = await getDirectoryFromNeo4j(finalMachineId, node.fullPath);
                    if (result.found && result.structure) {
                        setLocalNeo4jStructure(result.structure);
                    }
                } catch (error) {
                    console.error('Error fetching local Neo4j structure:', error);
                }
            };
            fetchLocalStructure();
        }
    }, [node?.fullPath, finalMachineId]);

    if (!node) return null

    return (
        <Box sx={{ mt: 0 }}>
            <Grid container spacing={2}>
                {/* Scanned / Local Directory */}
                <Grid item xs={12} md={6}>
                    <ScannedDirectoryStructureCardWithLocalNeo4j
                        node={node}
                        machineId={finalMachineId}
                        storeMessage={storeMessage}
                        isStoring={isStoring}
                        onStoreInNeo4j={handleStoreInNeo4j}
                        fetchNeo4jStructure={fetchNeo4jStructure}
                        areActionsEnabled={false}
                        localNeo4jStructure={localNeo4jStructure}
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

/**
 * Wrapper component that uses local Neo4j structure instead of Redux global state
 */
const ScannedDirectoryStructureCardWithLocalNeo4j: React.FC<{
    node: FileStructure | null
    machineId: string | null
    storeMessage: string
    isStoring: boolean
    onStoreInNeo4j: () => Promise<void>
    fetchNeo4jStructure: () => Promise<void>
    areActionsEnabled: boolean
    localNeo4jStructure: FileStructure | null
}> = ({ localNeo4jStructure, ...props }) => {
    return (
        <DirectoryStructureContainer
            title="Directory Structure"
            chipLabel="LOCAL"
            chipColor="warning"
            actions={
                <Button
                    variant="contained"
                    onClick={props.onStoreInNeo4j}
                    disabled={props.isStoring}
                    startIcon={props.isStoring ? <CircularProgress size={20} /> : <DatabaseIcon />}
                >
                    {props.isStoring ? 'Storing...' : 'Store in Neo4j'}
                </Button>
            }
            alerts={
                props.storeMessage && (
                    <TimedAlert
                        sx={{ mb: 2 }}
                        message={props.storeMessage}
                        severity={props.storeMessage.includes('❌') ? 'error' : 'success'}
                        durationMs={4000}
                    />
                )
            }
        >
            <DirectoryNodeStructure
                node={props.node}
                fetchNeo4jStructure={props.fetchNeo4jStructure}
                areActionsEnabled={props.areActionsEnabled}
                isLocal={true}
                storedRoot={localNeo4jStructure}
                storeLocalDirectory={props.onStoreInNeo4j}
                localRootNode={props.node}
            />
        </DirectoryStructureContainer>
    );
};
