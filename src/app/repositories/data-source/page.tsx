'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import FolderIcon from '@mui/icons-material/Folder'
import { getConnectorConfigs, deleteConnectorConfig } from '@/services/neo4jApi'
import type { ConnectorConfig } from '@/types/neo4j'

export default function RepositoriesDataSourcePage() {
  const router = useRouter()
  const [configuredDirectories, setConfiguredDirectories] = useState<ConnectorConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConfiguredDirectories = async () => {
    try {
      setLoading(true)
      setError(null)
      const configs = await getConnectorConfigs('file_system')
      setConfiguredDirectories(configs)
    } catch (err: any) {
      console.error('Failed to load configured directories:', err)
      const errorMessage = err?.message || 'Failed to load data sources. Please check if the backend server is running.'
      setError(errorMessage)
      // Set empty array on error to prevent infinite loading state
      setConfiguredDirectories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConfiguredDirectories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCardClick = (config: ConnectorConfig) => {
    // Navigate to detail page instead of showing modal
    router.push(`/repositories/data-source/${config.id}`)
  }

  const handleDeleteConfig = async (config: ConnectorConfig, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) {
      return
    }
    try {
      await deleteConnectorConfig(config.id)
      await loadConfiguredDirectories()
    } catch (error) {
      console.error('Failed to delete configuration:', error)
      alert('Failed to delete configuration')
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Data Source
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadConfiguredDirectories}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : configuredDirectories.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No configured directories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure a directory in Setup &gt; Connectors &gt; File System / Local Directory
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
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
                    onClick={(e) => handleDeleteConfig(config, e)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  )
}

