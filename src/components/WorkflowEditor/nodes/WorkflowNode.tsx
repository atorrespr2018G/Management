'use client'

import { memo, ReactNode } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, Typography, Box, IconButton } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

interface WorkflowNodeCustomProps {
    title: string
    icon: ReactNode
    children?: ReactNode
    inputHandle?: boolean
    outputHandle?: boolean
    showDeleteButton?: boolean
    onDelete?: () => void
}

const WorkflowNode = ({
    title,
    icon,
    children,
    selected,
    inputHandle = true,
    outputHandle = true,
    showDeleteButton = false,
    onDelete
}: NodeProps & WorkflowNodeCustomProps) => {
    return (
        <>
            {inputHandle && <Handle type="target" position={Position.Left} />}

            <Card
                sx={{
                    minWidth: 220,
                    maxWidth: 300,
                    borderRadius: 2,
                    boxShadow: selected ? 4 : 2,
                    border: '2px solid',
                    borderColor: selected ? 'primary.main' : 'info.main',
                    bgcolor: 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    position: 'relative',
                    '&:hover': {
                        boxShadow: 4,
                        borderColor: selected ? 'primary.main' : 'info.dark',
                    },
                }}
            >
                {/* Delete Button */}
                {showDeleteButton && onDelete && (
                    <IconButton
                        size="small"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                        sx={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': {
                                bgcolor: 'error.dark',
                            },
                            width: 24,
                            height: 24,
                        }}
                    >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                )}

                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: children ? 1 : 0 }}>
                        <Box
                            sx={{
                                width: 32,
                                height: 32,
                                borderRadius: 1,
                                bgcolor: 'info.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {icon}
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {title}
                        </Typography>
                    </Box>

                    {/* Content */}
                    {children && (
                        <Box>
                            {children}
                        </Box>
                    )}
                </CardContent>
            </Card>

            {outputHandle && <Handle type="source" position={Position.Right} />}
        </>
    )
}

export default memo(WorkflowNode)
