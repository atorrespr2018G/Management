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
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import type { ConnectorPath } from '@/types/neo4j'
import type { FileStructure } from '@/types/neo4j'
import ScanResultsDisplay from '@/components/ScanResultsDisplay'

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

                                    <ScanResultsDisplay
                                        scanResults={{
                                            data: pathResult.data,
                                            totalFiles: pathResult.results.totalFiles,
                                            totalFolders: pathResult.results.totalFolders,
                                            source: pathResult.results.source || 'local',
                                            metadata: { source: pathResult.results.source || 'local' },
                                        }}
                                        sx={(allPathResults?.size < index + 1)
                                            ? { borderRadius: 0 }
                                            : { borderRadius: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }
                                        }
                                        areActionsEnabled={false}
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
