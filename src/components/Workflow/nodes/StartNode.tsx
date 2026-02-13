/**
 * Start Node Component for XYFlow
 * Serves as the single entry point for workflow execution
 */

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Typography, Chip } from '@mui/material'
import { PlayArrow as StartIcon } from '@mui/icons-material'
import type { WorkflowNode } from '@/types/workflow'

interface StartNodeData extends WorkflowNode {
    label?: string
}

export default function StartNode({ data, selected }: NodeProps<StartNodeData>) {
    return (
        <Box
            sx={{
                minWidth: 200,
                padding: 2,
                backgroundColor: selected ? 'success.light' : 'background.paper',
                border: `2px solid ${selected ? 'success.main' : 'divider'}`,
                borderRadius: 2,
                boxShadow: selected ? 3 : 1,
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <StartIcon sx={{ fontSize: 20, color: 'success.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Start
                </Typography>
                <Chip label="Entry" size="small" color="success" sx={{ ml: 'auto' }} />
            </Box>

            {/* Only Source handle - outgoing flow */}
            <Handle
                type="source"
                position={Position.Bottom}
                style={{
                    background: '#2e7d32', // success.main
                    width: 12,
                    height: 12,
                    border: '2px solid white',
                    borderRadius: '50%',
                }}
            />
        </Box>
    )
}
