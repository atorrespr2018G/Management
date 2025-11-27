import { ChatResponse } from "@/types/chat"

export async function sendMessage(
  query: string,
  conversationId?: string,
  userId?: string
): Promise<ChatResponse> {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        conversation_id: conversationId,
        user_id: userId,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(error.detail || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to send message')
  }
}

export async function updateSessionTitle(
  sessionId: string,
  title: string,
  userId: string
): Promise<void> {
  try {
    const response = await fetch(`/api/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, user_id: userId }),
    })

    if (!response.ok) {
      throw new Error('Failed to update session title')
    }
  } catch (error) {
    console.error('Failed to update session title:', error)
    // Don't throw, just log error as this is a non-critical operation
  }
}


