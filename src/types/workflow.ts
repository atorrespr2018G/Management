/**
 * Workflow TypeScript Types
 * Matches backend GraphDefinition schema
 */

export type NodeType = 'agent' | 'fanout' | 'loop' | 'conditional' | 'merge'

export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'paused' | 'cancelled'

export interface WorkflowNode {
  id: string
  type: NodeType
  agent_id?: string
  inputs?: Record<string, string>
  outputs?: Record<string, string>
  params?: Record<string, any>
  branches?: string[]
  max_iters?: number
  loop_condition?: string
  condition?: string
}

export interface WorkflowEdge {
  from_node: string
  to_node: string
  condition?: string
}

export interface GraphLimits {
  max_steps?: number
  timeout_ms?: number
  max_iters?: number
  max_parallel?: number
}

export interface WorkflowDefinition {
  name?: string
  description?: string
  version?: string
  entry_node_id?: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  toolsets?: string[]
  policy_profile?: string
  limits?: GraphLimits
}

export interface WorkflowRequest {
  goal: string
  graph_path?: string
  use_graph?: boolean
  checkpoint_dir?: string
}

export interface WorkflowResponse {
  run_id: string
  result: string
  metrics?: {
    total_nodes?: number
    execution_time_ms?: number
    cache_hits?: number
    retries?: number
    [key: string]: any
  }
  execution_time_ms: number
}

export interface ExecutionStatusResponse {
  run_id: string
  status: ExecutionStatus
  current_node?: string
  progress?: number
  state?: Record<string, any>
  logs?: Array<{
    timestamp: number
    level: string
    message: string
    node_id?: string
  }>
}

export interface WorkflowExecution {
  run_id: string
  goal: string
  status: ExecutionStatus
  result?: string
  metrics?: Record<string, any>
  execution_time_ms: number
  created_at: string
  completed_at?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category?: string
  definition: WorkflowDefinition
  tags?: string[]
}

export interface ValidationResult {
  valid: boolean
  errors?: string[]
}

export interface WorkflowMetrics {
  run_id: string
  total_nodes: number
  execution_time_ms: number
  cache_hits: number
  retries: number
  node_metrics: Array<{
    node_id: string
    node_type: NodeType
    status: string
    duration_ms: number
    cache_hit: boolean
    retry_count: number
  }>
}
