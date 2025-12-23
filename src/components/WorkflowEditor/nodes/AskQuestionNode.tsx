'use client'

import { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import WorkflowNode from './WorkflowNode'

export interface AskQuestionNodeData extends Record<string, unknown> {
    actionId: string
    question: string
    variableName: string
}

const AskQuestionNode = (props: NodeProps) => {
    return (
        <WorkflowNode
            {...props}
            title="Ask a Question"
            icon={<QuestionAnswerIcon fontSize="small" />}
        />
    )
}

export default memo(AskQuestionNode)
