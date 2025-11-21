
import { useDispatch, useSelector } from 'react-redux';
import { formatBytes, truncateFileName } from '../../utils/formatters';
import { buildStableId } from '../../utils/treeHelpers';
import {
    Box,
    Stack,
    Typography,
    Checkbox,
    FormControlLabel,
    Chip,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import {
    setSelectedForRag,
    toggleSelectedForGraph,
} from '../../store/slices/neoSlice';
import type { FileStructure } from '@/types/neo4j'

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
        // 🚫 Hide Graph button for files that are not yet uploaded / embedded
        if (ragStatus === 'none' || !areActionsEnabled)
            return null;

        const isSelectedForGraph = selectedForGraph[stableId] || false;
        const canSelect = !hasRelationships; // Only allow selection if no relationships exist

        const chipProps = {
            label: 'Graph' as const,
            size: 'small' as const,
            icon: isSelectedForGraph ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined,
            onClick: canSelect
                ? (e: React.MouseEvent) => {
                    e.stopPropagation();
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
                    '&:hover': { backgroundColor: 'action.hover' },
                }),
                ...(hasRelationships && { opacity: 0.9 }),
                ...(canSelect && {
                    '&:hover': { opacity: 0.8, transform: 'scale(1.05)' },
                    transition: 'all 0.2s ease-in-out',
                }),
                ...(!canSelect && {
                    '&:hover': { cursor: 'not-allowed' },
                }),
            },
        };

        return hasRelationships
            ? (<Chip {...chipProps} color="info" />)
            : (<Chip {...chipProps} variant="outlined" />);
    };

    // Sort children: directories first, then files, both alphabetically (same as scanned tree)
    const sortedChildren = children ? [...children].sort((a, b) => {
        // Directories come before files
        if (a.type === 'directory' && b.type === 'file') return 1
        if (a.type === 'file' && b.type === 'directory') return -1
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

    return (
        <Box sx={{ ml: level ? 0.5 : 0, my: 0.5 }}>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ color: 'text.primary' }}
                style={{ height: '1.8em' }}
            >
                {/* Left side: icon, name, size */}
                <Stack direction="row" spacing={1} alignItems="center">
                    <Icon
                        fontSize="small"
                        color={isDirectory ? 'primary' : 'action'}
                    />
                    <Typography variant="body2" fontWeight={500}>
                        {`${truncateFileName(node, (isSelectable ? 48 : 68))}`}
                        {/* {`
                            ${truncateFileName(node, (isSelectable ? 48 : 68))} (${typeof bytes === 'number' ? formatBytes(bytes) : ''})
                        `} */}
                    </Typography>
                    {typeof bytes === 'number' && (
                        <Typography variant="caption" color="text.secondary" //sx={{ lineHeight: 0 }}
                        >
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
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                    >
                                        Select All
                                    </Typography>
                                }
                            />
                        )}

                        {!isDirectory && (
                            <>
                                {/* status chips stay, but no extra checkboxes */}
                                {getRagStatusBadge()}
                                {getGraphStatusBadge()}

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