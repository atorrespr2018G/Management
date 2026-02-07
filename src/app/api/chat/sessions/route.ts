import { NextRequest, NextResponse } from 'next/server'

const AGENT_BACKEND_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8787'

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${AGENT_BACKEND_URL}/api/chat/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch sessions' }))
      return NextResponse.json({ detail: error.detail || 'Failed to fetch sessions' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching chat sessions:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const response = await fetch(`${AGENT_BACKEND_URL}/api/chat/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create session' }))
      return NextResponse.json({ detail: error.detail || 'Failed to create session' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating chat session:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    )
  }
}
