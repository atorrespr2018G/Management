'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

// export interface StartNodeData {
//     label?: string
// }

// interface StartNodeProps extends NodeProps<StartNodeData> { }

export interface StartNodeData extends Record<string, unknown> {
    label?: string
}

const StartNode = ({ data }: NodeProps) => {
    return (
        <>
            {/* No target handle – this is the entry point */}
            <Card
                sx={{
                    minWidth: 180,
                    borderRadius: 3,
                    boxShadow: 3,
                    backgroundColor: 'success.main',
                    color: 'common.white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2,
                    py: 1,
                }}
            >
                <CardContent
                    sx={{
                        '&:last-child': { pb: 1 },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 0,
                    }}
                >
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Start
                    </Typography>
                </CardContent>
            </Card>

            {/* Single outgoing connection */}
            <Handle type="source" position={Position.Right} />
        </>
    )
}

export default memo(StartNode)
