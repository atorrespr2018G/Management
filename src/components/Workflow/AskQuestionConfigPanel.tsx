import React from 'react'
import {
    Typography,
    TextField,
    Box,
    Divider,
} from '@mui/material'
import { AskQuestionNodeData } from './AskQuestionNode'

interface AskQuestionConfigPanelProps {
    data: AskQuestionNodeData
    onUpdate: (data: AskQuestionNodeData) => void
}

const AskQuestionConfigPanel = ({ data, onUpdate }: AskQuestionConfigPanelProps) => {
    const handleChange = (field: keyof AskQuestionNodeData, value: any) => {
        const newData = { ...data, [field]: value }
        onUpdate(newData)
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Ask a Question Configuration
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
                    value={data.actionId}
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

            {/* Question */}
            <TextField
                fullWidth
                multiline
                rows={3}
                label="Question to ask user"
                placeholder="What would you like to know?"
                value={data.question || ''}
                onChange={(e) => handleChange('question', e.target.value)}
                sx={{ mb: 2 }}
            />

            {/* Variable Name */}
            <TextField
                fullWidth
                size="small"
                label="Save response as variable"
                placeholder="e.g., userResponse"
                value={data.variableName || ''}
                onChange={(e) => handleChange('variableName', e.target.value)}
                helperText="The user's input will be stored in this variable"
            />
        </Box>
    )
}

export default AskQuestionConfigPanel
