import { ChatResponse } from "@/types/chat"

// Use direct backend URL for long-running chat requests (bypasses Next.js 30-60s proxy timeout)
const AGENT_BACKEND_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8787'

export async function sendMessage(
  query: string,
  sessionId: string
): Promise<ChatResponse> {
  try {
    // Call Agent backend directly - run_sequential_goal can take several minutes
    const response = await fetch(`${AGENT_BACKEND_URL}/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ content: query }),
    })

    console.log('Response status:', response.status, response.statusText)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Parsed response data:', data)
    return data
  } catch (error) {
    console.error('sendMessage error:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to send message')
  }
}

export async function updateSessionTitle(
  sessionId: string,
  title: string
): Promise<void> {
  try {
    const response = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ title }),
    })

    if (!response.ok) {
      throw new Error('Failed to update session title')
    }
  } catch (error) {
    console.error('Failed to update session title:', error)
    // Don't throw, just log error as this is a non-critical operation
  }
}

