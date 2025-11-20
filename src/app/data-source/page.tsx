'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import {
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Dns as DnsIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { createDatabaseConfig, testDatabaseConnection } from '@/services/neo4jApi'
import type { DatabaseConfigRequest } from '@/types/neo4j'

interface DataSource {
  name: string
  type: string
  icon: React.ReactNode
  defaultPort: number
}

const dataSources: DataSource[] = [
  { name: 'MySQL', type: 'mysql', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} />, defaultPort: 3306 },
  { name: 'PostgreSQL', type: 'postgresql', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} />, defaultPort: 5432 },
  { name: 'Microsoft SQL Server', type: 'sqlserver', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} />, defaultPort: 1433 },
  { name: 'Oracle Database', type: 'oracle', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} />, defaultPort: 1521 },
  { name: 'Snowflake', type: 'snowflake', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} />, defaultPort: 443 },
  { name: 'BigQuery', type: 'bigquery', icon: <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main' }} />, defaultPort: 443 },
]

export default function DataSourcePage() {
  const router = useRouter()
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<DatabaseConfigRequest>>({
    database_type: '',
    name: '',
    host: '',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
    schema_name: '',
  })
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCardClick = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource)
    setFormData({
      database_type: dataSource.type,
      name: '',
      host: '',
      port: dataSource.defaultPort,
      database_name: '',
      username: '',
      password: '',
      schema_name: dataSource.type === 'postgresql' || dataSource.type === 'sqlserver' ? 'public' : '',
    })
    setTestResult(null)
    setError(null)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedDataSource(null)
    setFormData({
      database_type: '',
      name: '',
      host: '',
      port: 5432,
      database_name: '',
      username: '',
      password: '',
      schema_name: '',
    })
    setTestResult(null)
    setError(null)
  }

  const handleTestConnection = async () => {
    if (!selectedDataSource) return
    
    setTesting(true)
    setTestResult(null)
    setError(null)
    
    try {
      // First create a temporary config to test
      const tempConfig: DatabaseConfigRequest = {
        database_type: formData.database_type!,
        name: formData.name || 'Test Connection',
        host: formData.host!,
        port: formData.port!,
        database_name: formData.database_name!,
        username: formData.username!,
        password: formData.password!,
        schema_name: formData.schema_name,
      }
      
      const config = await createDatabaseConfig(tempConfig)
      const result = await testDatabaseConnection(config.id)
      
      setTestResult({
        success: result.success,
        message: result.message,
      })
      
      // Delete the temporary config if test failed
      if (!result.success) {
        // Note: In production, you might want to keep failed configs for debugging
        // For now, we'll leave it and let the user save if they want
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test connection')
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed',
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!formData.database_type || !formData.name || !formData.host || !formData.database_name || !formData.username || !formData.password) {
      setError('Please fill in all required fields')
      return
    }
    
    setSaving(true)
    setError(null)
    
    try {
      const config: DatabaseConfigRequest = {
        database_type: formData.database_type,
        name: formData.name,
        host: formData.host,
        port: formData.port!,
        database_name: formData.database_name,
        username: formData.username,
        password: formData.password,
        schema_name: formData.schema_name || undefined,
      }
      
      const savedConfig = await createDatabaseConfig(config)
      handleClose()
      // Navigate to repositories/database to see the new config
      router.push('/repositories/database')
    } catch (err: any) {
      setError(err.message || 'Failed to save database configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Structured
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
        </Grid>
      </Box>

      {/* Database Configuration Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedDataSource?.icon}
            <Typography variant="h5">Configure {selectedDataSource?.name}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            {testResult && (
              <Alert
                severity={testResult.success ? 'success' : 'error'}
                icon={testResult.success ? <CheckCircleIcon /> : undefined}
              >
                {testResult.message}
              </Alert>
            )}
            
            <TextField
              label="Configuration Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Host"
              value={formData.host}
              onChange={(e) => setFormData({ ...formData, host: e.target.value })}
              required
              fullWidth
              placeholder="localhost"
            />
            
            <TextField
              label="Port"
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 0 })}
              required
              fullWidth
            />
            
            <TextField
              label="Database Name"
              value={formData.database_name}
              onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
              required
              fullWidth
            />
            
            {(selectedDataSource?.type === 'postgresql' || selectedDataSource?.type === 'sqlserver') && (
              <TextField
                label="Schema Name"
                value={formData.schema_name}
                onChange={(e) => setFormData({ ...formData, schema_name: e.target.value })}
                fullWidth
                placeholder="public"
              />
            )}
            
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
            />
            
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleClose} disabled={saving || testing}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={handleTestConnection}
            disabled={saving || testing || !formData.host || !formData.database_name || !formData.username || !formData.password}
            startIcon={testing ? <CircularProgress size={16} /> : undefined}
          >
            Test Connection
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || testing}
            startIcon={saving ? <CircularProgress size={16} /> : undefined}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
