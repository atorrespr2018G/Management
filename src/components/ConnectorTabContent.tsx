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
    Card,
    CardContent,
    Alert,
    TextField,
    Checkbox,
    FormControlLabel,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import DatabaseIcon from '@mui/icons-material/Storage'
import NetworkIcon from '@mui/icons-material/AccountTree'
import type { ConnectorPath } from '@/types/neo4j'
import type { FileStructure } from '@/types/neo4j'
import ScanResultsDisplay from '@/components/ScanResultsDisplay'
import ScannedDirectoryStructureCard from './DirectoryStructure/ScannedDirectoryStructureCard'
import NeoDirectoryStructureCard from './DirectoryStructure/NeoDirectoryStructureCard'
import DirectoryNodeStructure from './DirectoryStructure/DirectoryNodeStructure'
import { DirectoryStructureContainer } from './DirectoryStructure/DirectoryStructureContainer'
import { TimedAlert } from './TimedAlert'
import { ActionButton } from './ui/ActionButton'
import { useSelector, useDispatch } from 'react-redux'
import { useMachineId } from '@/hooks/useMachineId'
import { useNeo4jStructure } from '@/hooks/useNeo4jStructure'
import { useStoreDirectoryInNeo4j } from '@/hooks/useStoreDirectoryInNeo4j'
import { buildStableId } from '@/utils/treeUtils'
import {
    setSelectedForGraph,
    setRelationshipSettings,
    setIsCreatingRelationships,
    setRelationshipStatus,
    setRelationshipStatusForFile,
    setHasEverCreatedGraph,
} from '../store/slices/neoSlice'
import {
    getFileRelationshipStatus,
    createSemanticRelationships,
} from '@/services/neo4jApi'

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
    const dispatch = useDispatch()
    
    // Local state for path-specific Neo4j structure
    const [localNeo4jStructure, setLocalNeo4jStructure] = React.useState<FileStructure | null>(null);

    // Redux state for graph creation
    const {
        selectedForGraph,
        relationshipSettings,
        isCreatingRelationships,
        relationshipStatus,
        hasEverCreatedGraph,
    } = useSelector((state: any) => state.neo);

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

    // Refresh relationship statuses for files in a directory
    const refreshRelationshipStatuses = async (directoryNode: FileStructure) => {
        if (!finalMachineId) return

        const traverseAndRefresh = async (node: FileStructure) => {
            if (node.type === 'file') {
                const fileKey = `${finalMachineId}:${node.fullPath}`
                try {
                    const status = await getFileRelationshipStatus(fileKey)
                    dispatch(setRelationshipStatusForFile({ fileKey, status }))
                } catch (e) {
                    console.error(`Error fetching relationship status for ${fileKey}:`, e)
                }
            }

            if (node.children) {
                for (const child of node.children) {
                    await traverseAndRefresh(child)
                }
            }
        }

        await traverseAndRefresh(directoryNode)
    }

    // Get selected file IDs helper function
    const getSelectedFileIds = (node: FileStructure): Array<{ fileId: string; stableId: string }> => {
        const selected: Array<{ fileId: string; stableId: string }> = []
        const traverse = (node: FileStructure) => {
            if (node.type === 'file' && finalMachineId) {
                const stableId = buildStableId(node.fullPath)
                const fileKey = `${finalMachineId}:${node.fullPath}`
                if (selectedForGraph[stableId]) {
                    selected.push({ fileId: fileKey, stableId })
                }
            }
            if (node.children) {
                node.children.forEach(child => traverse(child))
            }
        }
        traverse(node)
        return selected
    }

    const handleCreateSemanticRelationships = async (directoryNode: FileStructure) => {
        if (!directoryNode || !directoryNode.fullPath) {
            console.error('directoryNode or directoryNode.fullPath is undefined', directoryNode);
            return
        }

        if (!finalMachineId) {
            dispatch(
                setRelationshipStatus({
                    ...relationshipStatus,
                    [directoryNode.fullPath]: 'Error: Machine ID not found',
                })
            );
            return
        }

        try {
            dispatch(setHasEverCreatedGraph(true));
            dispatch(setIsCreatingRelationships(true))
            const directoryPath = directoryNode.fullPath

            // Get selected file IDs
            const selectedFiles = getSelectedFileIds(directoryNode)

            if (selectedFiles.length === 0) {
                dispatch(
                    setRelationshipStatus({
                        ...relationshipStatus,
                        [directoryPath]: 'No files selected. Click on Graph badges to select files.',
                    })
                );
                return
            }

            dispatch(
                setRelationshipStatus({
                    ...relationshipStatus,
                    [directoryPath]: `Creating relationships for ${selectedFiles.length} file(s)...`,
                })
            );
            let totalCreatedRelationships = 0
            let totalProcessedChunks = 0
            const errors: string[] = []

            // Process each selected file
            for (const { fileId } of selectedFiles) {
                try {
                    const res = await createSemanticRelationships(finalMachineId, directoryPath, {
                        similarity_threshold: relationshipSettings.similarity_threshold,
                        top_k: relationshipSettings.top_k,
                        same_directory_only: relationshipSettings.same_directory_only,
                        same_document_only: relationshipSettings.same_document_only,
                        scope_file_id: fileId,
                    })

                    const result = res.result || res.summary || res
                    totalCreatedRelationships += result.created_relationships || 0
                    totalProcessedChunks += result.processed_chunks || 0
                } catch (e: any) {
                    errors.push(`File ${fileId}: ${e.response?.data?.detail || e.message}`)
                }
            }

            dispatch(
                setRelationshipStatus({
                    ...relationshipStatus,
                    [directoryPath]: errors.length > 0
                        ? `Created ${totalCreatedRelationships} relationships from ${totalProcessedChunks} chunks. ${errors.length} error(s): ${errors.join('; ')}`
                        : `Created ${totalCreatedRelationships} relationships from ${totalProcessedChunks} chunks`,
                })
            );

            // Clear selections after successful creation
            const newSelection = { ...selectedForGraph }
            selectedFiles.forEach(({ stableId }) => {
                delete newSelection[stableId]
            })
            dispatch(setSelectedForGraph(newSelection))

            // Refresh relationship statuses for all files in the directory to update Graph badges
            await refreshRelationshipStatuses(directoryNode)
        } catch (e: any) {
            const errorPath = directoryNode.fullPath || directoryNode.id || 'unknown'
            dispatch(
                setRelationshipStatus({
                    ...relationshipStatus,
                    [errorPath]: `Error: ${e.response?.data?.detail || e.message}`,
                })
            );
        } finally {
            dispatch(setIsCreatingRelationships(false))
        }
    }

    if (!node) return null

    // Check if any files are selected for graph creation
    const hasSelectedGraph = Object.values(selectedForGraph).some(selected => selected === true)
    const showCreateGraph = hasSelectedGraph || hasEverCreatedGraph

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
                        areActionsEnabled={true}
                        rootPath={node.fullPath}
                        machineId={finalMachineId}
                    />
                </Grid>
            </Grid>

            {/* Create Semantic Relationships Section - Only show when Graph badges are selected */}
            {node && node.fullPath && showCreateGraph && (
                <Card sx={{ mt: 2, mb: 3 }}>
                    <CardContent>
                        <Box
                            sx={{
                                mb: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                        >
                            <Typography variant="h6" whiteSpace={'nowrap'}>
                                Create Graph (Semantic Relationships)
                            </Typography>
                            {node.fullPath && relationshipStatus[node.fullPath] && (
                                <Alert severity="info" sx={{ width: '70%', ml: 2 }}>
                                    {relationshipStatus[node.fullPath]}
                                </Alert>
                            )}
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Similarity Threshold (0.0 - 1.0)"
                                    type="number"
                                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                                    value={relationshipSettings.similarity_threshold}
                                    onChange={(e) =>
                                        dispatch(
                                            setRelationshipSettings({
                                                similarity_threshold: parseFloat(e.target.value) || 0.7,
                                            })
                                        )
                                    }
                                    helperText="Only chunks with similarity ≥ this value will be connected"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Top-K Connections (optional)"
                                    type="number"
                                    inputProps={{ min: 1 }}
                                    value={relationshipSettings.top_k || ''}
                                    onChange={(e) =>
                                        dispatch(
                                            setRelationshipSettings({
                                                top_k: e.target.value
                                                    ? parseInt(e.target.value)
                                                    : relationshipSettings.top_k,
                                            }))
                                    }
                                    placeholder="No limit"
                                    helperText="Maximum relationships per chunk (leave empty for no limit)"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={relationshipSettings.same_directory_only}
                                                onChange={(e) =>
                                                    dispatch(
                                                        setRelationshipSettings({
                                                            same_directory_only: e.target.checked,
                                                        })
                                                    )
                                                }
                                            />
                                        }
                                        label="Same Directory Only"
                                    />
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={relationshipSettings.same_document_only}
                                                onChange={(e) =>
                                                    dispatch(
                                                        setRelationshipSettings({
                                                            same_document_only: e.target.checked,
                                                        })
                                                    )
                                                }
                                            />
                                        }
                                        label="Same Document Only"
                                    />
                                </Box>
                            </Grid>
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                            Create Relationships for Directory
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Select a directory from the Neo4j structure above and create relationships
                                        </Typography>
                                    </Box>
                                    <ActionButton
                                        label="Create Graph"
                                        loadingLabel="Creating..."
                                        loading={isCreatingRelationships}
                                        onClick={() => node && handleCreateSemanticRelationships(node)}
                                        icon={<NetworkIcon />}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            )}
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
