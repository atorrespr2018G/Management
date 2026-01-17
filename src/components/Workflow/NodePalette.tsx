/**
 * Node Palette - Draggable node types for workflow builder
 */

import React from 'react'
import { Box, Typography, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import {
  AutoAwesome as AgentIcon,
  CompareArrows as ConditionalIcon,
  CallSplit as FanoutIcon,
  Loop as LoopIcon,
  MergeType as MergeIcon,
} from '@mui/icons-material'
import type { NodeType } from '@/types/workflow'

interface NodeTypeOption {
  type: NodeType
  label: string
  icon: React.ReactNode
  description: string
}

const nodeTypes: NodeTypeOption[] = [
  {
    type: 'agent',
    label: 'Agent',
    icon: <AgentIcon />,
    description: 'Execute an AI agent',
  },
  {
    type: 'conditional',
    label: 'Conditional',
    icon: <ConditionalIcon />,
    description: 'Route based on condition',
  },
  {
    type: 'fanout',
    label: 'Fanout',
    icon: <FanoutIcon />,
    description: 'Create parallel branches',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <LoopIcon />,
    description: 'Iterative execution',
  },
  {
    type: 'merge',
    label: 'Merge',
    icon: <MergeIcon />,
    description: 'Join parallel branches',
  },
]

interface NodePaletteProps {
  onNodeTypeSelect: (type: NodeType) => void
}

export default function NodePalette({ onNodeTypeSelect }: NodePaletteProps) {
  return (
    <Paper sx={{ p: 2, height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Node Types
      </Typography>
      <List>
        {nodeTypes.map((nodeType) => (
          <ListItem key={nodeType.type} disablePadding>
            <ListItemButton onClick={() => onNodeTypeSelect(nodeType.type)}>
              <ListItemIcon sx={{ color: 'primary.main' }}>{nodeType.icon}</ListItemIcon>
              <ListItemText
                primary={nodeType.label}
                secondary={nodeType.description}
                primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                secondaryTypographyProps={{ fontSize: '0.75rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  )
}
