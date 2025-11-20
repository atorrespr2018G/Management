'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TableChartIcon from '@mui/icons-material/TableChart'
import { getDatabaseConfig, introspectDatabaseSchema, uploadDatabaseSchema } from '@/services/neo4jApi'
import type { DatabaseConfig, SchemaInfo } from '@/types/neo4j'

export default function DatabaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dbId = params.id as string

  const [config, setConfig] = useState<DatabaseConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [introspecting, setIntrospecting] = useState(false)
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [jsonSchema, setJsonSchema] = useState('')

  useEffect(() => {
    if (dbId) {
      loadDatabaseConfig()
    }
  }, [dbId])

  const loadDatabaseConfig = async () => {
    try {
      setLoading(true)
      setError(null)
      const dbConfig = await getDatabaseConfig(dbId)
      setConfig(dbConfig)
    } catch (err: any) {
      console.error('Failed to load database config:', err)
      setError('Failed to load database configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleIntrospect = async () => {
    if (!dbId) return

    setIntrospecting(true)
    setError(null)

    try {
      const result = await introspectDatabaseSchema(dbId, false)
      setSchemaInfo(result.schema_info)
      alert(`Schema introspected successfully! Found ${result.schema_info.tables.length} tables.`)
    } catch (err: any) {
      console.error('Failed to introspect schema:', err)
      setError('Failed to introspect schema: ' + (err.message || 'Unknown error'))
    } finally {
      setIntrospecting(false)
    }
  }

  const handleUploadSchema = async () => {
    if (!dbId || !jsonSchema) {
      setError('Please provide schema JSON')
      return
    }

    try {
      const schema: SchemaInfo = JSON.parse(jsonSchema)
      await uploadDatabaseSchema(dbId, schema, false)
      setSchemaInfo(schema)
      setUploadDialogOpen(false)
      setJsonSchema('')
      alert('Schema uploaded successfully!')
    } catch (err: any) {
      console.error('Failed to upload schema:', err)
      setError('Failed to upload schema: ' + (err.message || 'Invalid JSON'))
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error && !config) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/repositories/database')} sx={{ mt: 2 }}>
          Back to Databases
        </Button>
      </Box>
    )
  }

  if (!config) {
    return null
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={() => router.push('/repositories/database')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {config.name}
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Database Configuration
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography><strong>Type:</strong> {config.database_type}</Typography>
              <Typography><strong>Host:</strong> {config.host}:{config.port}</Typography>
              <Typography><strong>Database:</strong> {config.database_name}</Typography>
              {config.schema_name && <Typography><strong>Schema:</strong> {config.schema_name}</Typography>}
              <Typography><strong>Username:</strong> {config.username}</Typography>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Schema</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={introspecting}
                >
                  Upload JSON
                </Button>
                <Button
                  variant="contained"
                  onClick={handleIntrospect}
                  disabled={introspecting}
                  startIcon={introspecting ? <CircularProgress size={16} /> : <TableChartIcon />}
                >
                  {introspecting ? 'Introspecting...' : 'Introspect Schema'}
                </Button>
              </Box>
            </Box>

            {schemaInfo ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Found {schemaInfo.tables.length} tables in {schemaInfo.schema_name}
                </Typography>
                {schemaInfo.tables.map((table) => (
                  <Accordion key={table.name} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                        <TableChartIcon sx={{ mr: 1 }} />
                        <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                          {table.name}
                        </Typography>
                        <Chip label={`${table.columns.length} columns`} size="small" />
                        {table.primary_keys.length > 0 && (
                          <Chip label={`${table.primary_keys.length} PK`} size="small" color="primary" />
                        )}
                        {table.foreign_keys.length > 0 && (
                          <Chip label={`${table.foreign_keys.length} FK`} size="small" color="secondary" />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Columns:
                      </Typography>
                      <List dense>
                        {table.columns.map((col) => (
                          <ListItem key={col.name} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {col.name}
                                  </Typography>
                                  <Chip label={col.data_type} size="small" variant="outlined" />
                                  {col.primary_key && <Chip label="PK" size="small" color="primary" />}
                                  {col.foreign_key && <Chip label="FK" size="small" color="secondary" />}
                                  {!col.nullable && <Chip label="NOT NULL" size="small" />}
                                </Box>
                              }
                              secondary={col.default ? `Default: ${col.default}` : undefined}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No schema loaded. Click "Introspect Schema" to discover the database schema, or "Upload JSON" to upload a schema file.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Upload JSON Schema Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false)
          setJsonSchema('')
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Schema JSON</DialogTitle>
        <DialogContent>
          <TextField
            label="Schema JSON"
            multiline
            rows={15}
            value={jsonSchema}
            onChange={(e) => setJsonSchema(e.target.value)}
            fullWidth
            placeholder='{"database_name": "mydb", "schema_name": "public", "tables": [...]}'
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false)
            setJsonSchema('')
          }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleUploadSchema}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

