'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { IconButton, Box } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'

const AddActionNode = ({ data }: NodeProps) => {
    return (
        <Box
            sx={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ opacity: 0 }} // Invisible handle
            />

            <IconButton
                sx={{
                    width: 32,
                    height: 32,
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: 'background.paper',
                    '&:hover': {
                        backgroundColor: 'action.hover',
                    },
                }}
            >
                <AddIcon fontSize="small" />
            </IconButton>

            {/* Use opacity 0 logic if we want to chain more adds, or just valid handles for edges */}
            <Handle
                type="source"
                position={Position.Right}
                style={{ opacity: 0 }}
            />
        </Box>
    )
}

export default memo(AddActionNode)
