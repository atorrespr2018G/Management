/**
 * Agent Connection Templates Tests
 * Tests for pre-built workflow templates
 */

import {
  TRIAGE_TO_NEWS_TO_REVIEWER,
  TRIAGE_CONDITIONAL_ROUTING,
  PARALLEL_AGENT_PROCESSING,
  AGENT_CONNECTION_TEMPLATES,
  getTemplateById,
} from '../agentConnectionTemplates'
import type { Agent } from '@/services/agentApi'

// Mock the workflow generator
jest.mock('../agentWorkflowGenerator', () => ({
  generateLinearWorkflow: jest.fn((agents: Agent[]) => ({
    name: `Linear: ${agents.map((a) => a.name).join(' → ')}`,
    nodes: agents.map((a) => ({ id: a.id, type: 'agent', agent_id: a.id })),
    edges: [],
    entry_node_id: agents[0]?.id,
  })),
  generateConditionalWorkflow: jest.fn((source: Agent, routes: any[]) => ({
    name: `Conditional: ${source.name}`,
    nodes: [{ id: source.id, type: 'agent', agent_id: source.id }],
    edges: [],
    entry_node_id: source.id,
  })),
}))

describe('Agent Connection Templates', () => {
  const mockTriageAgent: Agent = {
    id: 'triage_agent_id',
    name: 'Triage Agent',
    description: 'Routes requests',
  }

  const mockNewsAgent: Agent = {
    id: 'news_agent_id',
    name: 'News Agent',
    description: 'Generates news',
  }

  const mockReviewerAgent: Agent = {
    id: 'reviewer_agent_id',
    name: 'Reviewer Agent',
    description: 'Reviews content',
  }

  describe('TRIAGE_TO_NEWS_TO_REVIEWER template', () => {
    it('should generate linear workflow when all agents found', () => {
      const agents = [mockTriageAgent, mockNewsAgent, mockReviewerAgent]
      const workflow = TRIAGE_TO_NEWS_TO_REVIEWER.generate(agents)

      expect(workflow).toBeDefined()
      expect(workflow.nodes.length).toBeGreaterThan(0)
    })

    it('should fallback to first 3 agents if specific ones not found', () => {
      const otherAgents: Agent[] = [
        { id: 'agent1', name: 'Agent 1' },
        { id: 'agent2', name: 'Agent 2' },
        { id: 'agent3', name: 'Agent 3' },
      ]
      const workflow = TRIAGE_TO_NEWS_TO_REVIEWER.generate(otherAgents)

      expect(workflow).toBeDefined()
    })

    it('should have correct template metadata', () => {
      expect(TRIAGE_TO_NEWS_TO_REVIEWER.id).toBe('triage_news_reviewer')
      expect(TRIAGE_TO_NEWS_TO_REVIEWER.name).toContain('Triage')
      expect(TRIAGE_TO_NEWS_TO_REVIEWER.description).toBeDefined()
    })
  })

  describe('TRIAGE_CONDITIONAL_ROUTING template', () => {
    it('should generate conditional workflow when triage agent found', () => {
      const agents = [mockTriageAgent, mockNewsAgent, mockReviewerAgent]
      const workflow = TRIAGE_CONDITIONAL_ROUTING.generate(agents)

      expect(workflow).toBeDefined()
      expect(workflow.entry_node_id).toBeDefined()
    })

    it('should throw error if triage agent not found', () => {
      const agents = [mockNewsAgent, mockReviewerAgent]

      expect(() => TRIAGE_CONDITIONAL_ROUTING.generate(agents)).toThrow('Triage agent not found')
    })

    it('should create routes for available target agents', () => {
      const agents = [mockTriageAgent, mockNewsAgent, mockReviewerAgent]
      const workflow = TRIAGE_CONDITIONAL_ROUTING.generate(agents)

      expect(workflow.nodes.length).toBeGreaterThan(1)
    })
  })

  describe('PARALLEL_AGENT_PROCESSING template', () => {
    it('should generate workflow with at least 2 agents', () => {
      const agents = [mockTriageAgent, mockNewsAgent]
      const workflow = PARALLEL_AGENT_PROCESSING.generate(agents)

      expect(workflow).toBeDefined()
    })

    it('should throw error if less than 2 agents', () => {
      const agents = [mockTriageAgent]

      expect(() => PARALLEL_AGENT_PROCESSING.generate(agents)).toThrow('At least 2 agents are required')
    })
  })

  describe('AGENT_CONNECTION_TEMPLATES', () => {
    it('should contain all templates', () => {
      expect(AGENT_CONNECTION_TEMPLATES.length).toBeGreaterThan(0)
      expect(AGENT_CONNECTION_TEMPLATES).toContain(TRIAGE_TO_NEWS_TO_REVIEWER)
      expect(AGENT_CONNECTION_TEMPLATES).toContain(TRIAGE_CONDITIONAL_ROUTING)
      expect(AGENT_CONNECTION_TEMPLATES).toContain(PARALLEL_AGENT_PROCESSING)
    })

    it('should have unique template IDs', () => {
      const ids = AGENT_CONNECTION_TEMPLATES.map((t) => t.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })
  })

  describe('getTemplateById', () => {
    it('should return template by ID', () => {
      const template = getTemplateById('triage_news_reviewer')
      expect(template).toBe(TRIAGE_TO_NEWS_TO_REVIEWER)
    })

    it('should return undefined for non-existent ID', () => {
      const template = getTemplateById('non_existent')
      expect(template).toBeUndefined()
    })
  })
})
