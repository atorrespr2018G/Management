/**
 * Exit Loop Node - UI-only helper card for loop cluster
 */

import React from 'react'
import { Handle, Position } from 'reactflow'
import { Box } from '@mui/material'

export default function ExitLoopNode({ data }: any) {
    return (
        <>
            <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
            <Box
                sx={{
                    background: '#fff3e0',
                    border: '2px dashed #f57c00',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    minWidth: '140px',
                    textAlign: 'center',
                }}
            >
                <Box sx={{ fontWeight: 600, fontSize: '14px', color: '#f57c00' }}>
                    Exit Loop
                </Box>
            </Box>
            <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
        </>
    )
}
