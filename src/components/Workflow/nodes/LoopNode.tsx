/**
 * Loop Node Component for XYFlow
 */

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Typography, Chip } from '@mui/material'
import { Loop as LoopIcon } from '@mui/icons-material'
import type { WorkflowNode } from '@/types/workflow'

interface LoopNodeData extends WorkflowNode {
  label?: string
}

export default function LoopNode({ data, selected }: NodeProps<LoopNodeData>) {
  return (
    <Box
      sx={{
        minWidth: 180,
        padding: 2,
        backgroundColor: selected ? 'secondary.light' : 'background.paper',
        border: `2px solid ${selected ? 'secondary.main' : 'divider'}`,
        borderRadius: 2,
        boxShadow: selected ? 3 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LoopIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {/* {data.label || data.id} */}
        </Typography>
        <Chip label="Loop" size="small" color="secondary" />
      </Box>
      {/* {data.max_iters && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Max: {data.max_iters} iterations
        </Typography>
      )} */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} id="continue" style={{ left: '30%' }} />
      <Handle type="source" position={Position.Bottom} id="exit" style={{ left: '70%' }} />
      <Handle type="target" position={Position.Left} id="loop-back" />
    </Box>
  )
}
