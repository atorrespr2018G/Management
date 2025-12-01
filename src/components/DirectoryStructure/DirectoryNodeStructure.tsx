import { useDispatch, useSelector } from 'react-redux';
import { formatBytes, truncateFileName } from '../../utils/formatters';
import { buildStableId, sortTreeChildren } from '../../utils/treeUtils';
import {
    Box,
    Stack,
    Typography,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import {
    setSelectedForRag,
    toggleSelectedForGraph,
} from '../../store/slices/neoSlice';
import type { FileStructure } from '@/types/neo4j'
import { RagStatusBadge, GraphStatusBadge } from '../../components/ui/StatusBadges';

// Reusable Component replacing renderNeo4jNodeWithUpload
const DirectoryNodeStructure = ({ node, level = 0, isSelectable = false, areActionsEnabled = true, fetchNeo4jStructure }: {
    node: FileStructure,
    level?: number,
    isSelectable?: boolean,
    areActionsEnabled?: boolean
    fetchNeo4jStructure?: () => Promise<void>,
}) => {
    if (!node) return null;
    const dispatch = useDispatch();
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

    // data for selectable functionality
    const machineId = localStorage.getItem('machineId') || '';
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
                        {/* {`${truncateFileName(node, (isSelectable ? 48 : 68))} (${typeof bytes === 'number' ? formatBytes(bytes) : ''})`} */}
                    </Typography>
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
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
}

export default DirectoryNodeStructure