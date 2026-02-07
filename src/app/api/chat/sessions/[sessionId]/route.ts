import { NextRequest, NextResponse } from 'next/server'

const AGENT_BACKEND_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8787'

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const response = await fetch(`${AGENT_BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to load session' }))
      return NextResponse.json({ detail: error.detail || 'Failed to load session' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error loading chat session:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const body = await request.json()
    
    const response = await fetch(`${AGENT_BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update session' }))
      return NextResponse.json({ detail: error.detail || 'Failed to update session' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating chat session:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params
    const response = await fetch(`${AGENT_BACKEND_URL}/api/chat/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      credentials: 'include',
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete session' }))
      return NextResponse.json({ detail: error.detail || 'Failed to delete session' }, { status: response.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat session:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Network error' },
      { status: 500 }
    )
  }
}
