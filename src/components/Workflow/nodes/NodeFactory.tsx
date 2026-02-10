/**
 * Node Factory - Creates appropriate node component based on type
 */

import React from 'react'
import { NodeTypes } from 'reactflow'
import AgentNode from './AgentNode'
import ConditionalNode from './ConditionalNode'
import FanoutNode from './FanoutNode'
import LoopNode from './LoopNode'
import LoopBodyNode from './LoopBodyNode'
import ExitLoopNode from './ExitLoopNode'
import MergeNode from './MergeNode'
import type { NodeType } from '@/types/workflow'

export const nodeTypes: NodeTypes = {
  agent: AgentNode,
  conditional: ConditionalNode,
  fanout: FanoutNode,
  loop: LoopNode,
  loop_body: LoopBodyNode,
  loop_exit: ExitLoopNode,
  merge: MergeNode,
}

export function getNodeComponent(type: NodeType) {
  return nodeTypes[type] || AgentNode
}
