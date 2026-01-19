/**
 * Workflow API Service
 * Handles all communication with the workflow backend API
 */

import type {
  WorkflowRequest,
  WorkflowResponse,
  WorkflowDefinition,
  ExecutionStatusResponse,
  WorkflowExecution,
  WorkflowTemplate,
  ValidationResult,
  WorkflowMetrics,
} from '@/types/workflow'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

/**
 * Execute a workflow
 */
export async function executeWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Workflow execution failed' }))
    throw new Error(error.message || error.detail || 'Workflow execution failed')
  }

  return response.json()
}

/**
 * Get workflow execution status
 */
export async function getExecutionStatus(runId: string): Promise<ExecutionStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/executions/${runId}/status`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Execution ${runId} not found`)
    }
    throw new Error('Failed to get execution status')
  }

  return response.json()
}

/**
 * Get workflow execution history
 */
export async function getExecutionHistory(limit = 50): Promise<WorkflowExecution[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/executions?limit=${limit}`)

  if (!response.ok) {
    throw new Error('Failed to get execution history')
  }

  const data = await response.json()
  // Backend returns array directly
  if (Array.isArray(data)) {
    return data.map((exec: any) => ({
      run_id: exec.run_id || exec.execution_id,
      goal: exec.goal || '',
      status: exec.status?.value || exec.status || 'completed',
      result: exec.result,
      metrics: exec.metrics,
      execution_time_ms: exec.execution_time_ms || exec.duration_ms || 0,
      created_at: exec.created_at || new Date().toISOString(),
      completed_at: exec.completed_at,
    }))
  }
  return data.executions || []
}

/**
 * List all saved workflows
 */
export async function listWorkflows(): Promise<Array<{ workflow_id: string; name: string; description?: string; created_at?: string; updated_at?: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/persist`)

  if (!response.ok) {
    throw new Error('Failed to list workflows')
  }

  return response.json()
}

/**
 * Get workflow definition
 */
export async function getWorkflowDefinition(graphPath?: string, workflowId?: string): Promise<WorkflowDefinition> {
  const params = new URLSearchParams()
  if (graphPath) params.append('graph_path', graphPath)
  if (workflowId) params.append('workflow_id', workflowId)
  
  const url = `${API_BASE_URL}/api/v1/workflows/definitions${params.toString() ? `?${params.toString()}` : ''}`

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Workflow definition not found')
    }
    throw new Error('Failed to get workflow definition')
  }

  return response.json()
}

/**
 * Save workflow definition
 */
export async function saveWorkflowDefinition(
  definition: WorkflowDefinition,
  name?: string
): Promise<{ success: boolean; path?: string; workflow_id?: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/definitions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ definition, name }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to save workflow definition' }))
    throw new Error(error.message || error.detail || 'Failed to save workflow definition')
  }

  return response.json()
}

/**
 * Validate workflow definition
 */
export async function validateWorkflowDefinition(
  definition: WorkflowDefinition
): Promise<ValidationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/definitions/validate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(definition),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Validation failed' }))
    return {
      valid: false,
      errors: [error.message || error.detail || 'Validation failed']
    }
  }

  return response.json()
}

/**
 * Get workflow metrics
 */
export async function getWorkflowMetrics(runId: string): Promise<WorkflowMetrics> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/metrics/${runId}`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Metrics not found for run ${runId}`)
    }
    throw new Error('Failed to get workflow metrics')
  }

  return response.json()
}

/**
 * Cancel workflow execution
 */
export async function cancelWorkflowExecution(runId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/executions/${runId}/cancel`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to cancel workflow execution')
  }
}

/**
 * Get workflow templates
 */
export async function getWorkflowTemplates(): Promise<WorkflowTemplate[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/templates`)

  if (!response.ok) {
    throw new Error('Failed to get workflow templates')
  }

  const data = await response.json()
  return Array.isArray(data.templates) ? data.templates : []
}

/**
 * Instantiate a workflow template
 */
export async function instantiateTemplate(
  templateId: string,
  parameters: Record<string, any> = {}
): Promise<WorkflowDefinition> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/templates/${templateId}/instantiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(parameters),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Template ${templateId} not found`)
    }
    throw new Error('Failed to instantiate template')
  }

  const data = await response.json()
  return data.graph || data
}

/**
 * Get workflow visualization
 */
export async function getWorkflowVisualization(
  workflowId: string,
  format: 'dot' | 'mermaid' | 'json' = 'mermaid'
): Promise<{ format: string; content?: string; graph?: any }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workflows/visualize/${workflowId}?format=${format}`
  )

  if (!response.ok) {
    throw new Error('Failed to get workflow visualization')
  }

  return response.json()
}

/**
 * Get workflow summary
 */
export async function getWorkflowSummary(workflowId: string): Promise<Record<string, any>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/summary/${workflowId}`)

  if (!response.ok) {
    throw new Error('Failed to get workflow summary')
  }

  return response.json()
}

/**
 * Get workflow versions
 */
export async function getWorkflowVersions(workflowId: string): Promise<Array<{ version: string; created_at?: string; description?: string }>> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/versions/${workflowId}`)

  if (!response.ok) {
    throw new Error('Failed to get workflow versions')
  }

  const data = await response.json()
  return data.versions || []
}

/**
 * Get specific workflow version
 */
export async function getWorkflowVersion(workflowId: string, version: string): Promise<WorkflowDefinition> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/versions/${workflowId}/${version}`)

  if (!response.ok) {
    throw new Error(`Version ${version} not found for workflow ${workflowId}`)
  }

  const data = await response.json()
  return data.graph || data
}

/**
 * Compare two workflow versions
 */
export async function compareWorkflowVersions(
  workflowId: string,
  version1: string,
  version2: string
): Promise<{ differences: Array<{ type: string; description: string }> }> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/workflows/versions/${workflowId}/compare?version1=${version1}&version2=${version2}`
  )

  if (!response.ok) {
    throw new Error('Failed to compare versions')
  }

  return response.json()
}

/**
 * Get the currently active workflow
 */
export async function getActiveWorkflow(): Promise<WorkflowDefinition | null> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/active`)

  if (!response.ok) {
    if (response.status === 404) {
      return null // No active workflow
    }
    throw new Error('Failed to get active workflow')
  }

  const data = await response.json()
  return data.graph_definition || null
}

/**
 * Set a workflow as active (deactivates all other workflows)
 */
export async function setActiveWorkflow(workflowId: string): Promise<{ workflow_id: string; status: string }> {
  const response = await fetch(`${API_BASE_URL}/api/v1/workflows/${workflowId}/set-active`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to set active workflow' }))
    throw new Error(error.message || error.detail || 'Failed to set active workflow')
  }

  return response.json()
}
