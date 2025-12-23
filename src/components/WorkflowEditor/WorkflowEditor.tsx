'use client'

import { useCallback, useState } from 'react'
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Box, Button, Paper, Typography } from '@mui/material'
import { PlayArrow as PlayArrowIcon } from '@mui/icons-material'
import InvokeAgentConfigPanel from './panels/InvokeAgentConfigPanel'
import InvokeAgentNode, { InvokeAgentNodeData } from './nodes/InvokeAgentNodeData'
import StartNode, { StartNodeData } from './nodes/StartNode'
import AddActionNode from './nodes/AddActionNode'
import AskQuestionNode, { AskQuestionNodeData } from './nodes/AskQuestionNode'
import AskQuestionConfigPanel from './panels/AskQuestionConfigPanel'
import ActionSelectionPanel from './panels/ActionSelectionPanel'

const nodeTypes = {
    start: StartNode,
    invoke_agent: InvokeAgentNode,
    ask_question: AskQuestionNode,
    add_action: AddActionNode,
}

// Initial graph: Start -> Edge -> AddAction
const initialNodes: Node[] = [
    {
        id: 'start',
        type: 'start',
        position: { x: 100, y: 150 },
        data: { label: 'Start' }
    } as Node,
    {
        id: 'add-1',
        type: 'add_action',
        position: { x: 400, y: 165 }, // centered vertically relative to start (height diff)
        data: { label: '+' }
    } as Node
]

const initialEdges: Edge[] = [
    {
        id: 'e-start-add-1',
        source: 'start',
        target: 'add-1',
    }
]

const WorkflowEditorContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
    const [isRunning, setIsRunning] = useState(false)

    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
    const [insertionNodeId, setInsertionNodeId] = useState<string | null>(null) // The 'add_action' node being replaced

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    )

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type === 'add_action') {
            setInsertionNodeId(node.id)
            setSelectedNodeId(null) // Clear valid node selection
        } else {
            setSelectedNodeId(node.id)
            setInsertionNodeId(null) // Clear insertion mode
        }
    }, [])

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null)
        setInsertionNodeId(null)
    }, [])

    const handleNodeUpdate = useCallback((nodeId: string, newData: InvokeAgentNodeData | AskQuestionNodeData) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData }
                }
                return node
            })
        )
    }, [setNodes])

    const selectedNode = nodes.find((n) => n.id === selectedNodeId)

    const handleAddAction = (actionId: string) => {
        if (!insertionNodeId) return

        // 1. Find the insertion placeholder node
        const placeholderNode = nodes.find(n => n.id === insertionNodeId)
        if (!placeholderNode) return

        // 2. Determine position for new node (same as placeholder)
        // Adjust vertically for larger card
        // Placeholder is ~40px high, Agent card is taller. 
        // Let's keep Y aligned or slightly adjusted.
        const position = {
            x: placeholderNode.position.x,
            y: placeholderNode.position.y - 30 // Shift up slightly to center larger card
        }

        // 3. Create the new Action Node based on actionId
        const newNodeId = `node-${Date.now()}`
        let newNode: Node

        console.log('Creating node. actionId:', actionId, 'matches ask_question?', actionId === 'ask_question')

        if (actionId === 'ask_question') {
            newNode = {
                id: newNodeId,
                type: 'ask_question',
                position,
                data: {
                    actionId: `action-${Date.now()}`,
                    question: '',
                    variableName: '',
                } as AskQuestionNodeData,
            } as Node
        } else {
            // Default to invoke_agent
            newNode = {
                id: newNodeId,
                type: 'invoke_agent',
                position,
                data: {
                    actionId: `action-${Date.now()}`,
                    selectedAgent: '',
                    inputMessage: 'System.LastMessage',
                    autoIncludeResponse: true,
                    outputMessageVar: '',
                    outputJsonVar: '',
                } as InvokeAgentNodeData,
            } as Node
        }

        // 4. Create a NEW Placeholder node to the right
        const newPlaceholderId = `add-${Date.now()}`
        const newPlaceholder: Node = {
            id: newPlaceholderId,
            type: 'add_action',
            position: {
                x: position.x + 350, // Shift right by card width + gap
                y: placeholderNode.position.y // Keep original Y for straight line
            },
            data: { label: '+' }
        } as Node

        // 5. Update Edges
        // Find edge connected to insertion placeholder
        // Reconnect it to newNode
        // Add new edge from newNode to newPlaceholder

        setEdges((currentEdges) => {
            const incomingEdgeIndex = currentEdges.findIndex(e => e.target === insertionNodeId)
            const newEdges = [...currentEdges]

            if (incomingEdgeIndex !== -1) {
                // Modify existing edge to point to new node
                newEdges[incomingEdgeIndex] = {
                    ...newEdges[incomingEdgeIndex],
                    target: newNodeId
                }
            }

            // Add edge from new Node to new Placeholder
            const outgoingEdge: Edge = {
                id: `e-${newNodeId}-${newPlaceholderId}`,
                source: newNodeId,
                target: newPlaceholderId
            }

            return [...newEdges, outgoingEdge]
        })

        // 6. Update Nodes: Replace placeholder with [NewNode, NewPlaceholder]
        setNodes((currentNodes) => {
            return currentNodes
                .filter(n => n.id !== insertionNodeId) // Remove old placeholder
                .concat([newNode, newPlaceholder])
        })

        // 7. Select the new node for configuration
        setInsertionNodeId(null)
        setSelectedNodeId(newNodeId)
    }

    const runWorkflow = async () => {
        setIsRunning(true)
        console.log('🚀 Starting workflow execution...')
        // ... (execution logic same as before)
        console.log('\n🎉 Workflow execution completed!')
        setIsRunning(false)
    }

    return (
        <Box sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Paper
                elevation={2}
                sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: 0,
                    zIndex: 10,
                }}
            >
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Workflow Editor
                </Typography>
                {/* <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    onClick={runWorkflow}
                    disabled={isRunning}
                    sx={{ textTransform: 'none' }}
                >
                    {isRunning ? 'Running...' : 'Run Workflow'}
                </Button> */}
            </Paper>

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                {/* React Flow Canvas */}
                <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', position: 'relative' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Controls />
                        <MiniMap />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    </ReactFlow>
                </Box>

                {/* Side Panel */}

                {/* Case 1: Configuration Panel (Node Selected) */}
                {selectedNode && selectedNode.type === 'invoke_agent' && (
                    <Paper
                        elevation={4}
                        sx={{
                            width: 400,
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            zIndex: 5,
                        }}
                    >
                        <InvokeAgentConfigPanel
                            data={selectedNode.data as InvokeAgentNodeData}
                            onUpdate={(newData) => handleNodeUpdate(selectedNode.id, newData)}
                        />
                    </Paper>
                )}

                {/* Case 1b: Ask Question Configuration Panel */}
                {selectedNode && selectedNode.type === 'ask_question' && (
                    <Paper
                        elevation={4}
                        sx={{
                            width: 400,
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            zIndex: 5,
                        }}
                    >
                        <AskQuestionConfigPanel
                            data={selectedNode.data as AskQuestionNodeData}
                            onUpdate={(newData) => handleNodeUpdate(selectedNode.id, newData)}
                        />
                    </Paper>
                )}

                {/* Case 2: Action Selection Panel (Insertion Mode) */}
                {insertionNodeId && (
                    <Paper
                        elevation={4}
                        sx={{
                            width: 350,
                            borderLeft: '1px solid',
                            borderColor: 'divider',
                            overflowY: 'auto',
                            bgcolor: 'background.paper',
                            zIndex: 5,
                        }}
                    >
                        <ActionSelectionPanel
                            onSelect={handleAddAction}
                            onClose={() => setInsertionNodeId(null)}
                        />
                    </Paper>
                )}
            </Box>
        </Box >
    )
}

// Wrap in Provider to ensure context exists if we use useReactFlow hooks internally
const WorkflowEditor = () => (
    <ReactFlowProvider>
        <WorkflowEditorContent />
    </ReactFlowProvider>
)

export default WorkflowEditor