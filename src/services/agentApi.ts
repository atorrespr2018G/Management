/**
 * Agent API Service
 * Fetches available agents for workflow configuration and manages Foundry agents
 */

export interface Agent {
  id: string
  name: string
  model?: string
  description?: string
  instructions?: string
  tools?: string[]
}

export interface CreateAgentRequest {
  name: string
  model: string
  instructions: string
  description?: string
  tools?: string[]
}

export interface UpdateAgentRequest {
  name?: string
  model?: string
  instructions?: string
  description?: string
  tools?: string[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

/**
 * Get list of available agents from Foundry API only (no fallback).
 * Used for dropdowns and workflow builder.
 */
export async function getAgents(): Promise<Agent[]> {
  return getAllAgents()
}

/**
 * Get all agents from Foundry API (/api/agents/all).
 */
export async function getAllAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE_URL}/api/foundry/agents`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as { detail?: string; message?: string }
    const msg = err.detail ?? err.message ?? response.statusText
    throw new Error(msg || `Failed to fetch agents: ${response.status}`)
  }
  const data = await response.json()
  return Array.isArray(data) ? data : []
}

/**
 * Get details of a specific agent
 */
export async function getAgent(agentId: string): Promise<Agent> {
  const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to get agent: ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Create a new agent in Foundry
 */
export async function createAgent(agent: CreateAgentRequest): Promise<Agent> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(agent),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: response.statusText }))
      const errorMessage = errorData.detail || errorData.message || `Failed to create agent: ${response.statusText}`
      
      // Check for network errors
      if (response.status === 0 || response.status === 500) {
        throw new Error(`Cannot connect to API server. Please ensure the Agent API server is running on ${API_BASE_URL}`)
      }
      
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error: any) {
    if (error.message && error.message.includes('Cannot connect')) {
      throw error
    }
    throw new Error(error.message || 'Failed to create agent')
  }
}

/**
 * Update an existing agent
 */
export async function updateAgent(agentId: string, agent: UpdateAgentRequest): Promise<Agent> {
  const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(agent),
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to update agent: ${response.statusText}`)
  }
  return await response.json()
}

/**
 * Delete an agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || `Failed to delete agent: ${response.statusText}`)
  }
}
