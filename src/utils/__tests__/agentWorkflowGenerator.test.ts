/**
 * Tests for agentWorkflowGenerator utility
 */

import {
  generateAgentNode,
  generateConditionalNode,
  createAgentConnection,
  generateLinearWorkflow,
  generateConditionalWorkflow,
} from '../agentWorkflowGenerator'
import type { Agent } from '@/services/agentApi'
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@/types/workflow'

const mockAgent: Agent = {
  id: 'triage',
  name: 'Triage Agent',
  description: 'Triage agent',
}

describe('agentWorkflowGenerator', () => {
  describe('generateAgentNode', () => {
    it('creates an agent node with correct structure', () => {
      const node = generateAgentNode(mockAgent, 'triage_node')

      expect(node.id).toBe('triage_node')
      expect(node.type).toBe('agent')
      expect(node.agent_id).toBe('triage')
      expect(node.inputs).toBeDefined()
      expect(node.outputs).toBeDefined()
    })

    it('uses provided position', () => {
      const position = { x: 100, y: 200 }
      const node = generateAgentNode(mockAgent, 'triage_node', position)

      expect(node.params?.position).toEqual(position)
    })
  })

  describe('generateConditionalNode', () => {
    it('creates a conditional node with condition', () => {
      const node = generateConditionalNode('cond_1', 'result === "success"')

      expect(node.id).toBe('cond_1')
      expect(node.type).toBe('conditional')
      expect(node.condition).toBe('result === "success"')
    })
  })

  describe('createAgentConnection', () => {
    it('creates an edge between two nodes', () => {
      const edge = createAgentConnection('node1', 'node2')

      expect(edge.from_node).toBe('node1')
      expect(edge.to_node).toBe('node2')
    })

    it('includes condition when provided', () => {
      const edge = createAgentConnection('node1', 'node2', 'result === "success"')

      expect(edge.condition).toBe('result === "success"')
    })
  })

  describe('generateLinearWorkflow', () => {
    it('creates a linear workflow from multiple agents', () => {
      const agents: Agent[] = [
        { id: 'triage', name: 'Triage' },
        { id: 'reporter', name: 'Reporter' },
      ]

      const workflow = generateLinearWorkflow(agents)

      expect(workflow.nodes).toHaveLength(2)
      expect(workflow.edges).toHaveLength(1)
      expect(workflow.entry_node_id).toBe('triage')
    })

    it('handles single agent', () => {
      const workflow = generateLinearWorkflow([mockAgent])

      expect(workflow.nodes).toHaveLength(1)
      expect(workflow.edges).toHaveLength(0)
    })
  })

  describe('generateConditionalWorkflow', () => {
    it('creates a conditional workflow with routes', () => {
      const conditions = [
        {
          condition: 'result === "success"',
          targetAgent: { id: 'reporter', name: 'Reporter' },
        },
        {
          condition: 'result === "error"',
          targetAgent: { id: 'reviewer', name: 'Reviewer' },
        },
      ]

      const workflow = generateConditionalWorkflow(mockAgent, conditions)

      expect(workflow.nodes.length).toBeGreaterThan(1)
      expect(workflow.edges.length).toBeGreaterThan(0)
      expect(workflow.entry_node_id).toBe('triage')
    })
  })
})
