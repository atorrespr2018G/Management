// management/utils/workflows.ts
import { Node, Edge } from '@xyflow/react'

export function toWorkflowPayload(nodes: Node[], edges: Edge[]) {
    return { nodes, edges }
}

