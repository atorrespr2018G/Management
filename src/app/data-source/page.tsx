'use client'

import React, { useState, useEffect } from 'react'
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
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { getConnectorConfigs, deleteConnectorConfig } from '@/services/neo4jApi'
import type { ConnectorConfig } from '@/types/neo4j'
import {
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Dns as DnsIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
} from '@mui/icons-material'

interface DataSource {
  name: string
  icon: React.ReactNode
}

const dataSources: DataSource[] = [
  { name: 'MySQL', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'PostgreSQL', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Microsoft SQL Server', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Oracle Database', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'MongoDB', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Elasticsearch', icon: <DnsIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Snowflake', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'BigQuery', icon: <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Databricks', icon: <FolderIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Neo4j (Graph DB)', icon: <DnsIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Redis', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
]

export default function DataSourcePage() {
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | ConnectorConfig | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [configuredDirectories, setConfiguredDirectories] = useState<ConnectorConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConfiguredDirectories()
  }, [])

  const loadConfiguredDirectories = async () => {
    try {
      setLoading(true)
      const configs = await getConnectorConfigs('file_system')
      setConfiguredDirectories(configs)
    } catch (error) {
      console.error('Failed to load configured directories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (dataSource: DataSource | ConnectorConfig) => {
    setSelectedDataSource(dataSource)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedDataSource(null)
  }

  const handleDeleteConfig = async (config: ConnectorConfig) => {
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) {
      return
    }
    try {
      await deleteConnectorConfig(config.id)
      await loadConfiguredDirectories()
      if (selectedDataSource && 'id' in selectedDataSource && selectedDataSource.id === config.id) {
        handleClose()
      }
    } catch (error) {
      console.error('Failed to delete configuration:', error)
      alert('Failed to delete configuration')
    }
  }

  const isConfiguredDirectory = (item: DataSource | ConnectorConfig): item is ConnectorConfig => {
    return 'id' in item && 'connector_type' in item
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Data Source
        </Typography>

        <Grid container spacing={4}>
          {dataSources.map((dataSource) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dataSource.name}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 400, mx: 'auto' }}>
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => handleCardClick(dataSource)}>
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
                    <Box sx={{ mb: 3 }}>{dataSource.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem' }}>
                      {dataSource.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {/* Configured Directories from Connectors */}
          {configuredDirectories.map((config) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={config.id}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 400, mx: 'auto', position: 'relative' }}>
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => handleCardClick(config)}>
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
                    <Box sx={{ mb: 3 }}>
                      <FolderIcon sx={{ fontSize: 64, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem', mb: 1 }}>
                      {config.name}
                    </Typography>
                    <Chip
                      label="File System"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                      {config.directory_path}
                    </Typography>
                  </CardContent>
                </CardActionArea>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'error.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'error.dark' },
                  }}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteConfig(config)
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Data Source Modal */}
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
            {selectedDataSource?.icon}
            <Typography variant="h5">{selectedDataSource?.name}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {isConfiguredDirectory(selectedDataSource) ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body1">
                <strong>Name:</strong> {selectedDataSource.name}
              </Typography>
              <Typography variant="body1">
                <strong>Directory Path:</strong> {selectedDataSource.directory_path}
              </Typography>
              <Typography variant="body1">
                <strong>Type:</strong> {selectedDataSource.connector_type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Created:</strong> {new Date(selectedDataSource.created_at).toLocaleString()}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body1">
              Configure your {selectedDataSource?.name} data source settings here.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

