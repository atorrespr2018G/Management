import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { formatBytes, truncateFileName } from '../../utils/formatters';
import { buildStableId, sortTreeChildren } from '../../utils/treeUtils';
import {
    Box,
    Stack,
    Typography,
    Checkbox,
    FormControlLabel,
    Button,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import WarningIcon from '@mui/icons-material/Warning';
import {
    setSelectedForRag,
    toggleSelectedForGraph,
} from '../../store/slices/neoSlice';
import type { FileStructure } from '@/types/neo4j'
import { RagStatusBadge, GraphStatusBadge } from '../../components/ui/StatusBadges';
import { deleteFileChunks } from '@/services/neo4jApi';

// Reusable Component replacing renderNeo4jNodeWithUpload
const DirectoryNodeStructure = ({ node, level = 0, isSelectable = false, areActionsEnabled = true, fetchNeo4jStructure, isLocal = false, storedRoot = null, storeLocalDirectory, localRootNode }: {
    node: FileStructure,
    level?: number,
    isSelectable?: boolean,
    areActionsEnabled?: boolean
    fetchNeo4jStructure?: () => Promise<void>,
    isLocal?: boolean,
    storedRoot?: FileStructure | null,
    storeLocalDirectory?: () => Promise<void>,
    localRootNode?: FileStructure | null,
}) => {
    if (!node) return null;
    const dispatch = useDispatch();
    const [updatingFile, setUpdatingFile] = useState(false);
    const {
        selectedForRag,
        ragStatuses,
        selectedForGraph,
        relationshipStatuses,
    } = useSelector((state: any) => state.neo);

    const isDirectory = node.type === 'directory';
    const Icon = isDirectory ? FolderOpenIcon : InsertDriveFileIcon;
    const children = node.children || [];
    const bytes = node.size

    // Helper function to find a matching node in the stored structure
    const findStoredNode = (root: FileStructure | null, relativePath: string): FileStructure | null => {
        if (!root) return null;
        
        const traverse = (current: FileStructure): FileStructure | null => {
            if (current.relativePath === relativePath) {
                return current;
            }
            if (current.children) {
                for (const child of current.children) {
                    const found = traverse(child);
                    if (found) return found;
                }
            }
            return null;
        };
        
        return traverse(root);
    };

    // Check if file has changed (size, modifiedTime, or hash)
    const hasChanged = (): boolean => {
        if (!isLocal || !storedRoot || isDirectory) return false;
        
        const storedNode = findStoredNode(storedRoot, node.relativePath || '');
        if (!storedNode) return true; // New file
        
        return (
            node.size !== storedNode.size ||
            node.modifiedTime !== storedNode.modifiedTime ||
            node.hash !== storedNode.hash
        );
    };

    const fileChanged = hasChanged();

    // data for selectable functionality
    const machineId = localStorage.getItem('machineId') || '';
    
    // Delete file from Neo4j (replicate delete button functionality)
    const handleUpdateFile = async () => {
        if (!machineId || !node || updatingFile) return;
        
        const filePath = node.fullPath || node.id || '';
        if (!filePath) return;
        
        try {
            setUpdatingFile(true);
            await deleteFileChunks(machineId, filePath);
            if (storeLocalDirectory) {
                await storeLocalDirectory();
            }
            if (fetchNeo4jStructure) {
                await fetchNeo4jStructure();
            }
        } catch (err) {
            console.error('Failed to delete file in Neo4j', err);
        } finally {
            setUpdatingFile(false);
        }
    };

    const stableId = buildStableId(machineId, node);
    const isSelectedForRag = selectedForRag[stableId] || false;
    const ragStatus = ragStatuses[stableId] || 'none';
    const hasRelationships = relationshipStatuses[stableId] || false
    const isSelectedForGraph = selectedForGraph[stableId] || false;

    // Sort children: directories first, then files, both alphabetically (same as scanned tree)
    const sortedChildren = children ? sortTreeChildren(children) : []

    // Toggle selection for a node (recursive for folders)
    const toggleSelection = (node: FileStructure, machineId: string) => {
        const stableId = buildStableId(machineId, node);
        const isSelectedForRag = selectedForRag[stableId] || false;
        const newSelected = !isSelectedForRag;

        dispatch(setSelectedForRag({ node, machineId, stableId, newSelected }));
    };

    return (
        <Box sx={{ ml: level ? 0.5 : 0, my: 0.5 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ color: 'text.primary', height: '2.2em' }}
            >
                {/* Left side: icon, name, size */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Icon fontSize="small" color={isDirectory ? 'primary' : 'action'} />
                    <Typography variant="body2" fontWeight={500} lineHeight='1.2'>
                        {`${truncateFileName(node, (isSelectable ? 48 : 68))}`}
                        {fileChanged && isLocal ? ' (changed)' : ''}
                        {/* {`${truncateFileName(node, (isSelectable ? 48 : 68))} (${typeof bytes === 'number' ? formatBytes(bytes) : ''})`} */}
                    </Typography>
                    {fileChanged && isLocal && <WarningIcon fontSize="small" sx={{ color: '#FFC107' }} />}
                    {fileChanged && isLocal && (
                        <Button 
                            variant="contained" 
                            size="small" 
                            onClick={handleUpdateFile}
                            disabled={updatingFile}
                            sx={{ 
                                minWidth: 'auto', 
                                px: 1, 
                                py: 0.25, 
                                fontSize: '0.75rem',
                                backgroundColor: '#FFC107',
                                color: '#000',
                                '&:hover': {
                                    backgroundColor: '#FFB300'
                                }
                            }}
                        >
                            {updatingFile ? 'Updating...' : 'Update'}
                        </Button>
                    )}
                    {typeof bytes === 'number' && (
                        <Typography variant="caption" color="text.secondary" whiteSpace='nowrap'>
                            ({formatBytes(bytes)})
                        </Typography>
                    )}
                </Stack>

                {/* Right side: selection + RAG / upload info */}
                {isSelectable && (
                    <Stack direction="row" spacing={1} alignItems="center" >
                        {isDirectory && level === 0 && (
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
                                    <Typography variant="caption" color="text.secondary">
                                        Select All
                                    </Typography>
                                }
                            />
                        )}

                        {!isDirectory && (
                            <>
                                <RagStatusBadge status={ragStatus} />
                                {areActionsEnabled && (
                                    <>
                                        <GraphStatusBadge
                                            isSelected={isSelectedForGraph}
                                            hasRelationships={hasRelationships}
                                            canSelect={!hasRelationships}
                                            showBadge={ragStatus !== 'none'}
                                            onToggle={() => dispatch(toggleSelectedForGraph({ stableId }))}
                                        />

                                        {/* single checkbox that means "this file is selected for actions" */}
                                        <FormControlLabel
                                            sx={{ m: 0 }}
                                            control={
                                                <Checkbox
                                                    size="small"
                                                    checked={isSelectedForRag}
                                                    color={ragStatus !== 'none' ? 'error' : 'info'}
                                                    onChange={() => toggleSelection(node, machineId)}
                                                />
                                            }
                                            label={''}
                                        />
                                    </>
                                )}
                            </>
                        )}
                    </Stack>
                )}
            </Stack>

            {/* Children */}
            {sortedChildren && sortedChildren.length > 0 && (
                <Box
                    sx={{
                        borderLeft: 1,
                        borderColor: 'divider',
                        ml: 2,
                        pl: 1,
                        mt: 0.5,
                    }}
                >
                    {sortedChildren.map((child: any) => (
                        <DirectoryNodeStructure
                            key={child.id}
                            node={child}
                            level={level + 1}
                            isSelectable={isSelectable}
                            fetchNeo4jStructure={fetchNeo4jStructure}
                            isLocal={isLocal}
                            storedRoot={storedRoot}
                            storeLocalDirectory={storeLocalDirectory}
                            localRootNode={localRootNode}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default DirectoryNodeStructure