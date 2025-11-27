import { NextRequest, NextResponse } from 'next/server';

const AGENT_API_URL = process.env.AGENT_API_URL || 'http://localhost:8787';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('user_id');
    const sessionId = params.id;

    if (!userId) {
        return NextResponse.json({ detail: 'User ID is required' }, { status: 400 });
    }

    try {
        // Proxy to Agent backend
        const response = await fetch(`${AGENT_API_URL}/api/sessions/${sessionId}?user_id=${userId}`);

        // if (!session) {
        if (!response.ok) {
            // if (session.userId !== userId) {
            //     return NextResponse.json({ detail: 'Unauthorized' }, { status: 403 });
            if (response.status === 404) {
                return NextResponse.json({ detail: 'Session not found' }, { status: 404 });
            }
            const error = await response.json().catch(() => ({ detail: 'Failed to fetch session' }));
            return NextResponse.json(error, { status: response.status });
        }

        const session = await response.json();
        return NextResponse.json(session);
    } catch (error) {
        console.error('Failed to fetch session:', error);
        return NextResponse.json({ detail: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id
        const body = await request.json()
        const { title, user_id } = body

        const response = await fetch(`${AGENT_API_URL}/api/sessions/${id}?user_id=${user_id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        })

        if (!response.ok) {
            return NextResponse.json(
                { detail: 'Failed to update session' },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        console.error('Session update error:', error)
        return NextResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
        )
    }
}
