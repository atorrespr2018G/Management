'use client'

import { useDispatch, useSelector } from 'react-redux'
import { useNeo4jStructure } from '@/hooks/useNeo4jStructure';
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
  Stack,
} from '@mui/material'
import UploadIcon from '@mui/icons-material/Upload'
import NetworkIcon from '@mui/icons-material/AccountTree'
import { useMachineId } from '@/hooks/useMachineId'
import type { FileStructure } from '@/types/neo4j'
import { buildStableId } from '@/utils/treeHelpers'
import {
  getFileRelationshipStatus,
  createSemanticRelationships,

} from '@/services/neo4jApi'
import {
  setSelectedForGraph,
  setRelationshipSettings,
  setIsCreatingRelationships,
  setRelationshipStatus,
  setRelationshipStatusForFile,
} from '../store/slices/neoSlice';
import DirectoryStructuresPanel from './DirectoryStructuresPanel';
import { useStoreDirectoryInNeo4j } from '@/hooks/useStoreDirectoryInNeo4j';
import { ScanResultsDisplayProps } from '@/types/components';

// interface ScanResults {
//   data: FileStructure
//   totalFiles?: number
//   totalFolders?: number
//   source?: string
//   metadata?: Record<string, any>
// }

// interface ScanResultsDisplayProps {
//   scanResults: ScanResults
//   showActionButtons?: boolean
//   onClearResults?: () => void
//   onScanAgain?: () => void
// }

