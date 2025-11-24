
import { useDispatch, useSelector } from 'react-redux';
import { buildStableId } from '../../utils/treeHelpers'
import DatabaseIcon from '@mui/icons-material/Storage'
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LoopIcon from '@mui/icons-material/Loop';
import DeleteIcon from '@mui/icons-material/Delete'
import { uploadFilesBatch, deleteFileRelationships, deleteFileChunks } from '../../services/neo4jApi';
import DirectoryNodeStructure from './DirectoryNodeStructure';
import { FileStructure } from '@/types/neo4j';
import {
    setSelectedForRag,
    setUploadStatus,
    setUploadProgress,
    setIsUploading,
    resetUploadProgress,
    setIsDeletingChunks,
    setIsDeletingRelationships,
    setDeleteStatus,
    removeChangedFiles,
} from '../../store/slices/neoSlice';
import {
    Card,
    CardHeader,
    CardContent,
    Typography,
    Button,
    Chip,
    CircularProgress,
    Stack,
    Paper,
    Box,
} from '@mui/material';
import { TimedAlert } from '@/components/TimedAlert';
import type { AlertColor } from '@mui/material/Alert';
import { useMachineId } from '@/hooks/useMachineId';
import { DirectoryStructureContainer } from './DirectoryStructureContainer';

