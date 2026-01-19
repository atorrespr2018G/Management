/**
 * Agent Workflow Generator Tests
 * Tests for workflow generation utilities
 */

import {
  generateAgentNode,
  generateConditionalNode,
  createAgentConnection,
  generateLinearWorkflow,
  generateConditionalWorkflow,
  autoLayoutNodes,
  type ConnectionConfig,
  type ConditionalRoute,
} from '../agentWorkflowGenerator'
import type { Agent } from '@/services/agentApi'
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow'

// Mock the autoLayoutWorkflow function
jest.mock('../workflowLayout', () => ({
  autoLayoutWorkflow: (workflow: any) => workflow, // Return workflow as-is for testing
}))

describe('Agent Workflow Generator', () => {
  const mockAgent1: Agent = {
    id: 'triage_agent',
    name: 'Triage Agent',
    description: 'Routes and categorizes requests',
  }

  const mockAgent2: Agent = {
    id: 'news_agent',
    name: 'News Agent',
    description: 'Generates news content',
  }

  const mockAgent3: Agent = {
    id: 'reviewer_agent',
    name: 'Reviewer Agent',
    description: 'Reviews and validates content',
  }

  describe('generateAgentNode', () => {
    it('should generate an agent node with correct structure', () => {
      const node = generateAgentNode(mockAgent1, 'triage', { x: 100, y: 100 })

      expect(node).toEqual({
        id: 'triage',
        type: 'agent',
        agent_id: 'triage_agent',
        inputs: {},
        outputs: {
          result: 'triage',
        },
        params: {
          position: { x: 100, y: 100 },
        },
      })
    })

    it('should generate an agent node without position', () => {
      const node = generateAgentNode(mockAgent1, 'triage')

      expect(node.agent_id).toBe('triage_agent')
      expect(node.params).toEqual({})
    })
  })

  describe('generateConditionalNode', () => {
    it('should generate a conditional node with condition', () => {
      const node = generateConditionalNode('route_1', 'triage.preferred_agent == "news"', { x: 200, y: 200 })

      expect(node).toEqual({
        id: 'route_1',
        type: 'conditional',
        condition: 'triage.preferred_agent == "news"',
        params: {
          position: { x: 200, y: 200 },
        },
      })
    })
  })

  describe('createAgentConnection', () => {
    it('should create an edge between two nodes', () => {
      const edge = createAgentConnection('node1', 'node2')

      expect(edge).toEqual({
        from_node: 'node1',
        to_node: 'node2',
      })
    })

    it('should create an edge with condition', () => {
      const edge = createAgentConnection('node1', 'node2', 'condition == true')

      expect(edge).toEqual({
        from_node: 'node1',
        to_node: 'node2',
        condition: 'condition == true',
      })
    })
  })

  describe('generateLinearWorkflow', () => {
    it('should generate a linear workflow with 2 agents', () => {
      const workflow = generateLinearWorkflow([mockAgent1, mockAgent2])

      expect(workflow.nodes).toHaveLength(2)
      expect(workflow.edges).toHaveLength(1)
      expect(workflow.entry_node_id).toBe('triage_agent')
      expect(workflow.nodes[0].agent_id).toBe('triage_agent')
      expect(workflow.nodes[1].agent_id).toBe('news_agent')
      expect(workflow.edges[0].from_node).toBe('triage_agent')
      expect(workflow.edges[0].to_node).toBe('news_agent')
    })

    it('should generate a linear workflow with 3 agents', () => {
      const workflow = generateLinearWorkflow([mockAgent1, mockAgent2, mockAgent3])

      expect(workflow.nodes).toHaveLength(3)
      expect(workflow.edges).toHaveLength(2)
      expect(workflow.entry_node_id).toBe('triage_agent')
    })

    it('should throw error if less than 2 agents provided', () => {
      expect(() => generateLinearWorkflow([mockAgent1])).toThrow('At least 2 agents are required')
    })

    it('should apply connection config if provided', () => {
      const config: Partial<ConnectionConfig> = {
        sourceOutputPath: 'triage.result',
        targetInputPath: 'news.goal',
        condition: 'some_condition',
      }
      const workflow = generateLinearWorkflow([mockAgent1, mockAgent2], config)

      expect(workflow.nodes[0].outputs?.result).toBe('triage.result')
      expect(workflow.nodes[1].inputs?.goal).toBe('news.goal')
      expect(workflow.edges[0].condition).toBe('some_condition')
    })

    it('should have correct workflow metadata', () => {
      const workflow = generateLinearWorkflow([mockAgent1, mockAgent2])

      expect(workflow.name).toContain('Triage Agent')
      expect(workflow.name).toContain('News Agent')
      expect(workflow.description).toContain('Linear workflow')
      expect(workflow.limits).toBeDefined()
      expect(workflow.limits?.max_steps).toBe(100)
    })
  })

  describe('generateConditionalWorkflow', () => {
    it('should generate a conditional workflow', () => {
      const routes: ConditionalRoute[] = [
        {
          condition: 'triage.preferred_agent == "news"',
          targetAgentId: mockAgent2.id,
          label: mockAgent2.name,
        },
        {
          condition: 'triage.preferred_agent == "reviewer"',
          targetAgentId: mockAgent3.id,
          label: mockAgent3.name,
        },
      ]

      const workflow = generateConditionalWorkflow(mockAgent1, routes)

      expect(workflow.nodes.length).toBeGreaterThanOrEqual(3) // source + conditional + targets
      expect(workflow.edges.length).toBeGreaterThanOrEqual(2)
      expect(workflow.entry_node_id).toBe('triage_agent')

      // Check that conditional node exists
      const conditionalNode = workflow.nodes.find((n) => n.type === 'conditional')
      expect(conditionalNode).toBeDefined()
    })

    it('should throw error if less than 2 routes provided', () => {
      const routes: ConditionalRoute[] = [
        {
          condition: 'condition1',
          targetAgentId: mockAgent2.id,
        },
      ]

      expect(() => generateConditionalWorkflow(mockAgent1, routes)).toThrow(
        'At least 2 conditional routes are required'
      )
    })

    it('should create edges with conditions', () => {
      const routes: ConditionalRoute[] = [
        {
          condition: 'condition1',
          targetAgentId: mockAgent2.id,
        },
        {
          condition: 'condition2',
          targetAgentId: mockAgent3.id,
        },
      ]

      const workflow = generateConditionalWorkflow(mockAgent1, routes)
      const conditionalEdges = workflow.edges.filter((e) => e.condition)

      expect(conditionalEdges.length).toBeGreaterThan(0)
    })
  })

  describe('autoLayoutNodes', () => {
    it('should auto-layout nodes based on edges', () => {
      const nodes: WorkflowNode[] = [
        {
          id: 'node1',
          type: 'agent',
          agent_id: 'agent1',
        },
        {
          id: 'node2',
          type: 'agent',
          agent_id: 'agent2',
        },
      ]

      const edges: WorkflowEdge[] = [
        {
          from_node: 'node1',
          to_node: 'node2',
        },
      ]

      const laidOutNodes = autoLayoutNodes(nodes, edges)

      expect(laidOutNodes).toHaveLength(2)
      // Layout should preserve node structure
      expect(laidOutNodes[0].id).toBe('node1')
      expect(laidOutNodes[1].id).toBe('node2')
    })
  })
})
