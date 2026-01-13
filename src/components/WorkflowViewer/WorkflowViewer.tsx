// Management/src/components/WorkflowViewer/WorkflowViewer.tsx
'use client';

import { useCallback, useState } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    BackgroundVariant,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Paper, Typography, Chip } from '@mui/material';
import type { WorkflowGraph, ValidationIssue, WorkflowNode, WorkflowEdge } from '@/types/workflow';
import StartNode from '../WorkflowEditor/nodes/StartNode';
import SendMessageNode, { SendMessageNodeData } from '../WorkflowEditor/nodes/SendMessageNode';
import InvokeAgentNode, { InvokeAgentNodeData } from '../WorkflowEditor/nodes/InvokeAgentNodeData';
import AddActionNode from '../WorkflowEditor/nodes/AddActionNode';
import ActionSelectionPanel from '../WorkflowEditor/panels/ActionSelectionPanel';
import SendMessageConfigPanel from '../WorkflowEditor/panels/SendMessageConfigPanel';
import InvokeAgentConfigPanel from '../WorkflowEditor/panels/InvokeAgentConfigPanel';

const nodeTypes = {
    start: StartNode,
    invoke_agent: InvokeAgentNode,
    send_message: SendMessageNode,
    add_action: AddActionNode,  // A1) Add the plus node type
};

interface WorkflowViewerProps {
    graph: WorkflowGraph;
    name: string;
    validationStatus: 'unvalidated' | 'valid' | 'invalid';
    validationErrors?: ValidationIssue[];
    onGraphChange?: (graph: WorkflowGraph) => void;  // Callback when graph is modified
    onNodeSelect?: (nodeId: string | null) => void;  // Callback when node is selected
}

// A1) Convert backend workflow graph to ReactFlow format with trailing add_action node
function convertToReactFlowFormat(graph: WorkflowGraph): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = graph.nodes.map((node, index) => {
        // Determine node type
        let type = 'start';
        if (node.type === 'send_message') type = 'send_message';
        else if (node.type === 'invoke_agent') type = 'invoke_agent';
        else if (node.type === 'start') type = 'start';

        // Use position if available, otherwise calculate layout
        const position = node.position || {
            x: 100 + (index * 300),
            y: 150
        };

        // Prepare node data from config or data field
        const nodeData = node.config || node.data || {};

        return {
            id: node.id,
            type,
            position,
            data: {
                label: node.type,
                ...nodeData
            }
        };
    });

    const edges: Edge[] = graph.edges.map((edge, index) => ({
        id: edge.id || `edge-${index}`,
        source: edge.source,
        target: edge.target,
    }));

    // A1) Find end nodes (nodes with no outgoing edges)
    const nodeIdsWithOutgoingEdges = new Set(edges.map(e => e.source));
    const endNodes = nodes.filter(n => !nodeIdsWithOutgoingEdges.has(n.id));

    // Pick first end node deterministically (or the last node if no clear end)
    const endNode = endNodes.length > 0 ? endNodes[0] : nodes[nodes.length - 1];

    if (endNode) {
        // Create add_action placeholder
        const addActionNodeId = `add-${endNode.id}`;
        const addActionNode: Node = {
            id: addActionNodeId,
            type: 'add_action',
            position: {
                x: endNode.position.x + 350,
                y: endNode.position.y
            },
            data: { label: '+' }
        };

        // Add edge from end node to add_action
        const addActionEdge: Edge = {
            id: `e-${endNode.id}-${addActionNodeId}`,
            source: endNode.id,
            target: addActionNodeId
        };

        nodes.push(addActionNode);
        edges.push(addActionEdge);
    }

    return { nodes, edges };
}

// Helper function to convert ReactFlow format back to WorkflowGraph format
const serializeCurrentGraph = (nodes: Node[], edges: Edge[]): WorkflowGraph => {
    // Filter out add_action placeholder nodes
    const workflowNodes: WorkflowNode[] = nodes
        .filter(node => node.type !== 'add_action')
        .map(node => {
            // Map ReactFlow types back to backend types
            let nodeType: 'start' | 'send_message' | 'invoke_agent' = 'start';
            if (node.type === 'send_message') nodeType = 'send_message';
            else if (node.type === 'invoke_agent') nodeType = 'invoke_agent';
            else if (node.type === 'start') nodeType = 'start';

            return {
                id: node.id,
                type: nodeType,
                position: node.position,
                config: node.data, // Store node data in config field
            };
        });

    // Filter out edges connected to add_action nodes
    const workflowEdges: WorkflowEdge[] = edges
        .filter(edge => {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            return sourceNode?.type !== 'add_action' && targetNode?.type !== 'add_action';
        })
        .map(edge => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
        }));

    return {
        nodes: workflowNodes,
        edges: workflowEdges,
    };
}

