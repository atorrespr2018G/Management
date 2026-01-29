/**
 * Redux Slice for Workflow State Management
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type {
  WorkflowDefinition,
  ExecutionStatusResponse,
  WorkflowExecution,
  WorkflowNode,
  WorkflowEdge,
} from '@/types/workflow'
import { deleteNodeAndSplice } from '@/utils/workflowGraph'

interface WorkflowState {
  currentWorkflow: WorkflowDefinition | null
  executionStatus: ExecutionStatusResponse | null
  executionHistory: WorkflowExecution[]
  templates: any[]
  selectedNodeId: string | null
  isExecuting: boolean
  error: string | null
}

const initialState: WorkflowState = {
  currentWorkflow: null,
  executionStatus: null,
  executionHistory: [],
  templates: [],
  selectedNodeId: null,
  isExecuting: false,
  error: null,
}

const workflowSlice = createSlice({
  name: 'workflow',
  initialState,
  reducers: {
    setWorkflow: (state, action: PayloadAction<WorkflowDefinition>) => {
      state.currentWorkflow = action.payload
      state.error = null
    },
    updateNode: (
      state,
      action: PayloadAction<{ nodeId: string; updates: Partial<WorkflowNode> }>
    ) => {
      if (state.currentWorkflow) {
        const node = state.currentWorkflow.nodes.find((n) => n.id === action.payload.nodeId)
        if (node) {
          Object.assign(node, action.payload.updates)
        }
      }
    },
    addNode: (state, action: PayloadAction<WorkflowNode>) => {
      if (state.currentWorkflow) {
        state.currentWorkflow.nodes.push(action.payload)
      }
    },
    deleteNode: (state, action: PayloadAction<string>) => {
      if (state.currentWorkflow) {
        // state.currentWorkflow.nodes = state.currentWorkflow.nodes.filter(
        //   (n) => n.id !== action.payload
        // )
        // // Remove edges connected to this node
        // state.currentWorkflow.edges = state.currentWorkflow.edges.filter(
        //   (e) => e.from_node !== action.payload && e.to_node !== action.payload
        // )
        const { graph } = deleteNodeAndSplice(state.currentWorkflow, action.payload)
        state.currentWorkflow = graph

        // Clear selection if deleted node was selected
        if (state.selectedNodeId === action.payload) {
          state.selectedNodeId = null
        }
      }
    },
    addEdge: (state, action: PayloadAction<WorkflowEdge>) => {
      if (state.currentWorkflow) {
        // Check if edge already exists
        const exists = state.currentWorkflow.edges.some(
          (e) => e.from_node === action.payload.from_node && e.to_node === action.payload.to_node
        )
        if (!exists) {
          state.currentWorkflow.edges.push(action.payload)
        }
      }
    },
    deleteEdge: (state, action: PayloadAction<{ from: string; to: string }>) => {
      if (state.currentWorkflow) {
        state.currentWorkflow.edges = state.currentWorkflow.edges.filter(
          (e) => !(e.from_node === action.payload.from && e.to_node === action.payload.to)
        )
      }
    },
    setSelectedNode: (state, action: PayloadAction<string | null>) => {
      state.selectedNodeId = action.payload
    },
    setExecutionStatus: (state, action: PayloadAction<ExecutionStatusResponse>) => {
      state.executionStatus = action.payload
      state.isExecuting = action.payload.status === 'running'
    },
    addExecutionToHistory: (state, action: PayloadAction<WorkflowExecution>) => {
      state.executionHistory.unshift(action.payload)
      // Keep only last 100 executions
      if (state.executionHistory.length > 100) {
        state.executionHistory = state.executionHistory.slice(0, 100)
      }
    },
    setExecutionHistory: (state, action: PayloadAction<WorkflowExecution[]>) => {
      state.executionHistory = action.payload
    },
    setTemplates: (state, action: PayloadAction<any[]>) => {
      state.templates = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearWorkflow: (state) => {
      state.currentWorkflow = null
      state.selectedNodeId = null
      state.error = null
    },
  },
})

export const {
  setWorkflow,
  updateNode,
  addNode,
  deleteNode,
  addEdge,
  deleteEdge,
  setSelectedNode,
  setExecutionStatus,
  addExecutionToHistory,
  setExecutionHistory,
  setTemplates,
  setError,
  clearWorkflow,
} = workflowSlice.actions

export default workflowSlice.reducer
