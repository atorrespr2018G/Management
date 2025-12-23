'use client'

import { memo, ReactNode } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, Typography, Box } from '@mui/material'

interface WorkflowNodeCustomProps {
    title: string
    icon: ReactNode
    children?: ReactNode
    inputHandle?: boolean
    outputHandle?: boolean
}

const WorkflowNode = ({
    title,
    icon,
    children,
    selected,
    inputHandle = true,
    outputHandle = true
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
                    '&:hover': {
                        boxShadow: 4,
                        borderColor: selected ? 'primary.main' : 'info.dark',
                    },
                }}
            >
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
