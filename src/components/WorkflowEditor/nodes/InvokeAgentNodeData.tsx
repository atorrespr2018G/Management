'use client'

import React, { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import {
    Typography,
} from '@mui/material'
import SmartToyIcon from '@mui/icons-material/SmartToy'
import WorkflowNode from './WorkflowNode'

export interface InvokeAgentNodeData extends Record<string, unknown> {
    actionId: string
    selectedAgent: string
    inputMessage: string
    autoIncludeResponse: boolean
    outputMessageVar: string
    outputJsonVar: string
    mode?: string
    agentId?: string
}

const InvokeAgentNode = (props: NodeProps) => {
    const agentId = props.data.agentId || props.data.selectedAgent || 'Not configured';
    const displayName = typeof agentId === 'string' ? agentId : 'Not configured';

    return (
        <WorkflowNode
            {...props}
            title="Invoke Agent"
            icon={<SmartToyIcon fontSize="small" />}
            showDeleteButton={props.data.showDeleteButton as boolean}
            onDelete={props.data.onDelete as (() => void) | undefined}
        >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Agent: {displayName}
            </Typography>
        </WorkflowNode>
    );
};

export default memo(InvokeAgentNode)
