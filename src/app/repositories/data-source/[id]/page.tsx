'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Card,
  CardContent,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import FolderIcon from '@mui/icons-material/Folder'
import {
  getConnectorConfig,
  getConnectorPaths,
  addConnectorPath,
  deleteConnectorPath,
} from '@/services/neo4jApi'
import type { ConnectorConfig, ConnectorPath } from '@/types/neo4j'
import type { FileStructure } from '@/types/neo4j'
import ScanResultsDisplay from '@/components/ScanResultsDisplay'

export default function ConnectorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const configId = params.id as string

  const [config, setConfig] = useState<ConnectorConfig | null>(null)
  const [paths, setPaths] = useState<ConnectorPath[]>([])
  const [newPath, setNewPath] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<{ totalFiles: number; totalFolders: number; data: FileStructure; source?: string } | null>(null)
  const [scanData, setScanData] = useState<FileStructure | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (configId) {
      loadData()
    }
  }, [configId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [configData, pathsData] = await Promise.all([
        getConnectorConfig(configId),
        getConnectorPaths(configId),
      ])
      setConfig(configData)
      setPaths(pathsData)
    } catch (error) {
      console.error('Failed to load connector data:', error)
      setError('Failed to load connector configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPath = async () => {
    if (!newPath.trim()) {
      setError('Directory path is required')
      return
    }

    setSaving(true)
    setScanning(false)
    setError(null)
    setSuccess(false)
    setScanResults(null)
    setScanData(null)

    try {
      // First, add the path to the connector
      await addConnectorPath(configId, {
        path: newPath.trim(),
      })
      const pathToScan = newPath.trim()
      setNewPath('')
      setSaving(false)
      
      // Reload paths to ensure we have the latest data
      const updatedPaths = await getConnectorPaths(configId)
      setPaths(updatedPaths)

      // Then scan the directory
      setScanning(true)
      try {
        const response = await fetch('/api/local/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directoryPath: pathToScan }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to scan directory' }))
          throw new Error(errorData.error || 'Failed to scan directory')
        }

        const scanDataResponse = await response.json()
        setScanData(scanDataResponse.data)
        setScanResults({
          totalFiles: scanDataResponse.totalFiles || 0,
          totalFolders: scanDataResponse.totalFolders || 0,
          data: scanDataResponse.data,
          source: scanDataResponse.metadata?.source || 'local',
        })
        setSuccess(true)
      } catch (scanErr: any) {
        console.error('Scan error:', scanErr)
        // Path was added successfully, but scan failed - show warning
        setError(`Path added, but scan failed: ${scanErr.message}`)
        setSuccess(true) // Still show success for adding the path
      } finally {
        setScanning(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add path')
      setSaving(false)
    }
  }

  const handleDeletePath = async (pathId: string) => {
    if (!confirm('Are you sure you want to delete this path?')) {
      return
    }

    try {
      await deleteConnectorPath(configId, pathId)
      // Reload paths to ensure we have the latest data
      const updatedPaths = await getConnectorPaths(configId)
      setPaths(updatedPaths)
      // Clear scan data if the deleted path was the one being displayed
      if (selectedPathId === pathId) {
        setScanData(null)
        setScanResults(null)
        setSelectedPathId(null)
      }
    } catch (error: any) {
      console.error('Failed to delete path:', error)
      alert(`Failed to delete path: ${error.message || 'Unknown error'}`)
    }
  }

  const handlePathClick = async (path: ConnectorPath) => {
    setSelectedPathId(path.id)
    setScanning(true)
    setError(null)
    setSuccess(false)
    setScanData(null)
    setScanResults(null)

    try {
      const response = await fetch('/api/local/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryPath: path.path }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to scan directory' }))
        throw new Error(errorData.error || 'Failed to scan directory')
      }

      const scanDataResponse = await response.json()
      setScanData(scanDataResponse.data)
      setScanResults({
        totalFiles: scanDataResponse.totalFiles || 0,
        totalFolders: scanDataResponse.totalFolders || 0,
        data: scanDataResponse.data,
        source: scanDataResponse.metadata?.source || 'local',
      })
      setSuccess(true)
    } catch (scanErr: any) {
      console.error('Scan error:', scanErr)
      setError(`Failed to scan directory: ${scanErr.message}`)
    } finally {
      setScanning(false)
    }
  }


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!config) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Connector configuration not found</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/repositories/data-source')} sx={{ mt: 2 }}>
          Back to Data Source
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => router.push('/repositories/data-source')}>
            <ArrowBackIcon />
          </IconButton>
          <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            {config.name}
          </Typography>
          <Chip label={config.connector_type} size="small" color="primary" variant="outlined" />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Add New Path Section */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Add Directory Path
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <TextField
              fullWidth
              label="Directory Path"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="e.g., C:\\Users\\Documents\\Subfolder or D:\\Projects\\Folder"
              helperText="Enter the full path to a directory you want to add"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !saving && !scanning) {
                  handleAddPath()
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={saving || scanning ? <CircularProgress size={20} /> : <AddIcon />}
              onClick={handleAddPath}
              disabled={saving || scanning || !newPath.trim()}
              sx={{ minWidth: 120 }}
            >
              {scanning ? 'Scanning...' : saving ? 'Adding...' : 'Add & Scan'}
            </Button>
          </Box>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Path added and scanned successfully!
            </Alert>
          )}
        </Paper>

        {/* Paths List */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Configured Paths ({paths.length})
          </Typography>
          {paths.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                No paths configured yet. Add a path above to get started.
              </Typography>
            </Box>
          ) : (
            <List>
              {paths.map((path, index) => (
                <React.Fragment key={path.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePath(path.id)
                        }}
                        color="error"
                        sx={{ mr: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => handlePathClick(path)}
                      selected={selectedPathId === path.id}
                      disabled={scanning}
                    >
                      <ListItemText
                        primary={path.name}
                        secondary={path.path}
                        primaryTypographyProps={{ fontWeight: 500 }}
                      />
                      {scanning && selectedPathId === path.id && (
                        <CircularProgress size={20} sx={{ ml: 2 }} />
                      )}
                    </ListItemButton>
                  </ListItem>
                  {index < paths.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {/* Scan Results Section - Using RAG component */}
        {scanData && scanResults && (
          <Box sx={{ mt: 4 }}>
            <ScanResultsDisplay
              scanResults={{
                data: scanData,
                totalFiles: scanResults.totalFiles,
                totalFolders: scanResults.totalFolders,
                source: scanResults.source || 'local',
                metadata: { source: scanResults.source || 'local' },
              }}
              showActionButtons={false}
            />
          </Box>
        )}
      </Box>
    </Box>
  )
}

