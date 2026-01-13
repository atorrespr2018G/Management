import React from 'react'
import { TextField } from '@mui/material'
import { SendMessageNodeData } from '../nodes/SendMessageNode'
import WorkflowConfigPanel from './WorkflowConfigPanel'

interface SendMessageConfigPanelProps {
    data: SendMessageNodeData
    onUpdate: (data: SendMessageNodeData) => void
}

const SendMessageConfigPanel = ({ data, onUpdate }: SendMessageConfigPanelProps) => {
    const handleChange = (field: keyof SendMessageNodeData, value: any) => {
        const newData = { ...data, [field]: value }
        onUpdate(newData)
    }

    return (
        <WorkflowConfigPanel title="Send Message Configuration" actionId={data.actionId}>

            {/* Question */}
            <TextField
                fullWidth
                multiline
                rows={3}
                label="Send message to user"
                placeholder="Enter message to send to user"
                value={data.message || ''}
                onChange={(e) => handleChange('message', e.target.value)}
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

export default SendMessageConfigPanel
