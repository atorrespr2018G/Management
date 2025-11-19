
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { buildStableId, getDescendantFileIds } from '../utils/treeHelpers'
import DatabaseIcon from '@mui/icons-material/Storage'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FileUploadIcon from '@mui/icons-material/FileUpload';

// import StorageIcon from '@mui/icons-material/Storage';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import LoopIcon from '@mui/icons-material/Loop';
import DeleteIcon from '@mui/icons-material/Delete'
import { getDirectoryFromNeo4j, uploadFilesBatch, getFileRagStatus, getFileRelationshipStatus, deleteFileRelationships, deleteFileChunks } from '../services/neo4jApi';
import DirectoryNodeStructure from './DirectoryNodeStructure';
import { FileStructure } from '@/types/neo4j';
import {
    setNeo4jDirectoryStructure,
    setIsLoadingNeo4jStructure,
    setSelectedForRag,
    setRagStatuses,
    setUploadStatus,
    setUploadProgress,
    setIsUploading,
    resetUploadProgress,
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
    setChangedFiles,
    removeChangedFiles,
} from '../store/slices/neoSlice';
import {
    Box,
    Card,
    CardHeader,
    CardContent,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Paper,
} from '@mui/material';

import { useMachineId } from '@/hooks/useMachineId';

const NeoDirectoryStructureCard = ({ fetchNeo4jStructure, onGraphDataChanged }: {
    fetchNeo4jStructure: () => Promise<void>,
    onGraphDataChanged?: () => Promise<void>
}) => {
    const dispatch = useDispatch();
    const { machineId } = useMachineId()
    const {
        neo4jDirectoryStructure,
        isLoadingNeo4jStructure,
        selectedForRag,
        uploadStatus,
        uploadProgress,
        isUploading,
        selectedForDelete,
        selectedForDeleteRelationships,
        isDeletingChunks,
        isDeletingRelationships,
        deleteStatus,
        changedFiles
    } = useSelector((state: any) => state.neo);

    const handleUploadDirectory = async (directoryNode: FileStructure) => {
        if (!machineId) {
            dispatch(setUploadStatus({ directoryNode, status: 'Error: Machine ID not found' }));
            return
        }

        // Get selected files with their stable IDs for change detection
        const getSelectedFilesWithIds = (node: FileStructure): Array<{ filePath: string; stableId: string }> => {
            const files: Array<{ filePath: string; stableId: string }> = []
            const stableId = buildStableId(machineId, node)

            if (node.type === 'file' && selectedForRag[stableId]) {
                files.push({ filePath: node.fullPath || node.id, stableId })
            }

            if (node.children) {
                node.children.forEach(child => {
                    files.push(...getSelectedFilesWithIds(child))
                })
            }

            return files
        }

        const selectedFilesWithIds = getSelectedFilesWithIds(directoryNode)
        const selectedFiles = selectedFilesWithIds.map(f => f.filePath)

        if (selectedFiles.length === 0) {
            dispatch(setUploadStatus({ directoryNode, status: 'No files selected' }));
            return
        }

        // Initialize progress
        dispatch(setUploadProgress({ done: 0, total: selectedFiles.length, totalChunks: 0 }));
        dispatch(setIsUploading(true));
        // Check for changed files and delete relationships before upload
        const changedFilesToClean = selectedFilesWithIds.filter(f => changedFiles[f.stableId])

        if (changedFilesToClean.length > 0) {
            // setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: `Cleaning up ${changedFilesToClean.length} changed file(s)...` }))
            dispatch(setUploadStatus({ directoryNode, status: `Cleaning up ${changedFilesToClean.length} changed file(s)...` }));

            // Delete relationships for changed files (chunks will be auto-deleted during upload)
            for (const fileInfo of changedFilesToClean) {
                try {
                    await deleteFileRelationships(machineId, fileInfo.filePath)
                    console.log(`Deleted relationships for changed file: ${fileInfo.filePath}`)
                } catch (error) {
                    console.warn(`Failed to delete relationships for ${fileInfo.filePath}:`, error)
                    // Continue even if deletion fails - chunks will be deleted during upload anyway
                }
            }
        }

        // setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'Uploading...' }))
        dispatch(setUploadStatus({ directoryNode, status: 'Uploading...' }));

        // Process files in batches (batch size: 7)
        const BATCH_SIZE = 7
        let totalChunks = 0
        let processed = 0
        const allErrors: string[] = []

        try {
            for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
                const batch = selectedFiles.slice(i, i + BATCH_SIZE)

                try {
                    console.log(`Uploading batch ${i / BATCH_SIZE + 1}:`, batch)
                    const result = await uploadFilesBatch(machineId, batch)
                    console.log('Upload result:', result)

                    totalChunks += result.created_chunks || 0
                    processed += result.processed_files || 0

                    // Collect errors if any
                    if (result.errors && result.errors.length > 0) {
                        console.error('Upload errors:', result.errors)
                        result.errors.forEach((err: any) => {
                            const errorMsg = `${err.file_path}: ${err.error}`
                            console.error(errorMsg)
                            allErrors.push(errorMsg)
                        })
                    }

                    dispatch(setUploadProgress({
                        done: processed,
                        total: selectedFiles.length,
                        totalChunks: totalChunks
                    }));
                    dispatch(setUploadStatus({ directoryNode, status: `added ${totalChunks} file chunks for ${selectedFiles.length} file(s)` }));

                } catch (error) {
                    console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error)
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                    allErrors.push(`Batch ${i / BATCH_SIZE + 1}: ${errorMessage}`)
                }
            }

            // Update status with total chunks and any errors
            let statusMessage = ''
            if (totalChunks === 0 && processed === 0) {
                if (allErrors.length > 0) {
                    statusMessage = `No chunks created. Errors: ${allErrors.slice(0, 3).join('; ')}${allErrors.length > 3 ? '...' : ''}`
                } else {
                    statusMessage = 'No chunks created. Make sure files are stored in Neo4j first (click "Store in Neo4j" button) and file paths are correct.'
                }
            } else {
                const changedCount = changedFilesToClean.length > 0 ? ` (${changedFilesToClean.length} changed file(s) cleaned)` : ''
                statusMessage = `Uploaded: ${totalChunks} chunks from ${processed} files${changedCount}`
                if (allErrors.length > 0) {
                    statusMessage += `. ${allErrors.length} error(s): ${allErrors.slice(0, 2).join('; ')}${allErrors.length > 2 ? '...' : ''}`
                }
            }
            // setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: statusMessage }))
            dispatch(setUploadStatus({ directoryNode, status: statusMessage }));
            dispatch(setUploadProgress({ done: 0, total: selectedFiles.length, totalChunks: 0 }));
            dispatch(resetUploadProgress());
            dispatch(setIsUploading(false));

            // Refresh Neo4j structure to reflect which files now have RAG
            await fetchNeo4jStructure()

            if (onGraphDataChanged)
                await onGraphDataChanged()

            // Clear selections after successful upload
            dispatch(setSelectedForRag({}));


            // Clear changed files status for successfully uploaded files
            dispatch(
                removeChangedFiles({
                    stableIds: selectedFilesWithIds.map(f => f.stableId),
                })
            );
            // setChangedFiles(prev => {
            //     const updated = { ...prev }
            //     selectedFilesWithIds.forEach(fileInfo => {
            //         if (updated[fileInfo.stableId]) {
            //             delete updated[fileInfo.stableId]
            //         }
            //     })
            //     return updated
            // })
        } catch (e: any) {
            dispatch(setUploadStatus({ directoryNode, status: `Error: ${e.response?.data?.detail || e.message}` }));
            dispatch(setUploadProgress({ done: 0, total: 0, totalChunks: 0 }));
            dispatch(resetUploadProgress());
            dispatch(setIsUploading(false));
        }
    }

    const handleButtons = (directoryNode: FileStructure) => {
        if (!directoryNode) return null;

        const { id, fullPath } = directoryNode
        const machineId = localStorage.getItem('machineId') || '';
        const hasSelectedFiles = getDescendantFileIds(
            directoryNode,
            machineId
        ).some((id) => selectedForRag[id]);

        // const isUploading = uploadProgress.total > 0 && uploadProgress.done < uploadProgress.total;
        // const isUploading = useSelector((state: any) => state.neo.isUploading);

        // console.log(uploadProgress)


        return (
            <>
                <Button
                    variant="contained"
                    size="small"
                    startIcon={!isUploading && <FileUploadIcon fontSize="small" />}
                    onClick={() => handleUploadDirectory(directoryNode)}
                    disabled={!hasSelectedFiles || isUploading}
                >
                    {isUploading ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CircularProgress size={16} />
                            <Typography variant="caption">
                                Uploading… {uploadProgress.done}/{uploadProgress.total}
                            </Typography>
                        </Stack>
                    ) : (
                        'Upload Docs'
                    )}
                </Button>
                <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    onClick={() => handleDeleteSelected(directoryNode)}
                    disabled={
                        (getSelectedFilesForDelete(directoryNode).length === 0 &&
                            getSelectedFilesForDeleteRelationships(directoryNode).length === 0) ||
                        isDeletingChunks[fullPath || id] ||
                        isDeletingRelationships[fullPath || id]
                    }
                    startIcon={
                        isDeletingChunks[fullPath || id] ||
                            isDeletingRelationships[fullPath || id] ? (
                            <CircularProgress size={16} />
                        ) : (
                            <DeleteIcon />
                        )
                    }
                >
                    {isDeletingChunks[fullPath || id] ||
                        isDeletingRelationships[fullPath || id]
                        ? 'Deleting...'
                        : `Delete (${getSelectedFilesForDelete(directoryNode).length +
                        getSelectedFilesForDeleteRelationships(directoryNode).length
                        })`}
                </Button>
            </>

        )
    }

    // Get all selected file paths for deletion
    const getSelectedFilesForDelete = (directoryNode: FileStructure): string[] => {
        const files: string[] = []
        const traverse = (node: FileStructure) => {
            if (node.type === 'file') {
                const stableId = buildStableId(machineId || '', node)
                if (selectedForDelete[stableId]) {
                    files.push(node.fullPath || node.id)
                }
            }
            if (node.children) {
                node.children.forEach(child => traverse(child))
            }
        }
        traverse(directoryNode)
        return files
    }

    // Get all selected file paths for relationship deletion
    const getSelectedFilesForDeleteRelationships = (directoryNode: FileStructure): string[] => {
        const files: string[] = []
        const traverse = (node: FileStructure) => {
            if (node.type === 'file') {
                const stableId = buildStableId(machineId || '', node)
                if (selectedForDeleteRelationships[stableId]) {
                    files.push(node.fullPath || node.id)
                }
            }
            if (node.children) {
                node.children.forEach(child => traverse(child))
            }
        }
        traverse(directoryNode)
        return files
    }


    const handleDeleteSelected = async (directoryNode: FileStructure) => {
        if (!machineId) {
            // setDeleteStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found' }))
            dispatch(setDeleteStatus({ ...deleteStatus, [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found' }));
            return
        }

        const selectedFilesForDelete = getSelectedFilesForDelete(directoryNode)
        const selectedFilesForGraph = getSelectedFilesForDeleteRelationships(directoryNode)

        if (selectedFilesForDelete.length === 0 && selectedFilesForGraph.length === 0) {
            alert('Please select at least one file with "Delete File" or "Delete Graph" checkbox')
            return
        }

        // Build confirmation message
        const actions: string[] = []
        if (selectedFilesForDelete.length > 0) {
            actions.push(`delete file chunks for ${selectedFilesForDelete.length} file(s)`)
            dispatch(setUploadStatus({ directoryNode, status: `deleted file chunks for ${selectedFilesForDelete.length} file(s)` }));
        }
        if (selectedFilesForGraph.length > 0) {
            actions.push(`delete graph for ${selectedFilesForGraph.length} file(s)`)
        }

        if (!confirm(`Are you sure you want to ${actions.join(' and ')}?`)) {
            return
        }

        const directoryPath = directoryNode.fullPath || directoryNode.id
        const isDeleting = selectedFilesForDelete.length > 0 || selectedFilesForGraph.length > 0

        try {
            if (selectedFilesForDelete.length > 0) {
                // setIsDeletingChunks(prev => ({ ...prev, [directoryPath]: true }))
                dispatch(setIsDeletingChunks({ ...isDeletingChunks, [directoryPath]: true }));
            }
            if (selectedFilesForGraph.length > 0) {
                // setIsDeletingRelationships(prev => ({ ...prev, [directoryPath]: true }))
                dispatch(setIsDeletingRelationships({ ...isDeletingRelationships, [directoryPath]: true }));
            }
            // setDeleteStatus(prev => ({ ...prev, [directoryPath]: 'Deleting...' }))
            dispatch(setDeleteStatus({ ...deleteStatus, [directoryPath]: 'Deleting...' }));

            let totalChunks = 0
            let totalRelationships = 0
            const errors: string[] = []

            // Delete file chunks if selected
            if (selectedFilesForDelete.length > 0) {
                for (const filePath of selectedFilesForDelete) {
                    try {
                        const result = await deleteFileChunks(machineId, filePath)
                        totalChunks += result.deleted_chunks || 0
                        totalRelationships += result.deleted_relationships || 0
                    } catch (e: any) {
                        errors.push(`${filePath} (chunks): ${e.response?.data?.detail || e.message}`)
                    }
                }
            }

            // Delete graph relationships if selected (only for files not already deleted)
            if (selectedFilesForGraph.length > 0) {
                for (const filePath of selectedFilesForGraph) {
                    // Skip if this file was already deleted (chunks deletion also removes relationships)
                    if (selectedFilesForDelete.includes(filePath)) {
                        continue
                    }
                    try {
                        const result = await deleteFileRelationships(machineId, filePath)
                        totalRelationships += result.deleted_relationships || 0
                    } catch (e: any) {
                        errors.push(`${filePath} (graph): ${e.response?.data?.detail || e.message}`)
                    }
                }
            }

            // Build status message
            const statusParts: string[] = []
            if (totalChunks > 0) {
                statusParts.push(`${totalChunks} chunks`)
            }
            if (totalRelationships > 0) {
                statusParts.push(`${totalRelationships} graph relationships`)
            }

            const totalFiles = new Set([...selectedFilesForDelete, ...selectedFilesForGraph]).size
            // setDeleteStatus(prev => ({
            //   ...prev,
            //   [directoryPath]: statusParts.length > 0
            //     ? `Deleted ${statusParts.join(' and ')} from ${totalFiles} file(s)${errors.length > 0 ? `. ${errors.length} error(s)` : ''}`
            //     : `No items deleted${errors.length > 0 ? `. ${errors.length} error(s)` : ''}`,
            // }))
            dispatch(
                setDeleteStatus({
                    ...deleteStatus,
                    [directoryPath]: statusParts.length > 0
                        ? `Deleted ${statusParts.join(' and ')} from ${totalFiles} file(s)${errors.length > 0 ? `. ${errors.length} error(s)` : ''}`
                        : `No items deleted${errors.length > 0 ? `. ${errors.length} error(s)` : ''}`
                })
            );

            // Clear selections
            dispatch(setSelectedForDelete({}))
            dispatch(setSelectedForDeleteRelationships({}))

            // Refresh Neo4j structure and RAG statuses
            await fetchNeo4jStructure()

            if (onGraphDataChanged)
                await onGraphDataChanged()
        } catch (e: any) {
            // setDeleteStatus(prev => ({
            //   ...prev,
            //   [directoryPath]: `Error: ${e.response?.data?.detail || e.message}`,
            // }))
            setDeleteStatus({
                ...deleteStatus,
                [directoryPath]: `Error: ${e.response?.data?.detail || e.message}`
            })
        } finally {
            // setIsDeletingChunks(prev => ({ ...prev, [directoryPath]: false }))
            dispatch(setIsDeletingChunks({ ...isDeletingChunks, [directoryPath]: false }));
            // setIsDeletingRelationships(prev => ({ ...prev, [directoryPath]: false }))
            dispatch(setIsDeletingRelationships({ ...isDeletingRelationships, [directoryPath]: false }));

        }
    }

    const uploadTextKey = neo4jDirectoryStructure?.fullPath || neo4jDirectoryStructure?.id;
    const uploadText = uploadTextKey && uploadStatus[uploadTextKey]
        ? uploadStatus[uploadTextKey]
        : '';

    {/* {uploadText && (
                <Typography variant="caption" color="text.secondary">
                    {uploadText}
                </Typography>
            )} */}
    // {(
    //     // uploadStatus[node.fullPath || node.id] ||
    //     deleteStatus[neo4jDirectoryStructure.fullPath || neo4jDirectoryStructure.id]) && (
    //         <Typography
    //             variant="caption"
    //             color="text.secondary"
    //             sx={{ width: '100%' }}
    //         >
    //             {uploadStatus[neo4jDirectoryStructure.fullPath || neo4jDirectoryStructure.id] ||
    //                 deleteStatus[neo4jDirectoryStructure.fullPath || neo4jDirectoryStructure.id]}
    //         </Typography>
    //     )}
    return (
        <>
            {isLoadingNeo4jStructure && (
                <Paper variant="outlined" sx={{ p: 2, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Paper>
            )}
            {!isLoadingNeo4jStructure && (
                <Card>
                    <CardContent>

                        <CardHeader
                            style={{ padding: 0, paddingBottom: '1em' }}
                            title={
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Typography whiteSpace="nowrap" fontWeight={600}>
                                        Directory Structure {/* (Neo4j) */}
                                    </Typography>
                                    <Chip
                                        label="NEO4J DB"
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                    {isLoadingNeo4jStructure && !neo4jDirectoryStructure && (
                                        <LoopIcon fontSize="small" />
                                    )}
                                </Stack>
                            }
                            action={handleButtons(neo4jDirectoryStructure || null)}
                        />
                        {(
                            // uploadStatus[node.fullPath || node.id] ||
                            deleteStatus[neo4jDirectoryStructure?.fullPath || neo4jDirectoryStructure?.id]) && (
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{ width: '100%' }}
                                >
                                    {uploadStatus[neo4jDirectoryStructure?.fullPath || neo4jDirectoryStructure?.id] ||
                                        deleteStatus[neo4jDirectoryStructure?.fullPath || neo4jDirectoryStructure?.id]}
                                </Typography>
                            )}
                        {neo4jDirectoryStructure ? (
                            <DirectoryNodeStructure
                                node={neo4jDirectoryStructure}
                                isSelectableForUpload={true}
                                fetchNeo4jStructure={fetchNeo4jStructure}
                            />
                        ) : (
                            // <Box sx={{ textAlign: 'center', py: 4 }} >
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    flex: 1,
                                    minHeight: 300,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <DatabaseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                <Typography variant="body2" color="text.secondary">
                                    No directory results have been scanned
                                </Typography>
                                {/* </Box> */}
                            </Paper>
                        )}
                    </CardContent>
                </Card>
            )}
        </>
    )
}

export default NeoDirectoryStructureCard;
