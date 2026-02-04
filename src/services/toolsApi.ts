/**
 * Tools API Service
 * Registry + agent-tool relations. No hardcoding.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

export interface Tool {
  id: string
  name: string
  description?: string
  type: string
  spec?: Record<string, unknown>
  source?: string
}

export interface CreateToolRequest {
  name: string
  description: string
  type?: string
  spec?: Record<string, unknown>
}

export interface UpdateToolRequest {
  name?: string
  description?: string
  type?: string
  spec?: Record<string, unknown>
}

export interface AgentToolsResponse {
  tools: Tool[]
  assigned_ids: string[]
}

async function handleError(response: Response): Promise<never> {
  const err = (await response.json().catch(() => ({}))) as { detail?: string; message?: string }
  const msg = err.detail ?? err.message ?? response.statusText
  throw new Error(msg || `Request failed: ${response.status}`)
}

export async function getTools(): Promise<Tool[]> {
  const res = await fetch(`${API_BASE_URL}/api/tools`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) await handleError(res)
  const data = await res.json()
  return Array.isArray(data) ? data : []
}

export async function createTool(req: CreateToolRequest): Promise<Tool> {
  const res = await fetch(`${API_BASE_URL}/api/tools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      name: req.name,
      description: req.description,
      type: req.type ?? 'function',
      spec: req.spec ?? {},
    }),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function getTool(toolId: string): Promise<Tool> {
  const res = await fetch(`${API_BASE_URL}/api/tools/${encodeURIComponent(toolId)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function updateTool(toolId: string, req: UpdateToolRequest): Promise<Tool> {
  const res = await fetch(`${API_BASE_URL}/api/tools/${encodeURIComponent(toolId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}

export async function deleteTool(toolId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/tools/${encodeURIComponent(toolId)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) await handleError(res)
}

export async function getAgentTools(agentId: string): Promise<AgentToolsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}/tools`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) await handleError(res)
  const data = await res.json()
  return {
    tools: Array.isArray(data.tools) ? data.tools : [],
    assigned_ids: Array.isArray(data.assigned_ids) ? data.assigned_ids : [],
  }
}

export async function assignToolsToAgent(agentId: string, toolIds: string[]): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/agents/${encodeURIComponent(agentId)}/tools`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool_ids: toolIds }),
  })
  if (!res.ok) await handleError(res)
}

export interface TestToolRequest {
  parameters: Record<string, unknown>
}

export interface TestToolResponse {
  success: boolean
  result?: string
  error?: string
  tool_name?: string
}

export async function testTool(toolId: string, request: TestToolRequest): Promise<TestToolResponse> {
  const res = await fetch(`${API_BASE_URL}/api/tools/${encodeURIComponent(toolId)}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) await handleError(res)
  return res.json()
}