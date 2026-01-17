/**
 * Fanout Node Component for XYFlow
 */

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Typography, Chip } from '@mui/material'
import { CallSplit as FanoutIcon } from '@mui/icons-material'
import type { WorkflowNode } from '@/types/workflow'

interface FanoutNodeData extends WorkflowNode {
  label?: string
}

export default function FanoutNode({ data, selected }: NodeProps<FanoutNodeData>) {
  const branchCount = data.branches?.length || 0

  return (
    <Box
      sx={{
        minWidth: 180,
        padding: 2,
        backgroundColor: selected ? 'info.light' : 'background.paper',
        border: `2px solid ${selected ? 'info.main' : 'divider'}`,
        borderRadius: 2,
        boxShadow: selected ? 3 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <FanoutIcon sx={{ fontSize: 20, color: 'info.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {data.label || data.id}
        </Typography>
        <Chip label="Fanout" size="small" color="info" sx={{ ml: 'auto' }} />
      </Box>
      {branchCount > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {branchCount} branch{branchCount !== 1 ? 'es' : ''}
        </Typography>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </Box>
  )
}
