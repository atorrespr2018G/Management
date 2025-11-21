'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Button,
    Alert,
    CircularProgress,
    Grid,
    Paper,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DatabaseIcon from '@mui/icons-material/Storage'
import CloseIcon from '@mui/icons-material/Close'
import {
    getNeo4jStats,
    getNeo4jVisualization,
    clearNeo4jGraph,
} from '@/services/neo4jApi'
import { formatBytes } from '@/utils/formatters'
import { useMachineId } from '@/hooks/useMachineId'
import type { GraphVisualization, GraphStats, GraphNode } from '@/types/neo4j'
import { useNeo4jStructure } from '@/hooks/useNeo4jStructure'
import DirectoryStructuresPanel from '@/components/DirectoryStructure/DirectoryStructuresPanel'
import { useStoreDirectoryInNeo4j } from '@/hooks/useStoreDirectoryInNeo4j'

const NEO4J_API_URL = process.env.NEXT_PUBLIC_NEO4J_API_URL || 'http://localhost:8000'

// Dynamic import for vis-network to handle SSR
let Network: any = null
let DataSet: any = null

if (typeof window !== 'undefined') {
    import('vis-network').then((vis) => {
        Network = vis.Network
        import('vis-data').then((visData) => {
            DataSet = visData.DataSet
        })
    })
}

