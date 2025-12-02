/**
 * Pure presentational component for rendering a single tree node.
 * No Redux dependencies - all state passed via props.
 */

import React from 'react';
import { Box, Stack, Typography, Checkbox, FormControlLabel } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import type { FileStructure } from '@/types/neo4j';
import { formatBytes, truncateFileName } from '@/utils/formatters';
import { RagStatusBadge, GraphStatusBadge } from './StatusBadges';

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
                                <RagStatusBadge status={ragStatus} />
                                <GraphStatusBadge
                                    isSelected={isSelectedForGraph}
                                    hasRelationships={hasRelationships}
                                    canSelect={canSelectForGraph}
                                    showBadge={showGraphBadge && ragStatus !== 'none'}
                                    onToggle={onToggleGraphSelection ? () => onToggleGraphSelection() : undefined}
                                />

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
