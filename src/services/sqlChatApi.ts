// SQL Chat API service for text-to-SQL generation

export interface SQLGenerationRequest {
  query: string
  database_id: string
  top_k?: number
  similarity_threshold?: number
}

export interface SQLGenerationResponse {
  sql: string | null
  schema_slice?: {
    tables?: Array<{
      name: string
      description?: string
      domain?: string
      columns?: Array<{
        name: string
        data_type: string
        description?: string
        is_primary_key?: boolean
        nullable?: boolean
      }>
    }>
  }
  explanation?: string
  confidence?: number
  query?: string
  error?: string
}

export async function generateSQL(
  query: string,
  databaseId: string,
  topK: number = 10,
  similarityThreshold: number = 0.7
): Promise<SQLGenerationResponse> {
  try {
    const response = await fetch('/api/sql/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        database_id: databaseId,
        top_k: topK,
        similarity_threshold: similarityThreshold,
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
    throw new Error('Failed to generate SQL')
  }
}