const ScanResultsDisplay = ({
  scanResults,
  showActionButtons = false,
  onClearResults,
  onScanAgain,
}: ScanResultsDisplayProps) => {
  const { machineId } = useMachineId()
  const dispatch = useDispatch();
  const {
    neo4jDirectoryStructure,
    selectedForGraph,
    relationshipSettings,
    isCreatingRelationships,
    relationshipStatus,
  } = useSelector((state: any) => state.neo);

  const { fetchNeo4jStructure } = useNeo4jStructure({
    machineId,
    node: scanResults?.data,
  });

  const {
    isStoring,
    storeMessage,
    neo4jStatus,
    handleStoreInNeo4j,
    checkNeo4jConnection,
  } = useStoreDirectoryInNeo4j({
    scanData: scanResults.data,
    metadata: scanResults.metadata,
    machineId,
    onAfterStore: fetchNeo4jStructure,
  });


  // Refresh relationship statuses for files in a directory
  const refreshRelationshipStatuses = async (node: FileStructure) => {
    if (!machineId) return

    const refreshForNode = async (fileNode: FileStructure) => {
      if (fileNode.type === 'file') {
        const fileKey = buildStableId(machineId, fileNode)
        try {
          const relStatus = await getFileRelationshipStatus(machineId, fileNode.fullPath || fileNode.id)
          // setRelationshipStatuses(prev => ({ ...prev, [fileKey]: relStatus.has_relationships }))
          dispatch(
            setRelationshipStatusForFile({
              fileKey,
              hasRelationships: relStatus.has_relationships
            })
          );
          // dispatch(setUploadStatus({ node, status: '' }));

        } catch (error) {
          console.error(`Error refreshing relationship status for ${fileNode.fullPath}:`, error)
          // setRelationshipStatuses(prev => ({ ...prev, [fileKey]: false }))
          dispatch(
            setRelationshipStatusForFile({
              fileKey,
              hasRelationships: false
            })
          );
        }
      }
      if (fileNode.children && Array.isArray(fileNode.children)) {
        for (const child of fileNode.children) {
          await refreshForNode(child)
        }
      }
    }

    await refreshForNode(node)
  }

  // Get all selected file IDs and their stable IDs from a directory node
  const getSelectedFileIds = (node: FileStructure): { fileId: string; stableId: string }[] => {
    const selected: { fileId: string; stableId: string }[] = []
    const traverse = (node: FileStructure) => {
      if (node.type === 'file') {
        const fileKey = buildStableId(machineId || '', node)
        if (selectedForGraph[fileKey]) {
          selected.push({ fileId: node.id, stableId: fileKey })
        }
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach(child => traverse(child))
      }
    }
    traverse(node)
    return selected
  }

  const handleCreateSemanticRelationships = async (directoryNode: FileStructure) => {
    if (!machineId) {
      // setRelationshipStatus(prev => ({ ...prev, [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found' }))
      dispatch(
        setRelationshipStatus({
          ...relationshipStatus,
          [directoryNode.fullPath || directoryNode.id]: 'Error: Machine ID not found',
        })
      );
      return
    }

    try {
      dispatch(setIsCreatingRelationships(true))
      const directoryPath = directoryNode.fullPath || directoryNode.id

      // Get selected file IDs
      const selectedFiles = getSelectedFileIds(directoryNode)

      if (selectedFiles.length === 0) {
        // setRelationshipStatus(prev => ({
        //   ...prev,
        //   [directoryPath]: 'No files selected. Click on Graph badges to select files.',
        // }))
        dispatch(
          setRelationshipStatus({
            ...relationshipStatus,
            [directoryPath]: 'No files selected. Click on Graph badges to select files.',
          })
        );
        return
      }

      // setRelationshipStatus(prev => ({ ...prev, [directoryPath]: `Creating relationships for ${selectedFiles.length} file(s)...` }))
      dispatch(
        setRelationshipStatus({
          ...relationshipStatus,
          [directoryPath]: `Creating relationships for ${selectedFiles.length} file(s)...`,
        })
      );
      let totalCreatedRelationships = 0
      let totalProcessedChunks = 0
      const errors: string[] = []

      // Process each selected file
      for (const { fileId } of selectedFiles) {
        try {
          const res = await createSemanticRelationships(machineId, directoryPath, {
            similarity_threshold: relationshipSettings.similarity_threshold,
            top_k: relationshipSettings.top_k,
            same_directory_only: relationshipSettings.same_directory_only,
            same_document_only: relationshipSettings.same_document_only,
            scope_file_id: fileId,
          })

          const result = res.result || res.summary || res
          totalCreatedRelationships += result.created_relationships || 0
          totalProcessedChunks += result.processed_chunks || 0
        } catch (e: any) {
          errors.push(`File ${fileId}: ${e.response?.data?.detail || e.message}`)
        }
      }

      // setRelationshipStatus(prev => ({
      //   ...prev,
      //   [directoryPath]: errors.length > 0
      //     ? `Created ${totalCreatedRelationships} relationships from ${totalProcessedChunks} chunks. ${errors.length} error(s): ${errors.join('; ')}`
      //     : `Created ${totalCreatedRelationships} relationships from ${totalProcessedChunks} chunks`,
      // }))
      dispatch(
        setRelationshipStatus({
          ...relationshipStatus,
          [directoryPath]: errors.length > 0
            ? `Created ${totalCreatedRelationships} relationships from ${totalProcessedChunks} chunks. ${errors.length} error(s): ${errors.join('; ')}`
            : `Created ${totalCreatedRelationships} relationships from ${totalProcessedChunks} chunks`,
        })
      );

      // Clear selections after successful creation
      console.log('selectedForGraph', selectedForGraph)
      const newSelection = { ...selectedForGraph }
      selectedFiles.forEach(({ stableId }) => {
        delete newSelection[stableId]
      })
      dispatch(setSelectedForGraph(newSelection))

      // Refresh relationship statuses for all files in the directory to update Graph badges
      await refreshRelationshipStatuses(directoryNode)
    } catch (e: any) {
      // setRelationshipStatus(prev => ({
      //   ...prev,
      //   [directoryNode.fullPath || directoryNode.id]: `Error: ${e.response?.data?.detail || e.message}`,
      // }))
      dispatch(
        setRelationshipStatus({
          ...relationshipStatus,
          [directoryNode.fullPath || directoryNode.id]: `Error: ${e.response?.data?.detail || e.message}`,
        })
      );
    } finally {
      dispatch(setIsCreatingRelationships(false))
    }
  }

  // }

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
      <DirectoryStructuresPanel
        node={scanResults?.data}
        machineId={machineId}
        isStoring={isStoring}
        storeMessage={storeMessage}
        onStoreInNeo4j={handleStoreInNeo4j}
      />

      {/* Create Semantic Relationships Section - Only show when Graph badges are selected */}
      {
        neo4jDirectoryStructure && (() => {
          // Check if any files are selected for graph creation
          const hasSelectedGraph = Object.values(selectedForGraph).some(selected => selected === true)
          return hasSelectedGraph
        })() && (
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Create Graph (Semantic Relationships)
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
                      // setRelationshipSettings(prev => ({
                      //   ...prev,
                      //   similarity_threshold: parseFloat(e.target.value) || 0.7,
                      // }))
                      dispatch(
                        setRelationshipSettings({
                          similarity_threshold: parseFloat(e.target.value) || 0.7,
                        })
                      )
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
                      // setRelationshipSettings(prev => ({
                      //   ...prev,
                      //   top_k: e.target.value ? parseInt(e.target.value) : prev.top_k,
                      // }))
                      dispatch(
                        setRelationshipSettings({
                          top_k: e.target.value
                            ? parseInt(e.target.value)
                            : relationshipSettings.top_k,
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
                            // setRelationshipSettings(prev => ({
                            //   ...prev,
                            //   same_directory_only: e.target.checked,
                            // }))
                            dispatch(
                              setRelationshipSettings({
                                same_directory_only: e.target.checked,
                              })
                            )
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
                            // setRelationshipSettings(prev => ({
                            //   ...prev,
                            //   same_document_only: e.target.checked,
                            // }))
                            dispatch(
                              setRelationshipSettings({
                                same_document_only: e.target.checked,
                              })
                            )
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
                      {isCreatingRelationships ? 'Creating...' : 'Create Graph'}
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
        )
      }

      {/* Neo4j Graph Database Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Neo4j Graph Database</Typography>
            <Button
              variant="outlined"
              onClick={checkNeo4jConnection}
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
      {
        showActionButtons && (
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
        )
      }
    </Box >
  )
}
export default ScanResultsDisplay