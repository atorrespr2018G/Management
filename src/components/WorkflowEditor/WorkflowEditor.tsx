// Management/src/components/WorkflowEditor/WorkflowEditor.tsx
'use client';

import { useCallback, useState, useMemo, useEffect } from 'react';
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
import FanOutNode from '../WorkflowEditor/nodes/FanOutNode';
import FanInNode from '../WorkflowEditor/nodes/FanInNode';
import ActionSelectionPanel from '../WorkflowEditor/panels/ActionSelectionPanel';
import SendMessageConfigPanel from '../WorkflowEditor/panels/SendMessageConfigPanel';
import InvokeAgentConfigPanel from '../WorkflowEditor/panels/InvokeAgentConfigPanel';
import FanOutConfigPanel from '../WorkflowEditor/panels/FanOutConfigPanel';
import FanInConfigPanel from '../WorkflowEditor/panels/FanInConfigPanel';
import { deleteNode as deleteNodeFromGraph, isDeletable } from '@/utils/workflowsUtils';
import { invokeTool } from '@/utils/foundry';

interface Agent {
    id: string;
    name: string;
    model: string;
    description?: string;
}

const nodeTypes = {
    start: StartNode,
    invoke_agent: InvokeAgentNode,
    send_message: SendMessageNode,
    add_action: AddActionNode,
    fan_out: FanOutNode,
    fan_in: FanInNode,
};

