'use client'

import React, { memo, useEffect, useState } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
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

export interface InvokeAgentNodeData extends Record<string, unknown> {
    actionId: string
    selectedAgent: string
    inputMessage: string
    autoIncludeResponse: boolean
    outputMessageVar: string
    outputJsonVar: string
}

interface Agent {
    id: string
    name: string
    model: string
    description?: string
}

const CREATE_NEW_AGENT_VALUE = '__CREATE_NEW__'

const InvokeAgentNode = ({ data, id }: NodeProps) => {
    // Visual-only component, configuration is handled in InvokeAgentConfigPanel

    return (
        <>
            <Handle type="target" position={Position.Top} />
            <Card
                sx={
                    {
                        minWidth: 350,
                        maxWidth: 400,
                        border: '2px solid',
                        borderColor: data.selected ? 'primary.main' : 'transparent',
                        boxShadow: 3,
                        cursor: 'pointer'
                    }
                }
            >
                <CardContent>
                    {/* Header */}
                    < Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }
                    }>
                        Invoke Agent
                    </Typography>
                    {/* <Typography variant="body2" color="text.secondary">
                        {data?.actionId as string}
                    </Typography> */}
                </CardContent>
            </Card>
            < Handle type="source" position={Position.Bottom} />
        </>
    )
}

export default memo(InvokeAgentNode)
