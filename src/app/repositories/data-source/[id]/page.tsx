'use client'

import React, { useState, useEffect, Fragment } from 'react'
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
  CircularProgress,
  Alert,
  Divider,
  Chip,
  Tabs,
  Tab,
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
import { TimedAlert } from '@/components/TimedAlert'

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
  const [allPathResults, setAllPathResults] = useState<Map<string, { path: ConnectorPath; data: FileStructure; results: { totalFiles: number; totalFolders: number; source?: string } }>>(new Map())
  const [currentTab, setCurrentTab] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [scanningAll, setScanningAll] = useState(false)

  useEffect(() => {
    if (configId) {
      loadData()
    }
  }, [configId])

  // Auto-scan all paths when switching to "All Results" tab
  useEffect(() => {
    if (currentTab === 1 && paths.length > 0) {
      const unscannedPaths = paths.filter(path => !allPathResults.has(path.id))
      if (unscannedPaths.length > 0) {
        scanAllPaths()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab])

  const scanAllPaths = async () => {
    // Find paths that haven't been scanned yet
    const unscannedPaths = paths.filter(path => !allPathResults.has(path.id))

    if (unscannedPaths.length === 0) {
      return // All paths already scanned
    }

    setScanningAll(true)
    setError(null)

    // Scan all unscanned paths
    for (const path of unscannedPaths) {
      try {
        const response = await fetch('/api/local/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ directoryPath: path.path }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to scan directory' }))
          console.error(`Failed to scan ${path.path}:`, errorData.error || 'Failed to scan directory')
          continue // Continue with next path even if this one fails
        }

        const scanDataResponse = await response.json()
        const results = {
          totalFiles: scanDataResponse.totalFiles || 0,
          totalFolders: scanDataResponse.totalFolders || 0,
          data: scanDataResponse.data,
          source: scanDataResponse.metadata?.source || 'local',
        }

        // Store results for this path
        setAllPathResults(prev => {
          const updated = new Map(prev)
          updated.set(path.id, {
            path,
            data: scanDataResponse.data,
            results: {
              totalFiles: results.totalFiles,
              totalFolders: results.totalFolders,
              source: results.source,
            }
          })
          return updated
        })
      } catch (scanErr: any) {
        console.error(`Error scanning ${path.path}:`, scanErr)
        // Continue with next path even if this one fails
      }
    }

    setScanningAll(false)
  }

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

      // Find the newly added path
      const newPathEntry = updatedPaths.find(p => p.path === pathToScan)

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
        const results = {
          totalFiles: scanDataResponse.totalFiles || 0,
          totalFolders: scanDataResponse.totalFolders || 0,
          data: scanDataResponse.data,
          source: scanDataResponse.metadata?.source || 'local',
        }
        setScanData(scanDataResponse.data)
        setScanResults(results)

        // Store results for the newly added path
        if (newPathEntry) {
          setAllPathResults(prev => {
            const updated = new Map(prev)
            updated.set(newPathEntry.id, {
              path: newPathEntry,
              data: scanDataResponse.data,
              results: {
                totalFiles: results.totalFiles,
                totalFolders: results.totalFolders,
                source: results.source,
              }
            })
            return updated
          })
        }

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
      // Remove from allPathResults
      setAllPathResults(prev => {
        const updated = new Map(prev)
        updated.delete(pathId)
        return updated
      })
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
      const results = {
        totalFiles: scanDataResponse.totalFiles || 0,
        totalFolders: scanDataResponse.totalFolders || 0,
        data: scanDataResponse.data,
        source: scanDataResponse.metadata?.source || 'local',
      }
      setScanData(scanDataResponse.data)
      setScanResults(results)

      // Store results for this path in allPathResults
      setAllPathResults(prev => {
        const updated = new Map(prev)
        updated.set(path.id, {
          path,
          data: scanDataResponse.data,
          results: {
            totalFiles: results.totalFiles,
            totalFolders: results.totalFolders,
            source: results.source,
          }
        })
        return updated
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
          {/* <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Add Directory Path
          </Typography> */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              gap: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Add Directory Path
            </Typography>

            {success && (
              <TimedAlert
                message="Path added and scanned successfully!"
                severity="success"
                durationMs={40000}
                onClose={() => setSuccess(false)}
                sx={{ mb: 0, px: 1.5, py: 0.25, '& .MuiAlert-message': { px: 0.5 } }}
              />
            )}
            {error && (
              <TimedAlert
                message={error}
                severity="error"
                onClose={() => setError(null)}
                sx={{ mb: 0, px: 1.5, py: 0.25, '& .MuiAlert-message': { px: 0.5 } }}
              />
            )}
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'row' }}>
            <TextField
              fullWidth
              label="Directory Path"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="e.g., C:\\Users\\Documents\\Subfolder or D:\\Projects\\Folder"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !saving && !scanning) {
                  handleAddPath();
                }
              }}
            />

            <Button
              variant="contained"
              startIcon={saving || scanning ? <CircularProgress size={20} /> : <AddIcon />}
              onClick={handleAddPath}
              disabled={saving || scanning || !newPath.trim()
                // || !newPath.includes('C:\\') || !newPath.includes('D:\\')
              }
              sx={{ minWidth: 120, ml: 2, alignSelf: 'stretch' }}
            >
              <Typography sx={{ whiteSpace: 'nowrap' }}>
                {scanning ? 'Scanning...' : (saving ? 'Adding...' : 'Add & Scan')}
              </Typography>
            </Button>
          </Box>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 0.5, pl: 1 }}
          >
            Enter the full path to a directory you want to add
          </Typography>

        </Paper>

        {/* Tabs Section */}
        <Paper sx={{ mb: 0, borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
          <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)}>
            <Tab label={`Paths (${paths.length})`} />
            <Tab label={`All Results ${(allPathResults?.size > 1) ? `(${allPathResults.size})` : ''}`} />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        {currentTab === 0 && (
          <>
            {/* Paths List */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 0 }}>
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
                    <Fragment key={path.id}>
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
                    </Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {/* Scan Results Section for Selected Path - Using RAG component */}
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
          </>
        )}

        {currentTab === 1 && (
          <Box>
            {scanningAll && (
              <Paper sx={{ p: 4, textAlign: 'center', mb: 3 }}>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Scanning all paths...
                </Typography>
              </Paper>
            )}
            {!scanningAll && allPathResults.size === 0 && paths.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No paths configured
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Add a path above to get started
                </Typography>
              </Paper>
            ) : !scanningAll && allPathResults.size === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <FolderIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  No scan results yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Scanning paths...
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', }}>
                {Array.from(allPathResults.values()).map((pathResult, index) => (
                  <Box key={pathResult.path.id}>
                    <Paper sx={{ p: 2, borderRadius: 0, bgcolor: 'primary.dark', color: 'primary.contrastText' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {`${index + 1}. ${pathResult.path.name}`}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {pathResult.path.path}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Chip
                          label={`Files: ${pathResult.results.totalFiles}`}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                        <Chip
                          label={`Folders: ${pathResult.results.totalFolders}`}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                      </Box>
                    </Paper>
                    <ScanResultsDisplay
                      scanResults={{
                        data: pathResult.data,
                        totalFiles: pathResult.results.totalFiles,
                        totalFolders: pathResult.results.totalFolders,
                        source: pathResult.results.source || 'local',
                        metadata: { source: pathResult.results.source || 'local' },
                      }}
                      sx={(allPathResults?.size < index + 1)
                        ? { borderRadius: 0 }
                        : { borderRadius: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }
                      }
                      areActionsEnabled={scanData?.fullPath === pathResult.data.fullPath}
                    />
                    {/* {index < allPathResults.size - 1 && <Divider sx={{ my: 4 }} />} */}
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}

