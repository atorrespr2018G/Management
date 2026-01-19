/**
 * Agent Connection Templates
 * Pre-built templates for common agent connection patterns
 */

import type { WorkflowDefinition } from '@/types/workflow'
import type { Agent } from '@/services/agentApi'
import { generateLinearWorkflow, generateConditionalWorkflow, type ConditionalRoute } from './agentWorkflowGenerator'

export interface AgentConnectionTemplate {
  id: string
  name: string
  description: string
  generate: (agents: Agent[]) => WorkflowDefinition
}

/**
 * Template: Triage → News → Reviewer (Linear)
 */
export const TRIAGE_TO_NEWS_TO_REVIEWER: AgentConnectionTemplate = {
  id: 'triage_news_reviewer',
  name: 'Triage → News → Reviewer',
  description: 'Linear flow: Triage routes to News, then News goes to Reviewer',
  generate: (agents: Agent[]) => {
    // Find agents by name/ID
    const triage = agents.find((a) => a.id.toLowerCase().includes('triage') || a.name.toLowerCase().includes('triage'))
    const news = agents.find((a) => a.id.toLowerCase().includes('news') || a.name.toLowerCase().includes('news') || a.id.toLowerCase().includes('reporter'))
    const reviewer = agents.find((a) => a.id.toLowerCase().includes('review') || a.name.toLowerCase().includes('review'))

    const selectedAgents: Agent[] = []
    if (triage) selectedAgents.push(triage)
    if (news) selectedAgents.push(news)
    if (reviewer) selectedAgents.push(reviewer)

    if (selectedAgents.length < 2) {
      // Fallback: use first 3 agents if specific ones not found
      return generateLinearWorkflow(agents.slice(0, Math.min(3, agents.length)))
    }

    return generateLinearWorkflow(selectedAgents, {
      sourceOutputPath: 'triage',
      targetInputPath: 'goal',
    })
  },
}

/**
 * Template: Triage Conditional Routing
 */
export const TRIAGE_CONDITIONAL_ROUTING: AgentConnectionTemplate = {
  id: 'triage_conditional',
  name: 'Triage Conditional Routing',
  description: 'Triage routes to different agents based on condition',
  generate: (agents: Agent[]) => {
    const triage = agents.find((a) => a.id.toLowerCase().includes('triage') || a.name.toLowerCase().includes('triage'))
    const news = agents.find((a) => a.id.toLowerCase().includes('news') || a.name.toLowerCase().includes('reporter'))
    const reviewer = agents.find((a) => a.id.toLowerCase().includes('review') || a.name.toLowerCase().includes('review'))

    if (!triage) {
      throw new Error('Triage agent not found')
    }

    const routes: ConditionalRoute[] = []
    if (news) {
      routes.push({
        condition: 'triage.preferred_agent == "news"',
        targetAgentId: news.id,
        label: news.name,
      })
    }
    if (reviewer) {
      routes.push({
        condition: 'triage.preferred_agent == "reviewer"',
        targetAgentId: reviewer.id,
        label: reviewer.name,
      })
    }

    // Add fallback route if we have other agents
    const otherAgents = agents.filter((a) => a.id !== triage.id && a.id !== news?.id && a.id !== reviewer?.id)
    if (otherAgents.length > 0 && routes.length < 2) {
      routes.push({
        condition: 'triage.preferred_agent != "news" and triage.preferred_agent != "reviewer"',
        targetAgentId: otherAgents[0].id,
        label: otherAgents[0].name,
      })
    }

    if (routes.length < 2) {
      throw new Error('At least 2 target agents are required for conditional routing')
    }

    return generateConditionalWorkflow(triage, routes)
  },
}

/**
 * Template: Parallel Agent Processing
 */
export const PARALLEL_AGENT_PROCESSING: AgentConnectionTemplate = {
  id: 'parallel_processing',
  name: 'Parallel Agent Processing',
  description: 'Multiple agents process in parallel then merge',
  generate: (agents: Agent[]) => {
    if (agents.length < 2) {
      throw new Error('At least 2 agents are required for parallel processing')
    }

    // Create a simple linear workflow for now
    // Full parallel (fanout/merge) would require more complex logic
    return generateLinearWorkflow(agents)
  },
}

/**
 * All available templates
 */
export const AGENT_CONNECTION_TEMPLATES: AgentConnectionTemplate[] = [
  TRIAGE_TO_NEWS_TO_REVIEWER,
  TRIAGE_CONDITIONAL_ROUTING,
  PARALLEL_AGENT_PROCESSING,
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AgentConnectionTemplate | undefined {
  return AGENT_CONNECTION_TEMPLATES.find((t) => t.id === id)
}
