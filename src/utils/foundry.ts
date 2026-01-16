/**
 * Utility to invoke AI Foundry tools via the backend API.
 * This abstracts the API calls into a tool invocation pattern.
 */

/**
 * Invokes a tool by name with the given arguments.
 * 
 * @param toolName The name of the tool to invoke (e.g., 'list-agents')
 * @param args The arguments to pass to the tool
 * @returns The result of the tool invocation
 */
// Use direct backend URL for long-running agent requests (bypasses Next.js 30-60s proxy timeout)
const AGENT_BACKEND_URL = process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:8787';

export const invokeTool = async (toolName: string, args: Record<string, any> = {}) => {
    // Map 'list-agents' to the existing endpoint
    if (toolName === 'list-agents') {
        const response = await fetch(`${AGENT_BACKEND_URL}/api/workflows/agent/list`, {
            credentials: 'include'
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to invoke tool list-agents');
        }
        return await response.json();
    }

    // Map 'create-agent' to the POST endpoint
    if (toolName === 'create-agent') {
        const response = await fetch(`${AGENT_BACKEND_URL}/api/workflows/agent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(args),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Failed to invoke tool create-agent');
        }
        return await response.json();
    }

    // Handle other tools or generic invocation if needed
    throw new Error(`Tool ${toolName} not implemented`);
};
