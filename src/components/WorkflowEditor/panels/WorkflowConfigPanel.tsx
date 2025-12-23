import React, { ReactNode } from 'react'
import {
    Box,
    Typography,
    Divider,
    TextField,
} from '@mui/material'

interface WorkflowConfigPanelProps {
    title: string
    actionId: string
    children: ReactNode
}

const WorkflowConfigPanel = ({ title, actionId, children }: WorkflowConfigPanelProps) => {
    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                {title}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {/* Action ID - Read-only */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
                    Action ID
                </Typography>
                <TextField
                    fullWidth
                    size="small"
                    value={actionId}
                    disabled
                    sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                            WebkitTextFillColor: 'text.secondary',
                        },
                    }}
                />
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                    (auto-generated)
                </Typography>
            </Box>

            {/* Content */}
            {children}
        </Box>
    )
}

export default WorkflowConfigPanel
