/**
 * Custom hook for workflow execution monitoring
 * Handles polling for execution status updates
 */

import { useState, useEffect, useCallback } from 'react'
import { getExecutionStatus } from '@/services/workflowApi'
import type { ExecutionStatusResponse } from '@/types/workflow'

export function useWorkflowExecution(runId: string | null, pollInterval = 2000) {
  const [status, setStatus] = useState<ExecutionStatusResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async () => {
    if (!runId) return

    try {
      setLoading(true)
      setError(null)
      const data = await getExecutionStatus(runId)
      setStatus(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load execution status')
    } finally {
      setLoading(false)
    }
  }, [runId])

  useEffect(() => {
    if (!runId) {
      setStatus(null)
      return
    }

    // Load initial status
    loadStatus()

    // Poll for updates if execution is running
    const interval = setInterval(() => {
      if (status?.status === 'running') {
        loadStatus()
      }
    }, pollInterval)

    return () => clearInterval(interval)
  }, [runId, status?.status, loadStatus, pollInterval])

  return { status, loading, error, refetch: loadStatus }
}
