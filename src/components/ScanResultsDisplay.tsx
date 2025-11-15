'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Grid,
  Chip,
  IconButton,
  Checkbox,
  FormControlLabel,
  TextField,
  Divider,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FolderOpenIcon from '@mui/icons-material/FolderOpen'
import FileIcon from '@mui/icons-material/InsertDriveFile'
import DatabaseIcon from '@mui/icons-material/Storage'
import UploadIcon from '@mui/icons-material/Upload'
import NetworkIcon from '@mui/icons-material/AccountTree'
import { formatBytes } from '@/utils/formatters'
import {
  storeInNeo4j,
  getNeo4jStats,
  checkNeo4jHealth,
  getDirectoryFromNeo4j,
  uploadFilesBatch,
  getFileRagStatus,
  createSemanticRelationships,
} from '@/services/neo4jApi'
import { useMachineId } from '@/hooks/useMachineId'
import type { FileStructure } from '@/types/neo4j'

interface ScanResults {
  data: FileStructure
  totalFiles?: number
  totalFolders?: number
  source?: string
  metadata?: Record<string, any>
}

interface ScanResultsDisplayProps {
  scanResults: ScanResults
  showActionButtons?: boolean
  onClearResults?: () => void
  onScanAgain?: () => void
}

export default function ScanResultsDisplay({
  scanResults,
  showActionButtons = false,
  onClearResults,
  onScanAgain,
}: ScanResultsDisplayProps) {
  const { machineId } = useMachineId()
  
  const [copied, setCopied] = useState(false)
  const [neo4jStatus, setNeo4jStatus] = useState<any>(null)
  const [isStoring, setIsStoring] = useState(false)
  const [storeMessage, setStoreMessage] = useState('')
  const [neo4jDirectoryStructure, setNeo4jDirectoryStructure] = useState<FileStructure | null>(null)
  const [isLoadingNeo4jStructure, setIsLoadingNeo4jStructure] = useState(false)
  const [selectedForRag, setSelectedForRag] = useState<Record<string, boolean>>({})
  const [ragStatuses, setRagStatuses] = useState<Record<string, 'complete' | 'partial' | 'none'>>({})
  const [uploadStatus, setUploadStatus] = useState<Record<string, string>>({})
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0, totalChunks: 0 })
  const [relationshipSettings, setRelationshipSettings] = useState({
    similarity_threshold: 0.7,
    top_k: 10,
    same_directory_only: false,
    same_document_only: false,
  })
  const [isCreatingRelationships, setIsCreatingRelationships] = useState(false)
  const [relationshipStatus, setRelationshipStatus] = useState<Record<string, string>>({})

  useEffect(() => {
    if (scanResults?.data && machineId) {
      fetchNeo4jStructure()
    }
  }, [scanResults?.data?.fullPath, machineId])

  const fetchNeo4jStructure = async () => {
    if (!scanResults?.data || !machineId) return

    try {
      setIsLoadingNeo4jStructure(true)
      const rootFullPath = scanResults.data.fullPath || ''
      if (!rootFullPath) return

      const result = await getDirectoryFromNeo4j(machineId, rootFullPath)
      if (result.found && result.structure) {
        setNeo4jDirectoryStructure(result.structure)

        // Fetch RAG statuses for all files
        const fetchRagStatuses = async (node: FileStructure) => {
          if (node.type === 'file') {
            const fileKey = buildStableId(machineId, node)
            try {
              const status = await getFileRagStatus(machineId, node.fullPath || node.id)
              setRagStatuses(prev => ({ ...prev, [fileKey]: status.status }))
            } catch (error) {
              console.error(`Error fetching RAG status for ${node.fullPath}:`, error)
              setRagStatuses(prev => ({ ...prev, [fileKey]: 'none' }))
            }
          }
          if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
              await fetchRagStatuses(child)
            }
          }
        }

        // Clear existing state
        setRagStatuses({})
        setSelectedForRag({})

        // Fetch RAG statuses for all files
        await fetchRagStatuses(result.structure)
      }
    } catch (error) {
      console.error('Error fetching Neo4j structure:', error)
    } finally {
      setIsLoadingNeo4jStructure(false)
    }
  }

  const handleCopy = () => {
    const dataStr = JSON.stringify(scanResults.data, null, 2)
    navigator.clipboard.writeText(dataStr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    const dataStr = JSON.stringify(scanResults.data, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scan-results-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleStoreInNeo4j = async () => {
    if (!machineId) {
      setStoreMessage('Error: Machine ID not found')
      return
    }

    try {
      setIsStoring(true)
      setStoreMessage('Storing directory in Neo4j…')

      const health = await checkNeo4jHealth()
      if (!health.neo4j_connected) {
        setStoreMessage('❌ Neo4j database is not connected')
        setIsStoring(false)
        return
      }

      const result = await storeInNeo4j(
        scanResults.data,
        scanResults.metadata || {},
        {},
        machineId,
        true // metadata only for now
      )

      setStoreMessage('✅ Directory stored in Neo4j (metadata only).')
      const stats = await getNeo4jStats()
      setNeo4jStatus(stats)
      
      // Refresh structure with RAG statuses
      await new Promise(resolve => setTimeout(resolve, 500))
      await fetchNeo4jStructure()
    } catch (error) {
      setStoreMessage(`❌ Error storing in Neo4j: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsStoring(false)
    }
  }

  // Helper to build stable ID for files and folders
  const buildStableId = (machineId: string, node: FileStructure): string => {
    return `${machineId}:${node.fullPath || node.id}`
  }

  // Get all descendant file IDs (recursive)
  const getDescendantFileIds = (node: FileStructure, machineId: string): string[] => {
    const ids: string[] = []
    if (node.type === 'file') {
      ids.push(buildStableId(machineId, node))
    }
    if (node.children) {
      node.children.forEach(child => {
        ids.push(...getDescendantFileIds(child, machineId))
      })
    }
    return ids
  }

  // Toggle selection for a node (recursive for folders)
  const toggleSelection = (node: FileStructure, machineId: string) => {
    const stableId = buildStableId(machineId, node)
    const isSelected = selectedForRag[stableId] || false
    const newSelected = !isSelected

    setSelectedForRag(prev => {
      const next = { ...prev }

      if (node.type === 'directory') {
        // For folders, select/deselect all descendants
        const descendantIds = getDescendantFileIds(node, machineId)
        descendantIds.forEach(id => {
          next[id] = newSelected
        })
        // Also select the folder itself
        next[stableId] = newSelected
      } else {
        // For files, just toggle
        next[stableId] = newSelected
      }

      return next
    })
  }

  const handleCreateSemanticRelationships = async (directoryNode: FileStructure) => {
    if (!machineId) {
      setRelationshipStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found' }))
      return
    }

    try {
      setIsCreatingRelationships(true)
      const directoryPath = directoryNode.fullPath || directoryNode.id
      setRelationshipStatus(prev => ({ ...prev, [directoryPath]: 'Creating relationships...' }))

      const res = await createSemanticRelationships(machineId, directoryPath, {
        similarity_threshold: relationshipSettings.similarity_threshold,
        top_k: relationshipSettings.top_k || null,
        same_directory_only: relationshipSettings.same_directory_only,
        same_document_only: relationshipSettings.same_document_only,
      })

      // Handle response - backend returns {message, result, timestamp}
      const result = res.result || res.summary || res
      const createdRelationships = result.created_relationships || 0
      const processedChunks = result.processed_chunks || 0

      setRelationshipStatus(prev => ({
        ...prev,
        [directoryPath]: `Created ${createdRelationships} relationships from ${processedChunks} chunks`,
      }))
    } catch (e: any) {
      setRelationshipStatus(prev => ({
        ...prev,
        [directoryNode.fullPath || directoryNode.id]: `Error: ${e.response?.data?.detail || e.message}`,
      }))
    } finally {
      setIsCreatingRelationships(false)
    }
  }

  const handleCheckNeo4jConnection = async () => {
    try {
      const health = await checkNeo4jHealth()
      setNeo4jStatus(health)

      if (health.neo4j_connected) {
        const stats = await getNeo4jStats()
        setNeo4jStatus(stats)
      }
    } catch (error) {
      setNeo4jStatus({ status: 'unhealthy', neo4j_connected: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const handleUploadDirectory = async (directoryNode: FileStructure) => {
    if (!machineId) {
      setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found' }))
      return
    }

    // Build flat list of all selected FILES (expand folders to their file descendants)
    const getSelectedFiles = (node: FileStructure): string[] => {
      const files: string[] = []
      const stableId = buildStableId(machineId, node)

      if (node.type === 'file' && selectedForRag[stableId]) {
        files.push(node.fullPath || node.id)
      }

      if (node.children) {
        node.children.forEach(child => {
          files.push(...getSelectedFiles(child))
        })
      }

      return files
    }

    const selectedFiles = getSelectedFiles(directoryNode)

    if (selectedFiles.length === 0) {
      setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'No files selected' }))
      return
    }

    // Initialize progress
    setUploadProgress({ done: 0, total: selectedFiles.length, totalChunks: 0 })
    setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'Uploading...' }))

    // Process files in batches (batch size: 7)
    const BATCH_SIZE = 7
    let totalChunks = 0
    let processed = 0
    const allErrors: string[] = []

    try {
      for (let i = 0; i < selectedFiles.length; i += BATCH_SIZE) {
        const batch = selectedFiles.slice(i, i + BATCH_SIZE)

        try {
          console.log(`Uploading batch ${i / BATCH_SIZE + 1}:`, batch)
          const result = await uploadFilesBatch(machineId, batch)
          console.log('Upload result:', result)
          
          totalChunks += result.created_chunks || 0
          processed += result.processed_files || 0

          // Collect errors if any
          if (result.errors && result.errors.length > 0) {
            console.error('Upload errors:', result.errors)
            result.errors.forEach((err: any) => {
              const errorMsg = `${err.file_path}: ${err.error}`
              console.error(errorMsg)
              allErrors.push(errorMsg)
            })
          }

          setUploadProgress({
            done: processed,
            total: selectedFiles.length,
            totalChunks: totalChunks
          })
        } catch (error) {
          console.error(`Error processing batch ${i / BATCH_SIZE + 1}:`, error)
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          allErrors.push(`Batch ${i / BATCH_SIZE + 1}: ${errorMessage}`)
        }
      }

      // Update status with total chunks and any errors
      let statusMessage = ''
      if (totalChunks === 0 && processed === 0) {
        if (allErrors.length > 0) {
          statusMessage = `No chunks created. Errors: ${allErrors.slice(0, 3).join('; ')}${allErrors.length > 3 ? '...' : ''}`
        } else {
          statusMessage = 'No chunks created. Make sure files are stored in Neo4j first (click "Store in Neo4j" button) and file paths are correct.'
        }
      } else {
        statusMessage = `Uploaded: ${totalChunks} chunks from ${processed} files`
        if (allErrors.length > 0) {
          statusMessage += `. ${allErrors.length} error(s): ${allErrors.slice(0, 2).join('; ')}${allErrors.length > 2 ? '...' : ''}`
        }
      }
      setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: statusMessage }))
      setUploadProgress({ done: 0, total: 0, totalChunks: 0 })

      // Refresh Neo4j structure to reflect which files now have RAG
      await fetchNeo4jStructure()

      // Clear selections after successful upload
      setSelectedForRag({})
    } catch (e: any) {
      setUploadStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: `Error: ${e.response?.data?.detail || e.message}` }))
      setUploadProgress({ done: 0, total: 0, totalChunks: 0 })
    }
  }

  const renderDirectoryTree = (node: FileStructure, level: number = 0): React.ReactNode => {
    const isDirectory = node.type === 'directory'
    const Icon = isDirectory ? FolderOpenIcon : FileIcon

    // Sort children: directories first, then files, both alphabetically
    const sortedChildren = node.children ? [...node.children].sort((a, b) => {
      // Directories come before files
      if (a.type === 'directory' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'directory') return 1
      // Within same type, sort alphabetically by name
      return a.name.localeCompare(b.name)
    }) : []

    return (
      <Box key={node.id} sx={{ ml: level * 2, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: 32 }}>
          <Icon sx={{ fontSize: 16, color: isDirectory ? 'primary.main' : 'text.secondary' }} />
          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{node.name}</Typography>
          {node.size && (
            <Chip label={formatBytes(node.size)} size="small" variant="outlined" />
          )}
        </Box>
        {sortedChildren.length > 0 && (
          <Box sx={{ ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
            {sortedChildren.map((child) => renderDirectoryTree(child, level + 1))}
          </Box>
        )}
      </Box>
    )
  }

  const renderNeo4jNodeWithUpload = (node: FileStructure, level: number = 0): React.ReactNode => {
    const isDirectory = node.type === 'directory'
    const Icon = isDirectory ? FolderOpenIcon : FileIcon
    const stableId = buildStableId(machineId || '', node)
    const isSelected = selectedForRag[stableId] || false
    const ragStatus = ragStatuses[stableId] || 'none'

    // Get RAG status badge
    const getRagStatusBadge = () => {
      if (ragStatus === 'complete') {
        return <Chip label="RAG" size="small" color="success" />
      } else if (ragStatus === 'partial') {
        return <Chip label="RAG Partial" size="small" color="warning" />
      } else {
        return null
      }
    }

    // Sort children: directories first, then files, both alphabetically (same as scanned tree)
    const sortedChildren = node.children ? [...node.children].sort((a, b) => {
      // Directories come before files
      if (a.type === 'directory' && b.type === 'file') return -1
      if (a.type === 'file' && b.type === 'directory') return 1
      // Within same type, sort alphabetically by name
      return a.name.localeCompare(b.name)
    }) : []

    return (
      <Box key={node.id} sx={{ ml: level * 2, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, minHeight: 32 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Icon sx={{ fontSize: 16, color: isDirectory ? 'primary.main' : 'text.secondary' }} />
            <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{node.name}</Typography>
            {node.size && (
              <Chip label={formatBytes(node.size)} size="small" variant="outlined" />
            )}
          </Box>
          {isDirectory ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleSelection(node, machineId || '')}
                    size="small"
                  />
                }
                label="Select"
                sx={{ m: 0 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleUploadDirectory(node)}
                disabled={
                  (() => {
                    const hasSelectedFiles = getDescendantFileIds(node, machineId || '').some(id => selectedForRag[id])
                    return !hasSelectedFiles || (uploadProgress.total > 0 && uploadProgress.done < uploadProgress.total)
                  })()
                }
                startIcon={uploadProgress.total > 0 && uploadProgress.done < uploadProgress.total ? <CircularProgress size={16} /> : <UploadIcon />}
              >
                {uploadProgress.total > 0 && uploadProgress.done < uploadProgress.total
                  ? `Uploading… ${uploadProgress.done}/${uploadProgress.total}`
                  : 'Upload Documents'}
              </Button>
              {uploadStatus[node.fullPath || node.id] && (
                <Typography variant="caption" color="text.secondary">
                  {uploadStatus[node.fullPath || node.id]}
                </Typography>
              )}
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {ragStatus === 'none' ? (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelection(node, machineId || '')}
                      size="small"
                    />
                  }
                  label="Not RAG"
                  sx={{ m: 0 }}
                />
              ) : (
                getRagStatusBadge()
              )}
            </Box>
          )}
        </Box>
        {sortedChildren.length > 0 && (
          <Box sx={{ ml: 2, borderLeft: '1px solid', borderColor: 'divider', pl: 1 }}>
            {sortedChildren.map((child) => renderNeo4jNodeWithUpload(child, level + 1))}
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Scan Results
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Source: {scanResults.source || 'local'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy JSON'}
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
          >
            Download JSON
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'primary.50', background: 'linear-gradient(to bottom right, #e3f2fd, #bbdefb)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Files
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'primary.700' }}>
                {scanResults.totalFiles || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'success.50', background: 'linear-gradient(to bottom right, #e8f5e9, #c8e6c9)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Total Folders
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'success.700' }}>
                {scanResults.totalFolders || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ bgcolor: 'info.50', background: 'linear-gradient(to bottom right, #e1f5fe, #b3e5fc)' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Source Type
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'info.700', textTransform: 'capitalize' }}>
                {scanResults.source || 'Local'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Directory Structures - Side by Side */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Scanned Directory */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Directory Structure (Scanned)</Typography>
                  <Chip label="LOCAL" size="small" sx={{ bgcolor: 'grey.200', color: 'grey.700' }} />
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleStoreInNeo4j}
                    disabled={isStoring || !machineId}
                    startIcon={isStoring ? <CircularProgress size={16} /> : <DatabaseIcon />}
                  >
                    {isStoring ? 'Storing...' : 'Store in Neo4j'}
                  </Button>
                  <IconButton onClick={handleCopy} size="small">
                    <ContentCopyIcon />
                  </IconButton>
                  <IconButton onClick={handleDownload} size="small">
                    <DownloadIcon />
                  </IconButton>
                </Box>
              </Box>
              {copied && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Copied to clipboard!
                </Alert>
              )}
              {storeMessage && (
                <Alert severity={storeMessage.includes('❌') ? 'error' : 'success'} sx={{ mb: 2 }}>
                  {storeMessage}
                </Alert>
              )}
              <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400, maxHeight: 400, overflow: 'auto', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ pt: 0 }}>
                  {renderDirectoryTree(scanResults.data)}
                </Box>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Neo4j Directory */}
        <Grid item xs={12} md={6}>
          <Card sx={{ bgcolor: 'info.50', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6">Directory Structure (Neo4j)</Typography>
                  <Chip label="NEO4J DB" size="small" sx={{ bgcolor: 'info.200', color: 'info.700' }} />
                  {isLoadingNeo4jStructure && (
                    <Typography variant="caption" color="text.secondary">
                      Loading...
                    </Typography>
                  )}
                </Box>
                <DatabaseIcon color="primary" />
              </Box>

              {isLoadingNeo4jStructure ? (
                <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400, maxHeight: 400, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <CircularProgress />
                </Paper>
              ) : neo4jDirectoryStructure ? (
                <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400, maxHeight: 400, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ pt: 0 }}>
                    {renderNeo4jNodeWithUpload(neo4jDirectoryStructure)}
                  </Box>
                </Paper>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, flex: 1, minHeight: 400, maxHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <DatabaseIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Directory not found in Neo4j
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Store the directory to Neo4j to see it here
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Semantic Relationships Section */}
      {neo4jDirectoryStructure && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Create Semantic Relationships
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Similarity Threshold (0.0 - 1.0)"
                  type="number"
                  inputProps={{ min: 0, max: 1, step: 0.1 }}
                  value={relationshipSettings.similarity_threshold}
                  onChange={(e) =>
                    setRelationshipSettings(prev => ({
                      ...prev,
                      similarity_threshold: parseFloat(e.target.value) || 0.7,
                    }))
                  }
                  helperText="Only chunks with similarity ≥ this value will be connected"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Top-K Connections (optional)"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={relationshipSettings.top_k || ''}
                  onChange={(e) =>
                    setRelationshipSettings(prev => ({
                      ...prev,
                      top_k: e.target.value ? parseInt(e.target.value) : null,
                    }))
                  }
                  placeholder="No limit"
                  helperText="Maximum relationships per chunk (leave empty for no limit)"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={relationshipSettings.same_directory_only}
                        onChange={(e) =>
                          setRelationshipSettings(prev => ({
                            ...prev,
                            same_directory_only: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Same Directory Only"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={relationshipSettings.same_document_only}
                        onChange={(e) =>
                          setRelationshipSettings(prev => ({
                            ...prev,
                            same_document_only: e.target.checked,
                          }))
                        }
                      />
                    }
                    label="Same Document Only"
                  />
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Create Relationships for Directory
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select a directory from the Neo4j structure above and create relationships
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    onClick={() => handleCreateSemanticRelationships(neo4jDirectoryStructure)}
                    disabled={isCreatingRelationships}
                    startIcon={isCreatingRelationships ? <CircularProgress size={20} /> : <NetworkIcon />}
                  >
                    {isCreatingRelationships ? 'Creating...' : 'Create Relationships'}
                  </Button>
                </Box>
                {relationshipStatus[neo4jDirectoryStructure.fullPath || neo4jDirectoryStructure.id] && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {relationshipStatus[neo4jDirectoryStructure.fullPath || neo4jDirectoryStructure.id]}
                  </Alert>
                )}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Neo4j Graph Database Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Neo4j Graph Database</Typography>
            <Button
              variant="outlined"
              onClick={handleCheckNeo4jConnection}
              startIcon={<UploadIcon />}
            >
              Check Connection
            </Button>
          </Box>

          {neo4jStatus ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    bgcolor: neo4jStatus.neo4j_connected ? 'success.main' : 'error.main',
                  }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {neo4jStatus.neo4j_connected ? 'Connected' : 'Disconnected'}
                </Typography>
              </Box>

              {neo4jStatus.total_nodes !== undefined && (
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Nodes
                      </Typography>
                      <Typography variant="h6">{neo4jStatus.total_nodes}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Files
                      </Typography>
                      <Typography variant="h6">{neo4jStatus.total_files}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Directories
                      </Typography>
                      <Typography variant="h6">{neo4jStatus.total_directories}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {neo4jStatus.sources && Array.isArray(neo4jStatus.sources) && neo4jStatus.sources.length > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Sources:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {neo4jStatus.sources.map((source: string, index: number) => (
                      <Chip key={index} label={source} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Click "Check Connection" to see Neo4j status
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {showActionButtons && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
          {onClearResults && (
            <Button variant="outlined" onClick={onClearResults}>
              Clear Results
            </Button>
          )}
          {onScanAgain && (
            <Button variant="contained" onClick={onScanAgain}>
              Scan Again
            </Button>
          )}
        </Box>
      )}
    </Box>
  )
}

