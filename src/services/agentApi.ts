/**
 * Agent API Service
 * Fetches available agents for workflow configuration
 */

export interface Agent {
  id: string
  name: string
  model?: string
  description?: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

/**
 * Get list of available agents
 */
export async function getAgents(): Promise<Agent[]> {
  // Try to fetch from agents endpoint
  // If that doesn't exist, return mock data for now
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      return Array.isArray(data) ? data : data.agents || []
    }
  } catch (error) {
    console.warn('Failed to fetch agents from API, using fallback', error)
  }

  // Fallback: return empty array or mock data
  // In production, this should be handled by the backend
  return []
}
