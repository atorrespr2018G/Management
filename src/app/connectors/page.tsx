'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { createConnectorConfig } from '@/services/neo4jApi'
import { useMachineId } from '@/hooks/useMachineId'
import {
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Folder as FolderIcon,
  CloudQueue as CloudQueueIcon,
  FolderShared as FolderSharedIcon,
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Dns as DnsIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon,
} from '@mui/icons-material'

interface Connector {
  name: string
  icon: React.ReactNode
}

const connectors: Connector[] = [
  { name: 'Google Drive', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Microsoft SharePoint', icon: <FolderSharedIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'OneDrive', icon: <CloudQueueIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Dropbox', icon: <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Amazon S3', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Azure Blob Storage', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'iCloud Drive', icon: <CloudDownloadIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'pCloud', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'File System / Local Directory', icon: <FolderIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'FTP / SFTP', icon: <DnsIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Network Attached Storage (NAS)', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Confluence', icon: <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Slab', icon: <ArticleIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
]

export default function ConnectorsPage() {
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [directoryPath, setDirectoryPath] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { machineId } = useMachineId()

  const handleCardClick = (connector: Connector) => {
    setSelectedConnector(connector)
    setDialogOpen(true)
    setDirectoryPath('')
    setError(null)
    setSuccess(false)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedConnector(null)
    setDirectoryPath('')
    setError(null)
    setSuccess(false)
  }

  const handleSave = async () => {
    if (!selectedConnector) return

    // For File System / Local Directory, require directory path
    if (selectedConnector.name === 'File System / Local Directory') {
      if (!directoryPath.trim()) {
        setError('Directory path is required')
        return
      }
      if (!machineId) {
        setError('Machine ID not found. Please refresh the page.')
        return
      }

      setSaving(true)
      setError(null)
      setSuccess(false)

      try {
        // Extract name from directory path (use the last folder name or the full path)
        const pathParts = directoryPath.trim().split(/[/\\]/).filter(Boolean)
        const configName = pathParts.length > 0 ? pathParts[pathParts.length - 1] : directoryPath.trim()

        await createConnectorConfig({
          connector_type: 'file_system',
          name: configName,
          directory_path: directoryPath.trim(),
          machine_id: machineId,
          metadata: {},
        })
        setSuccess(true)
        setTimeout(() => {
          handleClose()
        }, 1500)
      } catch (err: any) {
        setError(err.message || 'Failed to save connector configuration')
      } finally {
        setSaving(false)
      }
    } else {
      // For other connectors, just close (placeholder for future implementation)
      handleClose()
    }
  }

  const isFileSystem = selectedConnector?.name === 'File System / Local Directory'

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Connectors
        </Typography>

        <Grid container spacing={4}>
          {connectors.map((connector) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={connector.name}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 400, mx: 'auto' }}>
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => handleCardClick(connector)}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: 240,
                      p: 3,
                    }}
                  >
                    <Box sx={{ mb: 3 }}>{connector.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem' }}>
                      {connector.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Connector Modal */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '40vw',
            maxWidth: '800px',
            height: '40vh',
            maxHeight: '600px',
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedConnector?.icon}
            <Typography variant="h5">{selectedConnector?.name}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isFileSystem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Directory Path"
                value={directoryPath}
                onChange={(e) => setDirectoryPath(e.target.value)}
                placeholder="e.g., C:\\Users\\Documents or D:\\Projects"
                required
                helperText="Enter the full path to the directory you want to configure"
              />
              {error && (
                <Alert severity="error" onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success">
                  Connector configuration saved successfully! This directory will now appear in Data Source.
                </Alert>
              )}
            </Box>
          ) : (
            <Typography variant="body1">
              Configure your {selectedConnector?.name} connector settings here.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (isFileSystem && !directoryPath.trim())}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

