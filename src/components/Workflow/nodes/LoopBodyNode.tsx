/**
 * Loop Body Node - UI-only helper card for loop cluster
 * Displays max iterations from parent loop node
 */

import React from 'react'
import { Handle, Position } from 'reactflow'
import { Box } from '@mui/material'

export default function LoopBodyNode({ data }: any) {
    // Find parent loop node to get max iterations
    const maxIters = data.max_iters || 0

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Box
                sx={{
                    background: '#e3f2fd',
                    border: '2px dashed #1976d2',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    minWidth: '140px',
                    textAlign: 'center',
                }}
            >
                <Box sx={{ fontWeight: 600, fontSize: '14px', color: '#1976d2', mb: 0.5 }}>
                    Loop Body
                </Box>
                <Box sx={{ fontSize: '12px', color: '#666' }}>
                    Max: {maxIters} iterations
                </Box>
            </Box>
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </>
    )
}
