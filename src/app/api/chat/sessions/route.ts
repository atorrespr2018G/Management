import { NextRequest, NextResponse } from 'next/server';
// import { ChatService } from '@/services/server/chatService';

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8787';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');

    if (!userId) {
        return NextResponse.json({ detail: 'User ID is required' }, { status: 400 });
    }

    try {
        // const sessions = await ChatService.getSessions(userId);
        // Proxy to Agent backend
        const response = await fetch(`${AGENT_API_URL}/api/chat/sessions?user_id=${userId}`);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to fetch sessions' }));
            return NextResponse.json(error, { status: response.status });
        }

        const sessions = await response.json();
        return NextResponse.json(sessions);
    } catch (error) {
        console.error('Failed to fetch sessions:', error);
        return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // const { user_id } = body;
        const { user_id, title } = body;

        if (!user_id) {
            return NextResponse.json({ detail: 'User ID is required' }, { status: 400 });
        }

        // const session = await ChatService.createSession(user_id);
        // Proxy to Agent backend
        const response = await fetch(`${AGENT_API_URL}/api/chat/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, title: title || 'New Chat' })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create session' }));
            return NextResponse.json(error, { status: response.status });
        }

        const session = await response.json();
        return NextResponse.json(session);
    } catch (error) {
        console.error('Failed to create session:', error);
        return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
    }
}