export default function RetrievePage() {
    const { scanResults } = useSelector((state: any) => state.scanner)
    // const { neo4jDirectoryStructure } = useSelector((state: any) => state.neo);
    const { machineId } = useMachineId()

    const [graphData, setGraphData] = useState<GraphVisualization>({ nodes: [], links: [] })
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [stats, setStats] = useState<GraphStats | null>(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
    const networkRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const fullscreenContainerRef = useRef<HTMLDivElement>(null)
    const { fetchNeo4jStructure } = useNeo4jStructure({ machineId, node: scanResults?.data });
    const {
        isStoring,
        storeMessage,
        handleStoreInNeo4j,
    } = useStoreDirectoryInNeo4j({
        scanData: scanResults?.data ?? null,
        metadata: scanResults?.metadata,
        machineId,
        onAfterStore: async () => {
            await fetchNeo4jStructure();
            await fetchGraphData(); // keep the Graph Data card in sync
        },
    });

    useEffect(() => {
        fetchGraphData()
    }, [])

    useEffect(() => {
        if (graphData.nodes.length > 0 && containerRef.current && Network && DataSet) {
            createNetwork(containerRef.current, false)
        }
    }, [graphData])

    useEffect(() => {
        if (isFullscreen && graphData.nodes.length > 0 && fullscreenContainerRef.current && Network && DataSet) {
            createNetwork(fullscreenContainerRef.current, true)
        }
    }, [isFullscreen, graphData])

    const fetchGraphData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const statsData = await getNeo4jStats()
            setStats(statsData)

            const visualizationData = await getNeo4jVisualization()
            setGraphData(visualizationData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch graph data')
            setGraphData({ nodes: [], links: [] })
        } finally {
            setIsLoading(false)
        }
    }

    const createNetwork = (container: HTMLDivElement, isFullscreen: boolean) => {
        if (!container || !Network || !DataSet) return

        const nodes = new DataSet(
            graphData.nodes.map((node) => ({
                id: node.id,
                label: node.name,
                color: node.type === 'directory' ? '#2196F3' : node.type === 'file' ? '#4CAF50' : '#FF9800',
                value: node.type === 'directory' ? 50 : 20,
                font: { color: '#ffffff', size: 12 },
                borderWidth: 2,
                borderColor: '#000000',
            }))
        )

        const edges = new DataSet(
            graphData.links.map((link) => ({
                from: link.source,
                to: link.target,
                color: '#848484',
                width: 1,
            }))
        )

        const options = {
            nodes: {
                shape: 'circle',
                font: { size: 14, color: '#000000' },
                borderWidth: 3,
                shadow: { enabled: true },
            },
            edges: {
                width: 1,
                color: '#848484',
                smooth: { type: 'continuous' },
            },
            physics: {
                enabled: true,
                stabilization: { iterations: 200 },
            },
        }

        if (networkRef.current) {
            networkRef.current.destroy()
        }

        const network = new Network(container, { nodes, edges }, options)
        networkRef.current = network

        network.on('selectNode', (params: any) => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0]
                const node = graphData.nodes.find((n) => n.id === nodeId)
                if (node) setSelectedNode(node)
            }
        })

        network.on('deselectNode', () => {
            setSelectedNode(null)
        })
    }

    const deleteNode = async () => {
        if (!selectedNode) return

        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`${NEO4J_API_URL}/api/graph/nodes/${selectedNode.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            })

            if (!response.ok) {
                throw new Error('Failed to delete node')
            }

            await fetchGraphData()
            setSelectedNode(null)
            setDeleteDialogOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete node')
        } finally {
            setIsLoading(false)
        }
    }

    const deleteAllRecords = async () => {
        try {
            setIsLoading(true)
            setError(null)

            await clearNeo4jGraph()
            await fetchGraphData()
            setSelectedNode(null)
            setDeleteAllDialogOpen(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete all records')
        } finally {
            setIsLoading(false)
        }
    }





    const exportGraphData = () => {
        const dataStr = JSON.stringify(graphData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `graph-data-${new Date().toISOString()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        Graph Retrieve
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Visualize your Neo4j graph database
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<FullscreenIcon />}
                        onClick={() => setIsFullscreen(true)}
                        disabled={graphData.nodes.length === 0}
                    >
                        Fullscreen
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchGraphData}
                        disabled={isLoading}
                    >
                        Refresh
                    </Button>
                    <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportGraphData}>
                        Export Graph
                    </Button>
                </Box>
            </Box>

            {stats && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Total Nodes
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {stats.total_nodes || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Files
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {stats.total_files || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Directories
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {stats.total_directories || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} sm={3}>
                        <Card>
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Sources
                                </Typography>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    {stats.sources?.length || 0}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3} style={{ paddingBottom: scanResults ? '1.5em' : '' }}>
                {/* Graph Visualization */}
                <Grid item xs={12} lg={8}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Graph Visualization
                            </Typography>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                    <CircularProgress />
                                </Box>
                            ) : graphData.nodes.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 8 }}>
                                    <DatabaseIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="h6" color="text.secondary">
                                        No data available
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                        Scan some directories first to see the graph
                                    </Typography>
                                </Box>
                            ) : (
                                <Box
                                    ref={containerRef}
                                    sx={{
                                        width: '100%',
                                        height: '600px',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        borderRadius: 1,
                                    }}
                                />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Node Details */}
                <Grid item xs={12} lg={4}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                Node Details
                            </Typography>
                            {selectedNode ? (
                                <Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Name
                                        </Typography>
                                        <Typography variant="body1">{selectedNode.name}</Typography>
                                    </Box>
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Type
                                        </Typography>
                                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                                            {selectedNode.type}
                                        </Typography>
                                    </Box>
                                    {selectedNode.size && (
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="subtitle2" color="text.secondary">
                                                Size
                                            </Typography>
                                            <Typography variant="body1">{formatBytes(selectedNode.size)}</Typography>
                                        </Box>
                                    )}
                                    <Box sx={{ mb: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            ID
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {selectedNode.id}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            startIcon={<DeleteIcon />}
                                            onClick={() => setDeleteDialogOpen(true)}
                                            disabled={isLoading}
                                            fullWidth
                                        >
                                            Delete Node
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            startIcon={<DeleteForeverIcon />}
                                            onClick={() => setDeleteAllDialogOpen(true)}
                                            disabled={isLoading}
                                            fullWidth
                                        >
                                            Delete All Records
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <DatabaseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Click on a node to see details
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Directory Structures - Side by Side */}
            {scanResults && (
                <DirectoryStructuresPanel
                    node={scanResults?.data}
                    machineId={machineId}
                    isStoring={isStoring}
                    storeMessage={storeMessage}
                    onStoreInNeo4j={handleStoreInNeo4j}
                    onGraphDataChanged={fetchGraphData}
                />
            )}

            {/* Graph Data Table */}
            {graphData.nodes.length > 0 && (
                <Card sx={{ mt: 3 }}>
                    <CardContent>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Graph Data
                        </Typography>
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Size</TableCell>
                                        <TableCell>Connections</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {graphData.nodes.map((node) => (
                                        <TableRow key={node.id} hover>
                                            <TableCell>{node.name}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={node.type}
                                                    size="small"
                                                    color={node.type === 'directory' ? 'primary' : 'success'}
                                                />
                                            </TableCell>
                                            <TableCell>{node.size ? formatBytes(node.size) : '-'}</TableCell>
                                            <TableCell>
                                                {graphData.links.filter(
                                                    (link) => link.source === node.id || link.target === node.id
                                                ).length}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </CardContent>
                </Card>
            )}

            {/* Delete Node Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Delete Node</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete &quot;{selectedNode?.name}&quot;?
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        This will remove the node and all its relationships from Neo4j.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={deleteNode} color="error" variant="contained" disabled={isLoading}>
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete All Records Dialog */}
            <Dialog open={deleteAllDialogOpen} onClose={() => setDeleteAllDialogOpen(false)}>
                <DialogTitle>Delete All Records</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete ALL records from Neo4j?
                    </Typography>
                    <Typography variant="body2" color="error" sx={{ mt: 1, fontWeight: 'bold' }}>
                        This will remove all nodes and relationships. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
                    <Button onClick={deleteAllRecords} color="error" variant="contained" disabled={isLoading}>
                        {isLoading ? 'Clearing...' : 'Delete All'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Fullscreen Modal */}
            {isFullscreen && (
                <Dialog
                    open={isFullscreen}
                    onClose={() => setIsFullscreen(false)}
                    maxWidth={false}
                    fullWidth
                    PaperProps={{
                        sx: {
                            width: '100vw',
                            height: '100vh',
                            maxWidth: '100vw',
                            maxHeight: '100vh',
                            m: 0,
                        },
                    }}
                >
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Graph Visualization - Fullscreen</Typography>
                        <IconButton onClick={() => setIsFullscreen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ p: 2, height: 'calc(100vh - 120px)' }}>
                        <Box
                            ref={fullscreenContainerRef}
                            sx={{
                                width: '100%',
                                height: '100%',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1,
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Container>
    )
}