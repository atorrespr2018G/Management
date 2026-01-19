/**
 * Agent Node Component for XYFlow
 */

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Typography, Chip } from '@mui/material'
import { AutoAwesome as AgentIcon } from '@mui/icons-material'
import type { WorkflowNode } from '@/types/workflow'

interface AgentNodeData extends WorkflowNode {
  label?: string
  agentName?: string
}

export default function AgentNode({ data, selected }: NodeProps<AgentNodeData>) {
  return (
    <Box
      sx={{
        minWidth: 200,
        padding: 2,
        backgroundColor: selected ? 'primary.light' : 'background.paper',
        border: `2px solid ${selected ? 'primary.main' : 'divider'}`,
        borderRadius: 2,
        boxShadow: selected ? 3 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <AgentIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {data.label || data.id}
        </Typography>
        <Chip label="Agent" size="small" color="primary" sx={{ ml: 'auto' }} />
      </Box>
      {data.agentName && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
          {data.agentName}
        </Typography>
      )}
      {data.agent_id && (
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            color: 'text.secondary',
            fontSize: '0.7rem',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {data.agent_id}
        </Typography>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#1976d2',
          width: 12,
          height: 12,
          border: '2px solid white',
          borderRadius: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: '#1976d2',
          width: 12,
          height: 12,
          border: '2px solid white',
          borderRadius: '50%',
        }}
      />
    </Box>
  )
}
