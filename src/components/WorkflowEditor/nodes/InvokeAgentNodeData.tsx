'use client'

import React, { memo } from 'react'
import { NodeProps } from '@xyflow/react'
import {
    Card,
    CardContent,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Switch,
    FormControlLabel,
    Box,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    Alert,
} from '@mui/material'
import { inputVariableOptions } from '@/constants/agents'
import CodeIcon from '@mui/icons-material/Code'
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

interface Agent {
    id: string
    name: string
    model: string
    description?: string
}

const CREATE_NEW_AGENT_VALUE = '__CREATE_NEW__'

// const InvokeAgentNode = ({ data, selected, id }: NodeProps) => {
const InvokeAgentNode = (props: NodeProps) => {
    // const { selected } = props

    return (
        <WorkflowNode
            {...props}
            // id={id}
            // data={data}
            title="Invoke Agent"
            icon={<CodeIcon fontSize="small" />}
        // selected={selected}
        />
    )
}

export default memo(InvokeAgentNode)