const NeoDirectoryStructureCard = ({ fetchNeo4jStructure, onGraphDataChanged, areActionsEnabled, onResetNeoStatus }: {
    fetchNeo4jStructure: () => Promise<void>,
    onGraphDataChanged?: () => Promise<void>,
    areActionsEnabled?: boolean,
    onResetNeoStatus?: (key: string) => void
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
        isDeletingChunks,
        isDeletingRelationships,
        deleteStatus,
        changedFiles,
        ragStatuses,
        relationshipStatuses
    } = useSelector((state: any) => state.neo);

    const getSelectedFilesWithStatus = (directoryNode: FileStructure) => {
        const files: Array<{
            filePath: string;
            stableId: string;
            ragStatus: string;
            hasRelationships: boolean;
        }> = [];

        const traverse = (node: FileStructure) => {
            const stableId = buildStableId(machineId || '', node);
            if (node.type === 'file' && selectedForRag[stableId]) {
                files.push({
                    filePath: node.fullPath || node.id,
                    stableId,
                    ragStatus: ragStatuses[stableId] || 'none',
                    hasRelationships: relationshipStatuses[stableId] || false,
                });
            }

            node.children?.forEach(traverse);
        };

        traverse(directoryNode);
        return files;
    };


    const handleUploadDirectory = async (directoryNode: FileStructure) => {
        if (!machineId) {
            dispatch(setUploadStatus({ directoryNode, status: 'Error: Machine ID not found' }));
            return
        }

        const selectedWithStatus = getSelectedFilesWithStatus(directoryNode);

        // upload if: no RAG yet OR file is marked as changed
        const uploadable = selectedWithStatus.filter(
            f => f.ragStatus === 'none' || changedFiles[f.stableId]
        );

        const selectedFiles = uploadable.map(f => f.filePath);

        if (selectedFiles.length === 0) {
            dispatch(setUploadStatus({ directoryNode, status: 'No selected files require upload' }));
            return;
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
        // const selectedFiles = selectedFilesWithIds.map(f => f.filePath)

        if (selectedFiles.length === 0) {
            dispatch(setUploadStatus({ directoryNode, status: 'No files selected' }));
            return
        }

        // Initialize progress
        dispatch(setUploadProgress({ done: 0, total: selectedFiles.length, totalChunks: 0 }));
        dispatch(setDeleteStatus({}));

        dispatch(setIsUploading(true));
        // Check for changed files and delete relationships before upload
        const changedFilesToClean = uploadable.filter(f => changedFiles[f.stableId])

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

        const { id, fullPath } = directoryNode;

        const selected = getSelectedFilesWithStatus(directoryNode);

        const uploadable = selected.filter(
            f => f.ragStatus === 'none' || changedFiles[f.stableId]
        );
        const deletableFiles = selected.filter((f) => f.ragStatus !== 'none');
        const deletableGraphs = selected.filter(
            (f) => f.ragStatus !== 'none' && f.hasRelationships
        );

        const uploadableCount = uploadable.length;
        const deleteFilesCount = deletableFiles.length;
        const deleteGraphsCount = deletableGraphs.length;

        const directoryPath = fullPath || id;

        return (
            <>
                {/* Delete File (semantic chunks) */}
                {areActionsEnabled && (
                    <>
                        {/* Upload Docs */}
                        <Button
                            sx={{ mr: 1, px: 1.3 }}
                            variant="contained"
                            size="large"
                            startIcon={!isUploading && <FileUploadIcon fontSize="small" />}
                            onClick={() => handleUploadDirectory(directoryNode)}
                            disabled={uploadableCount === 0 || isUploading}
                        >
                            {isUploading ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CircularProgress size={16} />
                                    <Typography variant="caption">
                                        Uploading… {uploadProgress.done}/{uploadProgress.total}
                                    </Typography>
                                </Stack>
                            ) : (`Docs (${uploadableCount})`)}
                        </Button>
                        <Button
                            sx={{ mr: 1, px: 1.3 }}
                            variant="outlined"
                            size="large"
                            color="error"
                            onClick={() => handleDeleteFiles(directoryNode)}
                            disabled={isUploading || (deleteFilesCount === 0 || isDeletingChunks[directoryPath])}
                            startIcon={
                                isDeletingChunks[directoryPath] ? <CircularProgress size={16} /> : <DeleteIcon />
                            }
                        >
                            {isDeletingChunks[directoryPath] ? 'Deleting File…' : `File (${deleteFilesCount})`}
                        </Button>

                        {/* Delete Graph (relationships only) */}
                        <Button
                            sx={{ mr: 1, px: 1.3 }}
                            variant="outlined"
                            size="large"
                            color="error"
                            onClick={() => handleDeleteGraphs(directoryNode)}
                            disabled={deleteGraphsCount === 0 || isDeletingRelationships[directoryPath]}
                            startIcon={
                                isDeletingRelationships[directoryPath] ? (
                                    <CircularProgress size={16} />
                                ) : (
                                    <DeleteIcon />
                                )
                            }
                        >
                            {isDeletingRelationships[directoryPath]
                                ? 'Deleting Graph…'
                                : `Graph (${deleteGraphsCount})`}
                        </Button>
                    </>
                )}
            </>
        );
    };

    // Delete semantic chunks (and any relationships) for all selected uploaded files
    const handleDeleteFiles = async (directoryNode: FileStructure) => {
        if (!machineId) {
            dispatch(
                setDeleteStatus({
                    ...deleteStatus,
                    [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found',
                })
            );
            return;
        }

        const selected = getSelectedFilesWithStatus(directoryNode);

        // Only files that are "uploaded" (ragStatus !== 'none')
        const filesForChunks = selected
            .filter((f) => f.ragStatus !== 'none')
            .map((f) => f.filePath);

        if (filesForChunks.length === 0) {
            alert('No selected uploaded files to delete');
            return;
        }

        const directoryPath = directoryNode.fullPath || directoryNode.id;

        try {
            dispatch(setIsDeletingChunks({ ...isDeletingChunks, [directoryPath]: true }));
            dispatch(setDeleteStatus({ ...deleteStatus, [directoryPath]: 'Deleting file chunks…' }));
            dispatch(setUploadStatus({ directoryNode, status: '' }));
            dispatch(resetUploadProgress());

            let totalChunks = 0;
            let totalRelationships = 0;
            const errors: string[] = [];

            for (const filePath of filesForChunks) {
                try {
                    const result = await deleteFileChunks(machineId, filePath);
                    totalChunks += result.deleted_chunks || 0;
                    totalRelationships += result.deleted_relationships || 0;
                } catch (e: any) {
                    errors.push(`${filePath} (chunks): ${e.response?.data?.detail || e.message}`);
                }
            }

            const parts: string[] = [];
            if (totalChunks > 0) parts.push(`${totalChunks} chunks`);
            if (totalRelationships > 0) parts.push(`${totalRelationships} graph relationships`);

            dispatch(
                setDeleteStatus({
                    ...deleteStatus,
                    [directoryPath]:
                        parts.length > 0
                            ? `Deleted ${parts.join(' and ')} from ${filesForChunks.length} file(s)${errors.length ? `. ${errors.length} error(s)` : ''
                            }`
                            : `No items deleted${errors.length ? `. ${errors.length} error(s)` : ''}`,
                })
            );

            // clear selection after delete
            dispatch(setSelectedForRag({}));

            await fetchNeo4jStructure();
        } finally {
            dispatch(setIsDeletingChunks({ ...isDeletingChunks, [directoryPath]: false }));
        }
    };

    // Delete ONLY graph relationships for selected uploaded files that have graph
    const handleDeleteGraphs = async (directoryNode: FileStructure) => {
        if (!machineId) {
            dispatch(
                setDeleteStatus({
                    ...deleteStatus,
                    [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found',
                })
            );
            return;
        }

        const selected = getSelectedFilesWithStatus(directoryNode);

        const filesForGraph = selected
            .filter((f) => f.ragStatus !== 'none' && f.hasRelationships)
            .map((f) => f.filePath);

        if (filesForGraph.length === 0) {
            alert('No selected files have graph relationships to delete');
            return;
        }

        const directoryPath = directoryNode.fullPath || directoryNode.id;

        try {
            dispatch(setIsDeletingRelationships({ ...isDeletingRelationships, [directoryPath]: true }));
            dispatch(setDeleteStatus({ ...deleteStatus, [directoryPath]: 'Deleting graph…' }));
            dispatch(setUploadStatus({ directoryNode, status: '' }));

            let totalRelationships = 0;
            const errors: string[] = [];

            for (const filePath of filesForGraph) {
                try {
                    const result = await deleteFileRelationships(machineId, filePath);
                    totalRelationships += result.deleted_relationships || 0;
                } catch (e: any) {
                    errors.push(`${filePath} (graph): ${e.response?.data?.detail || e.message}`);
                }
            }

            dispatch(setDeleteStatus({
                ...deleteStatus,
                [directoryPath]:
                    totalRelationships > 0
                        ? `Deleted ${totalRelationships} graph relationships from ${filesForGraph.length} file(s)${errors.length
                            ? `. ${errors.length} error(s)` : ''}`
                        : `No graph relationships deleted${errors.length ? `. ${errors.length} error(s)` : ''}`,
            })
            );

            // keep chunks, just refresh graph state
            await fetchNeo4jStructure();
        } finally {
            dispatch(setIsDeletingRelationships({ ...isDeletingRelationships, [directoryPath]: false }));
        }
    };

    // const uploadTextKey = neo4jDirectoryStructure?.fullPath || neo4jDirectoryStructure?.id;
    // const uploadText = uploadTextKey && uploadStatus[uploadTextKey]
    //     ? uploadStatus[uploadTextKey]
    //     : '';

    const statusKey = neo4jDirectoryStructure?.fullPath || neo4jDirectoryStructure?.id || '';
    const statusMessage = (statusKey && (deleteStatus[statusKey] || uploadStatus[statusKey])) || '';

    const getStatusSeverity = (msg: string): AlertColor => {
        const lower = msg.toLowerCase();
        if (lower.startsWith('error') || lower.includes('error:') || lower.includes('delete')) return 'error';
        if (lower.startsWith('no ') || lower.includes('no items deleted')) return 'warning';
        return 'success';
    };


    return (
        <>
            {isLoadingNeo4jStructure && (
                <Paper variant="outlined" sx={{ p: 2, flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Paper>
            )}
            {!isLoadingNeo4jStructure && (
                <DirectoryStructureContainer
                    title="Directory Structure"
                    chipLabel="NEO4J"
                    chipColor="success"
                    actions={handleButtons(neo4jDirectoryStructure)} // your existing buttons JSX
                    alerts={
                        statusKey &&
                        statusMessage &&
                        !statusMessage.includes('relationships from') && (
                            // // {statusKey && statusMessage && (
                            <TimedAlert
                                sx={{ mb: 2 }}
                                message={statusMessage}
                                severity={getStatusSeverity(statusMessage)}
                                durationMs={20000}
                                // autoHide={!statusMessage.includes('Uploading...')}
                                onClose={() => onResetNeoStatus?.(statusKey)}
                            />
                        )}>
                    {neo4jDirectoryStructure ? (
                        <DirectoryNodeStructure
                            node={neo4jDirectoryStructure}
                            isSelectable={true}
                            fetchNeo4jStructure={fetchNeo4jStructure}
                            areActionsEnabled={areActionsEnabled}
                        />
                    ) : (
                        <Box sx={{ flex: 1, mt: 1 }}>
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 1.5,
                                    flex: 1,
                                    minHeight: '100%',
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
                            </Paper>
                        </Box>
                    )}
                </DirectoryStructureContainer>
            )}
        </>
    )
}

export default NeoDirectoryStructureCard;
