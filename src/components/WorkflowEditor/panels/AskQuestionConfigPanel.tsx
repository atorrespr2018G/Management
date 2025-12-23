import React from 'react'
import {
    TextField,
} from '@mui/material'
import { AskQuestionNodeData } from '../nodes/AskQuestionNode'
import WorkflowConfigPanel from './WorkflowConfigPanel'

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
        <WorkflowConfigPanel title="Ask a Question Configuration" actionId={data.actionId}>

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
        </WorkflowConfigPanel>
    )
}

export default AskQuestionConfigPanel
