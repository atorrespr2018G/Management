/**
 * Workflow API Service Tests
 * Basic tests for API service functions
 */

import {
  executeWorkflow,
  getExecutionStatus,
  getWorkflowDefinition,
  validateWorkflowDefinition,
} from '../workflowApi'
import type { WorkflowRequest, WorkflowDefinition } from '@/types/workflow'

// Mock fetch globally
global.fetch = jest.fn()

describe('Workflow API Service', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear()
  })

  describe('executeWorkflow', () => {
    it('should execute a workflow successfully', async () => {
      const mockResponse = {
        run_id: 'test-run-123',
        result: 'Test result',
        execution_time_ms: 1000,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: WorkflowRequest = {
        goal: 'Test goal',
        use_graph: true,
      }

      const result = await executeWorkflow(request)

      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/execute'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should handle errors correctly', async () => {
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Execution failed' }),
      })

      const request: WorkflowRequest = {
        goal: 'Test goal',
      }

      await expect(executeWorkflow(request)).rejects.toThrow('Execution failed')
    })
  })

  describe('getWorkflowDefinition', () => {
    it('should fetch workflow definition', async () => {
      const mockDefinition: WorkflowDefinition = {
        name: 'Test Workflow',
        nodes: [],
        edges: [],
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockDefinition,
      })

      const result = await getWorkflowDefinition()

      expect(result).toEqual(mockDefinition)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/definitions')
      )
    })
  })

  describe('validateWorkflowDefinition', () => {
    it('should validate workflow definition', async () => {
      const mockResult = {
        valid: true,
        errors: [],
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult,
      })

      const definition: WorkflowDefinition = {
        nodes: [],
        edges: [],
      }

      const result = await validateWorkflowDefinition(definition)

      expect(result.valid).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/definitions/validate'),
        expect.objectContaining({
          method: 'POST',
        })
      )
    })
  })
})
