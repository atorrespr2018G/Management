export interface Source {
  file_name?: string | null
  file_path?: string | null
  directory_name?: string | null
  text?: string | null
  similarity?: number | null
  hybrid_score?: number | null
  metadata?: {
    vector_score?: number
    keyword_score?: number
    path_score?: number
    hop_count?: number
    hop_penalty?: number
    chunk_index?: number
    file_id?: string
    chunk_size?: number
  } | null
}

export interface ChatRequest {
  query: string
  conversation_id?: string
}

export interface ChatResponse {
  response: string
  sources: Source[]
  conversation_id: string
}

export async function sendMessage(
  query: string,
  conversationId?: string
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


