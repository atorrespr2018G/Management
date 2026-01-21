/**
 * Conditional Node Component for XYFlow
 */

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Typography, Chip } from '@mui/material'
import { CompareArrows as ConditionalIcon } from '@mui/icons-material'
import type { WorkflowNode } from '@/types/workflow'

interface ConditionalNodeData extends WorkflowNode {
  label?: string
}

export default function ConditionalNode({ data, selected }: NodeProps<ConditionalNodeData>) {
  return (
    <Box
      sx={{
        minWidth: 180,
        padding: 2,
        backgroundColor: selected ? 'warning.light' : 'background.paper',
        border: `2px solid ${selected ? 'warning.main' : 'divider'}`,
        borderRadius: 2,
        boxShadow: selected ? 3 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <ConditionalIcon sx={{ fontSize: 20, color: 'warning.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {data.label || data.id}
        </Typography>
        <Chip label="Conditional" size="small" color="warning" sx={{ ml: 'auto' }} />
      </Box>
      {data.condition && (
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            fontSize: '0.75rem',
            display: 'block',
            fontFamily: 'monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 160,
          }}
          title={data.condition}
        >
          {data.condition.length > 30 ? `${data.condition.substring(0, 30)}...` : data.condition}
        </Typography>
      )}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#ed6c02',
          width: 12,
          height: 12,
          border: '2px solid white',
          borderRadius: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{
          left: '30%',
          background: '#ed6c02',
          width: 12,
          height: 12,
          border: '2px solid white',
          borderRadius: '50%',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{
          left: '70%',
          background: '#ed6c02',
          width: 12,
          height: 12,
          border: '2px solid white',
          borderRadius: '50%',
        }}
      />
    </Box>
  )
}
