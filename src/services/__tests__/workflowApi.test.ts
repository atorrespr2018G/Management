/**
 * Tests for workflowApi service
 */

import {
  executeWorkflow,
  getExecutionStatus,
  getExecutionHistory,
  listWorkflows,
  saveWorkflowDefinition,
  getActiveWorkflow,
  setActiveWorkflow,
} from '../workflowApi'
import type { WorkflowRequest, WorkflowDefinition } from '@/types/workflow'

// Mock fetch
global.fetch = jest.fn()

describe('workflowApi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('executeWorkflow', () => {
    it('calls the correct endpoint with workflow request', async () => {
      const mockResponse = {
        run_id: 'test-run-123',
        result: 'Test result',
        execution_time_ms: 1000,
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const request: WorkflowRequest = {
        goal: 'Test goal',
        use_graph: true,
      }

      const result = await executeWorkflow(request)

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/execute'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('throws error on failed request', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Execution failed' }),
      })

      await expect(executeWorkflow({ goal: 'test' })).rejects.toThrow()
    })
  })

  describe('getActiveWorkflow', () => {
    it('returns active workflow when available', async () => {
      const mockWorkflow = {
        workflow_id: 'active-123',
        name: 'Active Workflow',
        graph_definition: { nodes: [], edges: [] },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflow,
      })

      const result = await getActiveWorkflow()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/active')
      )
      expect(result).toEqual(mockWorkflow.graph_definition)
    })

    it('returns null when no active workflow', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

      const result = await getActiveWorkflow()

      expect(result).toBeNull()
    })
  })

  describe('setActiveWorkflow', () => {
    it('calls the correct endpoint to set active workflow', async () => {
      const mockResponse = {
        workflow_id: 'workflow-123',
        status: 'active',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await setActiveWorkflow('workflow-123')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/workflow-123/set-active'),
        expect.objectContaining({
          method: 'POST',
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })

  describe('listWorkflows', () => {
    it('returns list of workflows', async () => {
      const mockWorkflows = [
        { workflow_id: 'wf1', name: 'Workflow 1' },
        { workflow_id: 'wf2', name: 'Workflow 2' },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflows,
      })

      const result = await listWorkflows()

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/persist')
      )
      expect(result).toEqual(mockWorkflows)
    })
  })

  describe('saveWorkflowDefinition', () => {
    it('saves workflow definition', async () => {
      const mockWorkflow: WorkflowDefinition = {
        nodes: [{ id: 'node1', type: 'agent', agent_id: 'agent1' }],
        edges: [],
      }

      const mockResponse = {
        success: true,
        workflow_id: 'new-workflow-123',
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await saveWorkflowDefinition(mockWorkflow, 'Test Workflow')

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/workflows/definitions'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ definition: mockWorkflow, name: 'Test Workflow' }),
        })
      )
      expect(result).toEqual(mockResponse)
    })
  })
})
