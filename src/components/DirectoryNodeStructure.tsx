
import { useDispatch, useSelector } from 'react-redux';
// import { FolderOpen, FileJson } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { buildStableId } from '../utils/treeHelpers';

import {
    Box,
    Stack,
    Typography,
    Checkbox,
    FormControlLabel,
    Chip,
    Button,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress';
import {
    setNeo4jDirectoryStructure,
    setIsLoadingNeo4jStructure,
    setSelectedForRag,
    setRagStatuses,
    setUploadStatus,
    setUploadProgress,
    setSelectedForGraph,
    setSelectedForDelete,
    setSelectedForDeleteRelationships,
    setRelationshipStatuses,
    setRelationshipSettings,
    setIsCreatingRelationships,
    setRelationshipStatus,
    setIsDeletingChunks,
    setIsDeletingRelationships,
    setDeleteStatus,
    setRelationshipStatusForFile,
    toggleSelectedForGraph,
} from '../store/slices/neoSlice';
import {
    storeInNeo4j,
    getNeo4jStats,
    checkNeo4jHealth,
    getDirectoryFromNeo4j,
    uploadFilesBatch,
    getFileRagStatus,
    getFileRelationshipStatus,
    createSemanticRelationships,
    deleteFileRelationships,
    deleteFileChunks,
    deleteDirectoryChunks,
    deleteDirectoryRelationships,
} from '@/services/neo4jApi'
import type { FileStructure } from '@/types/neo4j'

// Reusable Component replacing renderNeo4jNodeWithUpload
const DirectoryNodeStructure = ({ node, level = 0, isSelectableForUpload = false, fetchNeo4jStructure }: {
    node: FileStructure, fetchNeo4jStructure: () => Promise<void>, level?: number, isSelectableForUpload?: boolean
}) => {
    if (!node) return null;
    const dispatch = useDispatch();
    const {
        neo4jDirectoryStructure,
        isLoadingNeo4jStructure,
        selectedForRag,
        ragStatuses,
        uploadStatus,
        uploadProgress,
        selectedForGraph,
        selectedForDelete,
        selectedForDeleteRelationships,
        relationshipStatuses,
        relationshipSettings,
        isCreatingRelationships,
        relationshipStatus,
        isDeletingChunks,
        isDeletingRelationships,
        deleteStatus,
        changedFiles
    } = useSelector((state: any) => state.neo);

    const isDirectory = node.type === 'directory';
    const Icon = isDirectory ? FolderOpenIcon : InsertDriveFileIcon;
    const children = node.children || [];
    const bytes = node.size

    // data for selectable functionality
    const machineId = localStorage.getItem('machineId') || '';
    const stableId = buildStableId(machineId, node);
    const isSelectedForRag = selectedForRag[stableId] || false;
    const ragStatus = ragStatuses[stableId] || 'none';
    const hasRelationships = relationshipStatuses[stableId] || false


    // Get RAG status badge
    const getRagStatusBadge = () => {
        if (ragStatus === 'complete') {
            return <Chip label="Semantic" size="small" color="success" />
        } else if (ragStatus === 'partial') {
            return <Chip label="Semantic Partial" size="small" color="warning" />
        } else {
            return null
        }
    }

    // Get Graph status badge (clickable to select for relationship creation)
    // If relationships already exist, badge is not selectable
    const getGraphStatusBadge = () => {
        const isSelectedForGraph = selectedForGraph[stableId] || false
        const canSelect = !hasRelationships // Only allow selection if no relationships exist
        // console.log('hasRelationships', hasRelationships)

        const chipProps = {
            label: "Graph" as const,
            size: "small" as const,
            icon: isSelectedForGraph ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined,
            onClick: canSelect ? (e: React.MouseEvent) => {
                e.stopPropagation()
                // setSelectedForGraph(prev => ({
                //   ...prev,
                //   [stableId]: !prev[stableId]
                // }))
                // dispatch(
                //   setSelectedForGraph({
                //     ...selectedForGraph,
                //     [stableId]: !selectedForGraph[stableId],
                //   })
                // );
                dispatch(toggleSelectedForGraph({ stableId }));
            } : undefined,
            sx: {
                cursor: canSelect ? 'pointer' : 'default',
                ...(isSelectedForGraph && {
                    border: '2px solid',
                    borderColor: 'primary.main',
                    backgroundColor: 'action.selected',
                    fontWeight: 'bold',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    }
                }),
                ...(hasRelationships && {
                    opacity: 0.9,
                }),
                ...(canSelect && {
                    '&:hover': {
                        opacity: 0.8,
                        transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease-in-out',
                }),
                ...(!canSelect && {
                    '&:hover': {
                        cursor: 'not-allowed',
                    }
                })
            }
        }

        if (hasRelationships) {
            return <Chip {...chipProps} color="success" />
        } else {
            return <Chip {...chipProps} variant="outlined" />
        }
    }

    // Sort children: directories first, then files, both alphabetically (same as scanned tree)
    const sortedChildren = node.children ? [...node.children].sort((a, b) => {
        // Directories come before files
        if (a.type === 'directory' && b.type === 'file') return -1
        if (a.type === 'file' && b.type === 'directory') return 1
        // Within same type, sort alphabetically by name
        return a.name.localeCompare(b.name)
    }) : []

    // Toggle selection for a node (recursive for folders)
    const toggleSelection = (node: FileStructure, machineId: string) => {
        const stableId = buildStableId(machineId, node);
        const isSelectedForRag = selectedForRag[stableId] || false;
        const newSelected = !isSelectedForRag;

        dispatch(setSelectedForRag({ node, machineId, stableId, newSelected }));
    };

    // // Refresh relationship statuses for files in a directory
    // const refreshRelationshipStatuses = async (node: FileStructure) => {
    //     if (!machineId) return

    //     const refreshForNode = async (fileNode: FileStructure) => {
    //         if (fileNode.type === 'file') {
    //             const fileKey = buildStableId(machineId, fileNode)
    //             try {
    //                 const relStatus = await getFileRelationshipStatus(machineId, fileNode.fullPath || fileNode.id)
    //                 // setRelationshipStatuses(prev => ({ ...prev, [fileKey]: relStatus.has_relationships }))
    //                 dispatch(
    //                     setRelationshipStatusForFile({
    //                         fileKey,
    //                         hasRelationships: relStatus.has_relationships
    //                     })
    //                 );
    //             } catch (error) {
    //                 console.error(`Error refreshing relationship status for ${fileNode.fullPath}:`, error)
    //                 // setRelationshipStatuses(prev => ({ ...prev, [fileKey]: false }))
    //                 dispatch(
    //                     setRelationshipStatusForFile({
    //                         fileKey,
    //                         hasRelationships: false
    //                     })
    //                 );
    //             }
    //         }
    //         if (fileNode.children && Array.isArray(fileNode.children)) {
    //             for (const child of fileNode.children) {
    //                 await refreshForNode(child)
    //             }
    //         }
    //     }

    //     await refreshForNode(node)
    // }

    return (
        <Box sx={{ ml: level ? 2 : 0, my: 0.5 }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ color: 'text.primary' }}
                style={{ height: '1.5em' }}
            >
                {/* Left side: icon, name, size */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Icon
                        fontSize="small"
                        color={isDirectory ? 'primary' : 'action'}
                    />
                    <Typography variant="body2" fontWeight={500}>
                        {node.name}
                    </Typography>
                    {typeof bytes === 'number' && (
                        <Typography variant="caption" color="text.secondary">
                            ({formatBytes(bytes)})
                        </Typography>
                    )}
                </Stack>

                {/* Right side: selection + RAG / upload info */}
                {isSelectableForUpload && (
                    <Stack direction="row" spacing={1} alignItems="center" >
                        {isDirectory && (
                            <>
                                <FormControlLabel
                                    sx={{ m: 0 }}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={isSelectedForRag}
                                            onChange={() => toggleSelection(node, machineId || '')}
                                        />
                                    }
                                    label={
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                        >
                                            Select All
                                        </Typography>
                                    }
                                />
                            </>
                        )}

                        {!isDirectory && (
                            <>
                                {ragStatus === 'none' && (
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={isSelectedForRag}
                                                onChange={() => toggleSelection(node, machineId)}
                                            />
                                        }
                                        label={
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                            >
                                                Not RAG
                                            </Typography>
                                        }
                                    />
                                )}
                                {ragStatus != 'none' && (
                                    <>
                                        {getRagStatusBadge()}
                                        {getGraphStatusBadge()}
                                        <FormControlLabel
                                            sx={{ m: 0 }}
                                            control={
                                                <Checkbox
                                                    checked={selectedForDelete[stableId] || false}
                                                    onChange={(e) => {
                                                        // setSelectedForDelete((prev) => ({
                                                        //   ...prev,
                                                        //   [stableId]: e.target.checked,
                                                        // }));
                                                        dispatch(
                                                            setSelectedForDelete({
                                                                ...selectedForDelete,
                                                                [stableId]: e.target.checked,
                                                            })
                                                        );
                                                    }}
                                                    size="small"
                                                />
                                            }
                                            label={
                                                <Typography variant="caption" color="error" style={{ letterSpacing: 0 }}>
                                                    Delete File
                                                </Typography>
                                            }
                                        />

                                        {hasRelationships && (
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        checked={selectedForDeleteRelationships[stableId] || false}
                                                        onChange={(e) => {
                                                            // setSelectedForDeleteRelationships((prev) => ({
                                                            //   ...prev,
                                                            //   [stableId]: e.target.checked,
                                                            // }));
                                                            dispatch(
                                                                setSelectedForDeleteRelationships({
                                                                    ...selectedForDeleteRelationships,
                                                                    [stableId]: e.target.checked,
                                                                })
                                                            );
                                                        }}
                                                        size="small"
                                                    />
                                                }
                                                label={<Typography variant="caption" color="error">Delete Graph</Typography>}
                                                sx={{ m: 0 }}
                                            />
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </Stack>
                )}
            </Stack>

            {/* Children */}
            {children && children.length > 0 && (
                <Box
                    sx={{
                        borderLeft: 1,
                        borderColor: 'divider',
                        ml: 2,
                        pl: 1,
                        mt: 0.5,
                    }}
                >
                    {children.map((child: any) => (
                        <DirectoryNodeStructure
                            key={child.id}
                            node={child}
                            level={level + 1}
                            isSelectableForUpload={isSelectableForUpload}
                            fetchNeo4jStructure={fetchNeo4jStructure}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default DirectoryNodeStructure