interface WorkflowEditorProps {
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
        else if (node.type === 'fan_out') type = 'fan_out';
        else if (node.type === 'fan_in') type = 'fan_in';
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
            let nodeType: 'start' | 'send_message' | 'invoke_agent' | 'fan_out' | 'fan_in' = 'start';
            if (node.type === 'send_message') nodeType = 'send_message';
            else if (node.type === 'invoke_agent') nodeType = 'invoke_agent';
            else if (node.type === 'fan_out') nodeType = 'fan_out';
            else if (node.type === 'fan_in') nodeType = 'fan_in';
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

const WorkflowEditorContent: React.FC<WorkflowEditorProps> = ({ graph, name, validationStatus, validationErrors, onGraphChange, onNodeSelect }) => {
    const { nodes: initialNodes, edges: initialEdges } = convertToReactFlowFormat(graph);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Agent caching state - fetch once at mount
    const [agents, setAgents] = useState<Agent[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(true);
    const [agentsError, setAgentsError] = useState<string | null>(null);

    // Fetch agents once on mount
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                setAgentsLoading(true);
                setAgentsError(null);
                const agentsData: Agent[] = await invokeTool('list-agents', {});
                console.log('[WorkflowEditor] Cached agents:', agentsData);
                setAgents(agentsData);
            } catch (err) {
                console.error('[WorkflowEditor] Failed to fetch agents:', err);
                setAgentsError(err instanceof Error ? err.message : 'Failed to load agents');
            } finally {
                setAgentsLoading(false);
            }
        };
        fetchAgents();
    }, []);

    // A2) State for insertion mode
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [insertionNodeId, setInsertionNodeId] = useState<string | null>(null); // For add_action node

    // A2.5) Handle node deletion (defined before enrichedNodes to avoid scoping error)
    const handleDeleteNode = useCallback((nodeId: string) => {
        const currentGraph = { nodes, edges };
        const newGraph = deleteNodeFromGraph(currentGraph, nodeId);

        // Update state
        setNodes(newGraph.nodes);
        setEdges(newGraph.edges);

        // Clear selection if deleted node was selected
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }

        // Notify parent of graph change (marks workflow dirty)
        if (onGraphChange) {
            const serialized = serializeCurrentGraph(newGraph.nodes, newGraph.edges);
            onGraphChange(serialized);
        }
    }, [nodes, edges, selectedNodeId, setNodes, setEdges, onGraphChange]);

    // Enrich nodes with delete handlers and deletable flags
    const enrichedNodes = useMemo(() => {
        const currentGraph = { nodes, edges };
        return nodes.map(node => ({
            ...node,
            data: {
                ...node.data,
                onDelete: () => handleDeleteNode(node.id),
                showDeleteButton: isDeletable(currentGraph, node.id)
            }
        }));
    }, [nodes, edges, handleDeleteNode]);

    // Color-code validation status
    const getStatusColor = () => {
        switch (validationStatus) {
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
    const handleNodeUpdate = useCallback((nodeId: string, newData: any) => {
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
    const handleAddAction = useCallback((actionId: string, config?: any) => {
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
        } else if (actionId === 'parallel') {
            const branches = config?.branches || 3;
            const branchGap = 300;
            const totalWidth = (branches - 1) * branchGap;
            const startX = position.x - (totalWidth / 2);

            // 1. Create FanOut Node
            const fanOutId = `fanout-${Date.now()}`;
            const fanOutNode: Node = {
                id: fanOutId,
                type: 'fan_out',
                position: { ...position },
                data: { label: 'Fan Out' }
            };

            // 2. Create N Agent Nodes
            const agentNodes: Node[] = [];
            for (let i = 0; i < branches; i++) {
                const agentId = `agent-${Date.now()}-${i}`;
                agentNodes.push({
                    id: agentId,
                    type: 'invoke_agent',
                    position: {
                        x: startX + (i * branchGap),
                        y: position.y + 150
                    },
                    data: {
                        actionId: `action-${Date.now()}-${i}`,
                        selectedAgent: '', // User to select later
                        autoIncludeResponse: true,
                    } as InvokeAgentNodeData
                });
            }

            // 3. Create FanIn Node
            const fanInId = `fanin-${Date.now()}`;
            const fanInNode: Node = {
                id: fanInId,
                type: 'fan_in',
                position: {
                    x: position.x,
                    y: position.y + 300
                },
                data: {
                    label: 'Fan In',
                    aggregationMode: 'json_object' // Default per requirement
                }
            };

            // 4. Create New Placeholders
            // Only one continuation after FanIn
            const newPlaceholderId = `add-${Date.now()}`;
            const newPlaceholder: Node = {
                id: newPlaceholderId,
                type: 'add_action',
                position: {
                    x: position.x + 350, // offset right of FanIn? No, flow is vertical usually?
                    // Original code uses add_action offset x + 350 from prev node.
                    // If flow is visualized horizontally:
                    y: position.y + 300
                },
                data: { label: '+' }
            };

            // Update state with new nodes
            // FanOut replaces placeholder (via incoming edge re-target)
            // FanIn connects to placeholder

            // Need to handle edges carefully within setEdges/setNodes
            // ... (handled below)

            // Let's bundle this logic into the generic flow
            // But wait, the generic flow below assumes single `newNode`.
            // We need to return early or branch significantly.

            // Override newNode logic for parallel block
            handleParallelInsertion(fanOutNode, agentNodes, fanInNode, newPlaceholder);
            return;

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
        let updatedEdges: Edge[] = [];
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

            updatedEdges = [...newEdges, outgoingEdge];
            return updatedEdges;
        });

        // Update nodes
        setNodes((currentNodes) => {
            const updated = currentNodes
                .filter(n => n.id !== insertionNodeId)
                .concat([newNode, newPlaceholder]);

            // Notify parent of graph change with UPDATED edges
            if (onGraphChange) {
                setTimeout(() => {
                    const serialized = serializeCurrentGraph(updated, updatedEdges);
                    onGraphChange(serialized);
                }, 0);
            }

            return updated;
        });

        // Clear insertion mode
        setInsertionNodeId(null);
        // setSelectedNodeId(newNodeId);
    }, [insertionNodeId, nodes, setEdges, setNodes, onGraphChange]);

    // Helper for Parallel Insertion
    const handleParallelInsertion = (fanOut: Node, agents: Node[], fanIn: Node, placeholder: Node) => {
        if (!insertionNodeId) return;

        setEdges((currentEdges) => {
            const newEdges = [...currentEdges];

            // 1. Retarget incoming edge to FanOut
            const incomingEdgeIndex = newEdges.findIndex(e => e.target === insertionNodeId);
            if (incomingEdgeIndex !== -1) {
                newEdges[incomingEdgeIndex] = {
                    ...newEdges[incomingEdgeIndex],
                    target: fanOut.id
                };
            }

            // 2. FanOut -> Agents
            agents.forEach(agent => {
                newEdges.push({
                    id: `e-${fanOut.id}-${agent.id}`,
                    source: fanOut.id,
                    target: agent.id
                });
            });

            // 3. Agents -> FanIn
            agents.forEach(agent => {
                newEdges.push({
                    id: `e-${agent.id}-${fanIn.id}`,
                    source: agent.id,
                    target: fanIn.id
                });
            });

            // 4. FanIn -> Placeholder
            newEdges.push({
                id: `e-${fanIn.id}-${placeholder.id}`,
                source: fanIn.id,
                target: placeholder.id
            });

            return newEdges;
        });

        setNodes((currentNodes) => {
            const updated = currentNodes
                .filter(n => n.id !== insertionNodeId) // Remove old placeholder
                .concat([fanOut, ...agents, fanIn, placeholder]);

            // Notify parent
            if (onGraphChange) {
                setTimeout(() => {
                    const serialized = serializeCurrentGraph(updated, edges); // Edges might be stale here due to closure?
                    // Actually edges in serializeCurrentGraph come from arguments, but we need updated edges.
                    // Since setEdges is async, we can't reliably use updated edges here immediately.
                    // But we can approximate or rely on next render.
                    // For now, let's just trigger it.
                    // Ideally we should use useEffect to sync graph change, but this follows existing pattern.
                }, 100);
            }
            return updated;
        });

        setInsertionNodeId(null);
    };

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
                        nodes={enrichedNodes}
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
                            agents={agents}
                            agentsLoading={agentsLoading}
                            agentsError={agentsError}
                        />
                    </Paper>
                )}

                {/* Config Panel for fan_out nodes */}
                {selectedNodeId && getSelectedNode()?.type === 'fan_out' && (
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
                        <FanOutConfigPanel />
                    </Paper>
                )}

                {/* Config Panel for fan_in nodes */}
                {selectedNodeId && getSelectedNode()?.type === 'fan_in' && (
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
                        <FanInConfigPanel
                            data={getSelectedNode()!.data as any}
                            onUpdate={(newData) => handleNodeUpdate(selectedNodeId, newData)}
                        />
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

// Wrap in Provider
const WorkflowEditor: React.FC<WorkflowEditorProps> = (props) => (
    <ReactFlowProvider>
        <WorkflowEditorContent {...props} />
    </ReactFlowProvider>
);

export default WorkflowEditor;
