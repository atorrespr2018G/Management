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
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import StorageIcon from '@mui/icons-material/Storage'
import { getDatabaseConfigs, deleteDatabaseConfig } from '@/services/neo4jApi'
import type { DatabaseConfig } from '@/types/neo4j'

export default function RepositoriesDatabasePage() {
  const router = useRouter()
  const [configuredDatabases, setConfiguredDatabases] = useState<DatabaseConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadConfiguredDatabases()
  }, [])

  const loadConfiguredDatabases = async () => {
    try {
      setLoading(true)
      setError(null)
      const configs = await getDatabaseConfigs()
      setConfiguredDatabases(configs)
    } catch (err: any) {
      console.error('Failed to load configured databases:', err)
      setError(err.message || 'Failed to load database configurations')
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (config: DatabaseConfig) => {
    router.push(`/repositories/database/${config.id}`)
  }

  const handleDeleteConfig = async (config: DatabaseConfig, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete "${config.name}"?`)) {
      return
    }
    try {
      await deleteDatabaseConfig(config.id)
      await loadConfiguredDatabases()
    } catch (err: any) {
      console.error('Failed to delete configuration:', err)
      alert('Failed to delete configuration: ' + (err.message || 'Unknown error'))
    }
  }

  const getDatabaseIcon = (dbType: string) => {
    return <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} />
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Database
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : configuredDatabases.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <StorageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No configured databases
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure a database in Setup &gt; Structured
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={4}>
            {configuredDatabases.map((config) => (
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
                      <Box sx={{ mb: 3 }}>{getDatabaseIcon(config.database_type)}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem', mb: 1 }}>
                        {config.name}
                      </Typography>
                      <Chip
                        label={config.database_type}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {config.host}:{config.port}/{config.database_name}
                      </Typography>
                      {config.schema_name && (
                        <Typography variant="caption" color="text.secondary">
                          Schema: {config.schema_name}
                        </Typography>
                      )}
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

