/**
 * Pure presentational component for rendering a single tree node.
 * No Redux dependencies - all state passed via props.
 */

import React from 'react';
import { Box, Stack, Typography, Checkbox, FormControlLabel, Chip } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import type { FileStructure } from '@/types/neo4j';
import { formatBytes, truncateFileName } from '@/utils/formatters';

export interface TreeNodeProps {
    node: FileStructure;
    level?: number;

    // Selection state
    isSelected?: boolean;
    onToggleSelection?: () => void;

    // Status badges
    ragStatus?: 'complete' | 'partial' | 'none';
    hasRelationships?: boolean;

    // Graph selection
    isSelectedForGraph?: boolean;
    canSelectForGraph?: boolean;
    onToggleGraphSelection?: () => void;

    // UI configuration
    showSelection?: boolean;
    showGraphBadge?: boolean;
    maxNameLength?: number;

    // Children
    children?: React.ReactNode;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
    node,
    level = 0,
    isSelected = false,
    onToggleSelection,
    ragStatus = 'none',
    hasRelationships = false,
    isSelectedForGraph = false,
    canSelectForGraph = true,
    onToggleGraphSelection,
    showSelection = false,
    showGraphBadge = false,
    maxNameLength = 68,
    children,
}) => {
    const isDirectory = node.type === 'directory';
    const Icon = isDirectory ? FolderOpenIcon : InsertDriveFileIcon;
    const bytes = node.size;

    // RAG status badge
    const getRagStatusBadge = () => {
        if (ragStatus === 'complete') {
            return <Chip label="Semantic" size="small" color="success" sx={{ ml: 1 }} />;
        } else if (ragStatus === 'partial') {
            return <Chip label="Semantic Partial" size="small" color="warning" />;
        }
        return null;
    };

    // Graph status badge
    const getGraphStatusBadge = () => {
        if (!showGraphBadge || ragStatus === 'none') return null;

        const chipProps = {
            label: 'Graph' as const,
            size: 'small' as const,
            icon: isSelectedForGraph ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : undefined,
            onClick: canSelectForGraph && onToggleGraphSelection
                ? (e: React.MouseEvent) => {
                    e.stopPropagation();
                    onToggleGraphSelection();
                }
                : undefined,
            sx: {
                cursor: canSelectForGraph ? 'pointer' : 'default',
                ...(isSelectedForGraph && {
                    border: '2px solid',
                    borderColor: 'primary.main',
                    backgroundColor: 'action.selected',
                    fontWeight: 'bold',
                    '&:hover': { backgroundColor: 'action.hover' },
                }),
                ...(hasRelationships && { opacity: 0.9 }),
                ...(canSelectForGraph && {
                    '&:hover': { opacity: 0.8, transform: 'scale(1.05)' },
                    transition: 'all 0.2s ease-in-out',
                }),
                ...(!canSelectForGraph && {
                    '&:hover': { cursor: 'not-allowed' },
                }),
            },
        };

        return hasRelationships
            ? <Chip {...chipProps} color="info" />
            : <Chip {...chipProps} variant="outlined" />;
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
                    <Typography variant="body2" fontWeight={500} lineHeight="1.2">
                        {truncateFileName(node, maxNameLength)}
                    </Typography>
                    {typeof bytes === 'number' && (
                        <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                            ({formatBytes(bytes)})
                        </Typography>
                    )}
                </Stack>

                {/* Right side: badges and selection */}
                {showSelection && (
                    <Stack direction="row" spacing={1} alignItems="center">
                        {isDirectory && level === 0 && onToggleSelection && (
                            <FormControlLabel
                                sx={{ m: 0 }}
                                control={
                                    <Checkbox
                                        size="small"
                                        checked={isSelected}
                                        onChange={onToggleSelection}
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
                                {getRagStatusBadge()}
                                {getGraphStatusBadge()}

                                {onToggleSelection && (
                                    <FormControlLabel
                                        sx={{ m: 0 }}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={isSelected}
                                                color={ragStatus !== 'none' ? 'error' : 'info'}
                                                onChange={onToggleSelection}
                                            />
                                        }
                                        label={''}
                                    />
                                )}
                            </>
                        )}
                    </Stack>
                )}
            </Stack>

            {/* Children */}
            {children && (
                <Box
                    sx={{
                        borderLeft: 1,
                        borderColor: 'divider',
                        ml: 2,
                        pl: 1,
                        mt: 0.5,
                    }}
                >
                    {children}
                </Box>
            )}
        </Box>
    );
};
