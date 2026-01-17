'use client'

import { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import WorkflowNode from './WorkflowNode'

export interface SendMessageNodeData extends Record<string, unknown> {
    actionId: string
    message: string
    variableName: string
}

const SendMessageNode = (props: NodeProps) => {
    return (
        <WorkflowNode
            {...props}
            title="Send Message"
            icon={<QuestionAnswerIcon fontSize="small" />}
            showDeleteButton={props.data.showDeleteButton as boolean}
            onDelete={props.data.onDelete as (() => void) | undefined}
        />
    )
}

export default memo(SendMessageNode)
