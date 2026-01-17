/**
 * Merge Node Component for XYFlow
 */

import React from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Box, Typography, Chip } from '@mui/material'
import { MergeType as MergeIcon } from '@mui/icons-material'
import type { WorkflowNode } from '@/types/workflow'

interface MergeNodeData extends WorkflowNode {
  label?: string
}

export default function MergeNode({ data, selected }: NodeProps<MergeNodeData>) {
  return (
    <Box
      sx={{
        minWidth: 180,
        padding: 2,
        backgroundColor: selected ? 'success.light' : 'background.paper',
        border: `2px solid ${selected ? 'success.main' : 'divider'}`,
        borderRadius: 2,
        boxShadow: selected ? 3 : 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <MergeIcon sx={{ fontSize: 20, color: 'success.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {data.label || data.id}
        </Typography>
        <Chip label="Merge" size="small" color="success" sx={{ ml: 'auto' }} />
      </Box>
      {data.params?.expected_keys && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Waiting for {Array.isArray(data.params.expected_keys) ? data.params.expected_keys.length : 1} branch{Array.isArray(data.params.expected_keys) && data.params.expected_keys.length !== 1 ? 'es' : ''}
        </Typography>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="target" position={Position.Right} />
      <Handle type="source" position={Position.Bottom} />
    </Box>
  )
}
