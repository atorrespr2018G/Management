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
  Checkbox,
  FormControlLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'
import DownloadIcon from '@mui/icons-material/Download'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import DeleteIcon from '@mui/icons-material/Delete'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import DatabaseIcon from '@mui/icons-material/Storage'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import UploadIcon from '@mui/icons-material/Upload'
import CloseIcon from '@mui/icons-material/Close'
import {
  getNeo4jStats,
  getNeo4jVisualization,
  getDirectoryFromNeo4j,
  uploadFilesBatch,
  getFileRagStatus,
  clearNeo4jGraph,
} from '@/services/neo4jApi'
import { formatBytes } from '@/utils/formatters'
import { useMachineId } from '@/hooks/useMachineId'
import type { GraphVisualization, GraphStats, FileStructure, GraphNode } from '@/types/neo4j'

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
  const { machineId } = useMachineId()
  
  const [graphData, setGraphData] = useState<GraphVisualization>({ nodes: [], links: [] })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<GraphStats | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  
  // Directory structures
  const [neo4jDirectoryStructure, setNeo4jDirectoryStructure] = useState<FileStructure | null>(null)
  const [isLoadingNeo4jStructure, setIsLoadingNeo4jStructure] = useState(false)
  
  // RAG upload functionality
  const [selectedForRag, setSelectedForRag] = useState<Record<string, boolean>>({})
  const [ragStatuses, setRagStatuses] = useState<Record<string, 'complete' | 'partial' | 'none'>>({})
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0, totalChunks: 0 })
  
  const networkRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchGraphData()
  }, [])

  useEffect(() => {
    if (scanResults?.data && machineId) {
      fetchNeo4jStructure()
    }
  }, [scanResults?.data?.fullPath, machineId])

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

  const fetchNeo4jStructure = async () => {
    if (!scanResults?.data || !machineId) return

    try {
      setIsLoadingNeo4jStructure(true)
      const rootFullPath = scanResults.data.fullPath || ''
      if (!rootFullPath) return

      const result = await getDirectoryFromNeo4j(machineId, rootFullPath)
      if (result.found && result.structure) {
        setNeo4jDirectoryStructure(result.structure)
        await fetchRagStatuses(result.structure)
      }
    } catch (error) {
      console.error('Error fetching Neo4j structure:', error)
    } finally {
      setIsLoadingNeo4jStructure(false)
    }
  }

  const fetchRagStatuses = async (node: FileStructure) => {
    if (!machineId) return

    if (node.type === 'file') {
      const fileKey = `${machineId}:${node.fullPath || node.id}`
      try {
        const status = await getFileRagStatus(machineId, node.fullPath || node.id)
        setRagStatuses((prev) => ({ ...prev, [fileKey]: status.status }))
      } catch (error) {
        setRagStatuses((prev) => ({ ...prev, [fileKey]: 'none' }))
      }
    }
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await fetchRagStatuses(child)
      }
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

  const buildStableId = (node: FileStructure): string => {
    if (!machineId) return node.id
    return `${machineId}:${node.fullPath || node.id}`
  }

  const getDescendantFileIds = (node: FileStructure): string[] => {
    const ids: string[] = []
    if (node.type === 'file') {
      ids.push(buildStableId(node))
    }
    if (node.children) {
      node.children.forEach((child) => {
        ids.push(...getDescendantFileIds(child))
      })
    }
    return ids
  }

  const toggleSelection = (node: FileStructure) => {
    if (!machineId) return
    const stableId = buildStableId(node)
    const isSelected = selectedForRag[stableId] || false
    const newSelected = !isSelected

    setSelectedForRag((prev) => {
      const next = { ...prev }
      if (node.type === 'directory') {
        const descendantIds = getDescendantFileIds(node)
        descendantIds.forEach((id) => {
          next[id] = newSelected
        })
        next[stableId] = newSelected
      } else {
        next[stableId] = newSelected
      }
      return next
    })
  }

  const handleUploadDirectory = async (directoryNode: FileStructure) => {
    if (!machineId) {
      setUploadStatus((prev) => ({
        ...prev,
        [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found',
      }))
      return
    }

    const getSelectedFiles = (node: FileStructure): string[] => {
      const files: string[] = []
      const stableId = buildStableId(node)

      if (node.type === 'file' && selectedForRag[stableId]) {
        files.push(node.fullPath || node.id)
      }

      if (node.children) {
        node.children.forEach((child) => {
          files.push(...getSelectedFiles(child))
        })
      }

      return files
    }

    const selectedFiles = getSelectedFiles(directoryNode)

    if (selectedFiles.length === 0) {
      setUploadStatus((prev) => ({
        ...prev,
        [directoryNode.fullPath || directoryNode.id]: 'No files selected',
      }))
      return
    }

    setUploadProgress({ done: 0, total: selectedFiles.length, totalChunks: 0 })
    setUploadStatus((prev) => ({
      ...prev,
      [directoryNode.fullPath || directoryNode.id]: 'Uploading...',
    }))

    const BATCH_SIZE = 7
    let totalChunks = 0
    let processed = 0

    for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
      const batch = selectedFiles.slice(i, i + BATCH_SIZE)
      try {
        const result = await uploadFilesBatch(machineId, batch)
        totalChunks += result.created_chunks || 0
        processed += result.processed_files || 0

        setUploadProgress({
          done: processed,
          total: selectedFiles.length,
          totalChunks: totalChunks,
        })
      } catch (error) {
        console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error)
      }
    }

    setUploadStatus((prev) => ({
      ...prev,
      [directoryNode.fullPath || directoryNode.id]: `Uploaded: ${totalChunks} chunks`,
    }))
    setUploadProgress({ done: 0, total: 0, totalChunks: 0 })

    // Refresh structure
    setTimeout(() => {
      fetchNeo4jStructure()
    }, 500)

    setSelectedForRag({})
  }

  const renderNode = (node: FileStructure, level: number = 0): React.ReactNode => {
    const isDirectory = node.type === 'directory'
    const Icon = isDirectory ? FolderOpenIcon : InsertDriveFileIcon

    return (
      <Box key={node.id} sx={{ ml: level * 2, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Icon sx={{ fontSize: 16, color: isDirectory ? 'primary.main' : 'text.secondary' }} />
          <Typography variant="body2">{node.name}</Typography>
          {node.size && <Chip label={formatBytes(node.size)} size="small" variant="outlined" />}
        </Box>
        {node.children && node.children.length > 0 && (
          <Box sx={{ ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
            {node.children.map((child) => renderNode(child, level + 1))}
          </Box>
        )}
      </Box>
    )
  }

  const renderNeo4jNodeWithUpload = (node: FileStructure, level: number = 0): React.ReactNode => {
    const isDirectory = node.type === 'directory'
    const Icon = isDirectory ? FolderOpenIcon : InsertDriveFileIcon
    const stableId = buildStableId(node)
    const isSelected = selectedForRag[stableId] || false
    const ragStatus = ragStatuses[stableId] || 'none'

    const getRagStatusBadge = () => {
      if (ragStatus === 'complete') {
        return <Chip label="RAG" size="small" color="success" />
      } else if (ragStatus === 'partial') {
        return <Chip label="RAG Partial" size="small" color="warning" />
      } else if (ragStatus === 'none') {
        return <Chip label="Pending RAG" size="small" color="error" />
      }
      return <Chip label="RAG Error" size="small" />
    }

    return (
      <Box key={node.id} sx={{ ml: level * 2, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ fontSize: 16, color: isDirectory ? 'primary.main' : 'text.secondary' }} />
            <Typography variant="body2">{node.name}</Typography>
            {node.size && <Chip label={formatBytes(node.size)} size="small" variant="outlined" />}
          </Box>
          {isDirectory ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelection(node)}
                    size="small"
                  />
                }
                label="Select"
                sx={{ m: 0 }}
              />
              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadIcon />}
                onClick={() => handleUploadDirectory(node)}
                disabled={
                  !getDescendantFileIds(node).some((id) => selectedForRag[id]) ||
                  (uploadProgress.total > 0 && uploadProgress.done < uploadProgress.total)
                }
              >
                {uploadProgress.total > 0 && uploadProgress.done < uploadProgress.total
                  ? `Uploading ${uploadProgress.done}/${uploadProgress.total}`
                  : 'Upload'}
              </Button>
              {uploadStatus[node.fullPath || node.id] && (
                <Typography variant="caption" color="text.secondary">
                  {uploadStatus[node.fullPath || node.id]}
                </Typography>
              )}
            </Box>
          ) : (
            <Box>
              {ragStatus === 'none' ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelection(node)}
                      size="small"
                    />
                  }
                  label="Select"
                  sx={{ m: 0 }}
                />
              ) : (
                getRagStatusBadge()
              )}
            </Box>
          )}
        </Box>
        {node.children && node.children.length > 0 && (
          <Box sx={{ ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
            {node.children.map((child) => renderNeo4jNodeWithUpload(child, level + 1))}
          </Box>
        )}
      </Box>
    )
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

      <Grid container spacing={3}>
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

      {/* Directory Structures */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Directory Structure (Scanned)</Typography>
                <Chip label="LOCAL" size="small" />
              </Box>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                {scanResults?.data ? (
                  renderNode(scanResults.data)
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <DatabaseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      No scan results available
                    </Typography>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Directory Structure (Neo4j)</Typography>
                <Chip label="NEO4J DB" size="small" color="primary" />
                {isLoadingNeo4jStructure && <CircularProgress size={20} />}
              </Box>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
                {neo4jDirectoryStructure ? (
                  renderNeo4jNodeWithUpload(neo4jDirectoryStructure)
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <DatabaseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">
                      Directory not found in Neo4j
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Store the directory to Neo4j to see it here
                    </Typography>
                  </Box>
                )}
              </Paper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
