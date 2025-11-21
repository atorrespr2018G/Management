import { NextRequest, NextResponse } from 'next/server'

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8787'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, database_id, top_k, similarity_threshold } = body

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { detail: 'Query is required and cannot be empty' },
        { status: 400 }
      )
    }

    if (!database_id || typeof database_id !== 'string') {
      return NextResponse.json(
        { detail: 'database_id is required' },
        { status: 400 }
      )
    }

    // Proxy request to Agent API
    const agentResponse = await fetch(`${AGENT_API_URL}/api/sql/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        database_id: database_id,
        top_k: top_k || 10,
        similarity_threshold: similarity_threshold || 0.7,
      }),
    })

    if (!agentResponse.ok) {
      const error = await agentResponse.json().catch(() => ({
        detail: 'Agent API error',
      }))
      return NextResponse.json(
        { detail: error.detail || 'Failed to process SQL generation request' },
        { status: agentResponse.status }
      )
    }

    const data = await agentResponse.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('SQL Generation API error:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