const WorkflowViewerContent: React.FC<WorkflowViewerProps> = ({ graph, name, validationStatus, validationErrors, onGraphChange, onNodeSelect }) => {
    const { nodes: initialNodes, edges: initialEdges } = convertToReactFlowFormat(graph);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // A2) State for insertion mode
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [insertionNodeId, setInsertionNodeId] = useState<string | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valid': return 'success';
            case 'invalid': return 'error';
            case 'unvalidated': return 'warning';
            default: return 'default';
        }
    };

    // A2) Handle node click - distinguish between add_action and regular nodes
    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type === 'add_action') {
            // Show ActionSelectionPanel for insertion
            setInsertionNodeId(node.id);
            setSelectedNodeId(null);
        } else {
            // Show config panel for regular nodes
            setSelectedNodeId(node.id);
            setInsertionNodeId(null);
        }
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNodeId(null);
        setInsertionNodeId(null);
    }, []);

    // Helper: Get currently selected node
    const getSelectedNode = useCallback(() => {
        return selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
    }, [selectedNodeId, nodes]);

    // Helper: Update node data when config panel changes
    const handleNodeUpdate = useCallback((nodeId: string, newData: InvokeAgentNodeData | SendMessageNodeData) => {
        setNodes((nds) => {
            const updated = nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            });

            // Notify parent of graph change
            if (onGraphChange) {
                const serialized = serializeCurrentGraph(updated, edges);
                onGraphChange(serialized);
            }

            return updated;
        });
    }, [setNodes, edges, onGraphChange]);

    // A3) Handle adding a new action
    const handleAddAction = useCallback((actionId: string) => {
        if (!insertionNodeId) return;

        // Find the placeholder node being replaced
        const placeholderNode = nodes.find(n => n.id === insertionNodeId);
        if (!placeholderNode) return;

        // Create new node
        const newNodeId = `node-${Date.now()}`;
        const position = {
            x: placeholderNode.position.x,
            y: placeholderNode.position.y - 30
        };

        let newNode: Node;

        if (actionId === 'send_message') {
            newNode = {
                id: newNodeId,
                type: 'send_message',
                position,
                data: {
                    actionId: `action-${Date.now()}`,
                    message: '',
                    variableName: '',
                } as SendMessageNodeData,
            } as Node;
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
            } as Node;
        }

        // Create new add_action placeholder
        const newPlaceholderId = `add-${Date.now()}`;
        const newPlaceholder: Node = {
            id: newPlaceholderId,
            type: 'add_action',
            position: {
                x: position.x + 350,
                y: placeholderNode.position.y
            },
            data: { label: '+' }
        } as Node;

        // Update edges
        setEdges((currentEdges) => {
            const newEdges = [...currentEdges];

            // Find and update incoming edge to point to new node
            const incomingEdgeIndex = newEdges.findIndex(e => e.target === insertionNodeId);
            if (incomingEdgeIndex !== -1) {
                newEdges[incomingEdgeIndex] = {
                    ...newEdges[incomingEdgeIndex],
                    target: newNodeId
                };
            }

            // Add edge from new node to new placeholder
            const outgoingEdge: Edge = {
                id: `e-${newNodeId}-${newPlaceholderId}`,
                source: newNodeId,
                target: newPlaceholderId
            };

            return [...newEdges, outgoingEdge];
        });

        // Update nodes
        setNodes((currentNodes) => {
            const updated = currentNodes
                .filter(n => n.id !== insertionNodeId)
                .concat([newNode, newPlaceholder]);

            // Notify parent of graph change
            if (onGraphChange) {
                setTimeout(() => {
                    const serialized = serializeCurrentGraph(updated, edges);
                    onGraphChange(serialized);
                }, 0);
            }

            return updated;
        });

        // Clear insertion mode
        setInsertionNodeId(null);
        // setSelectedNodeId(newNodeId);
    }, [insertionNodeId, nodes, setEdges, setNodes]);

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
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {nodes.filter(n => n.type !== 'add_action').length - 1} nodes, {edges.length} edges
                    </Typography>
                </Box>
                {/* <Chip
                    label={validationStatus.toUpperCase()}
                    color={getStatusColor(validationStatus)}
                    sx={{ fontWeight: 600 }}
                /> */}
            </Paper>

            {/* Main Content Area */}
            <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
                {/* React Flow Canvas - B) Now draggable */}
                <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', position: 'relative' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        nodesDraggable={true}  // B) Enable dragging
                        nodesConnectable={false}  // Keep false - no manual edge creation
                        elementsSelectable={true}
                        fitView
                        minZoom={0.5}
                        maxZoom={1.5}
                    >
                        <Controls />
                        <MiniMap />
                        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                    </ReactFlow>
                </Box>

                {/* A5) Action Selection Panel (when in insertion mode) */}
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

                {/* Config Panel for send_message nodes */}
                {selectedNodeId && getSelectedNode()?.type === 'send_message' && (
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
                        <SendMessageConfigPanel
                            data={getSelectedNode()!.data as SendMessageNodeData}
                            onUpdate={(newData) => handleNodeUpdate(selectedNodeId, newData)}
                        />
                    </Paper>
                )}

                {/* Config Panel for invoke_agent nodes */}
                {selectedNodeId && getSelectedNode()?.type === 'invoke_agent' && (
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
                            data={getSelectedNode()!.data as InvokeAgentNodeData}
                            onUpdate={(newData) => handleNodeUpdate(selectedNodeId, newData)}
                        />
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

// Wrap in Provider
const WorkflowViewer: React.FC<WorkflowViewerProps> = (props) => (
    <ReactFlowProvider>
        <WorkflowViewerContent {...props} />
    </ReactFlowProvider>
);

export default WorkflowViewer;
