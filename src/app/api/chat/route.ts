// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
// import { ChatService } from '@/services/server/chatService'

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8787'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query, conversation_id, user_id } = body

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { detail: 'Query is required and cannot be empty' },
        { status: 400 }
      )
    }

    console.log('Proxying to Agent API:', AGENT_API_URL)

    // // Ensure we have a conversation ID and user ID
    // let currentConversationId = conversation_id;
    // if (!currentConversationId && user_id) {
    //   const newSession = await ChatService.createSession(user_id, query.substring(0, 30) + (query.length > 30 ? '...' : ''));
    //   currentConversationId = newSession.id;
    // }

    // // Persist user message if we have a session
    // if (currentConversationId) {
    //   await ChatService.addMessage(currentConversationId, {
    //     id: Date.now().toString(),
    //     role: 'user',
    //     content: query,
    //     timestamp: new Date().toISOString()
    //   });
    // }

    // console.log('AGENT_API_URL', AGENT_API_URL)
    // Proxy request to Agent API with user_id for session management
    const agentResponse = await fetch(`${AGENT_API_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: query.trim(),
        conversation_id: conversation_id || undefined,
        user_id: user_id || undefined,
      }),
    })

    // console.log('agentResponse', agentResponse)

    if (!agentResponse.ok) {
      const error = await agentResponse.json().catch(() => ({
        detail: 'Agent API error',
      }))
      return NextResponse.json(
        { detail: error.detail || 'Failed to process chat request' },
        { status: agentResponse.status }
      )
    }

    const data = await agentResponse.json()

    // // Persist assistant message
    // if (currentConversationId) {
    //   await ChatService.addMessage(currentConversationId, {
    //     id: (Date.now() + 1).toString(),
    //     role: 'assistant',
    //     content: data.response,
    //     sources: data.sources,
    //     timestamp: new Date().toISOString()
    //   });
    // }

    // // Return the response with the conversation ID (ensuring it's consistent)
    // return NextResponse.json({
    //   ...data,
    //   conversation_id: currentConversationId
    // })

    // Return the response (Agent backend handles all persistence)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
