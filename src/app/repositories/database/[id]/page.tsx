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
  Autocomplete,
  Divider,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TableChartIcon from '@mui/icons-material/TableChart'
import EditIcon from '@mui/icons-material/Edit'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  getDatabaseConfig,
  updateDatabaseConfig,
  testDatabaseConnection,
  introspectDatabaseSchema,
  uploadDatabaseSchema,
  embedDatabaseSchema,
  updateSchemaMetadata,
  createMetricDefinition,
  getSchemaElements,
  getDatabaseSchema,
  deleteDatabaseSchema,
  deleteTable,
  type SchemaMetadataUpdate,
  type MetricDefinitionRequest,
} from '@/services/neo4jApi'
import type { DatabaseConfig, SchemaInfo, TableInfo, ColumnInfo, DatabaseConfigRequest } from '@/types/neo4j'

export default function DatabaseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const dbId = params.id as string

  const [config, setConfig] = useState<DatabaseConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [introspecting, setIntrospecting] = useState(false)
  const [embedding, setEmbedding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testingStored, setTestingStored] = useState(false)
  const [testingEdit, setTestingEdit] = useState(false)
  const [testingEditStored, setTestingEditStored] = useState(false)
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [jsonSchema, setJsonSchema] = useState('')

  // Edit config dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editUseEnv, setEditUseEnv] = useState(true) // Track which edit mode (.env or stored)
  const [editConfig, setEditConfig] = useState<DatabaseConfigRequest>({
    database_type: '',
    name: '',
    host: '',
    port: 5432,
    database_name: '',
    username: '',
    password: '',
    schema_name: '',
  })

  // Enrichment dialogs
  const [enrichmentDialogOpen, setEnrichmentDialogOpen] = useState(false)
  const [enrichmentElement, setEnrichmentElement] = useState<{ type: string; id: string; name: string } | null>(null)
  const [enrichmentData, setEnrichmentData] = useState<{ description: string; synonyms: string[]; domain: string }>({
    description: '',
    synonyms: [],
    domain: '',
  })

  // Metric dialog
  const [metricDialogOpen, setMetricDialogOpen] = useState(false)
  const [metricData, setMetricData] = useState<{
    name: string
    definition: string
    calculation: string
    relatedTables: string[]
    relatedColumns: string[]
  }>({
    name: '',
    definition: '',
    calculation: '',
    relatedTables: [],
    relatedColumns: [],
  })

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

      // Also load existing schema if available
      try {
        const schema = await getDatabaseSchema(dbId)
        if (schema && schema.tables && schema.tables.length > 0) {
          setSchemaInfo(schema)
        }
      } catch (schemaErr: any) {
        // Schema might not exist yet, which is fine
        console.log('No existing schema found or error loading schema:', schemaErr)
      }
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
      alert(`Schema discovered successfully! Found ${result.schema_info.tables.length} tables.`)
    } catch (err: any) {
      console.error('Failed to discover schema:', err)
      setError('Failed to discover schema: ' + (err.message || 'Unknown error'))
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

  const handleGenerateEmbeddings = async () => {
    if (!dbId) return

    setEmbedding(true)
    setError(null)

    try {
      const result = await embedDatabaseSchema(dbId)
      // Handle both response formats for backward compatibility
      const resultData = result.result || result
      alert(
        `Embeddings generated successfully!\n` +
        `- Tables: ${resultData.tables || 0}\n` +
        `- Columns: ${resultData.columns || 0}\n` +
        `- Metrics: ${resultData.metrics || 0}\n` +
        `- Total embedded: ${resultData.embedded || 0}`
      )
    } catch (err: any) {
      console.error('Failed to generate embeddings:', err)
      setError('Failed to generate embeddings: ' + (err.message || 'Unknown error'))
    } finally {
      setEmbedding(false)
    }
  }

  const handleOpenEnrichment = async (elementType: 'table' | 'column', elementName: string, tableName?: string) => {
    if (!dbId || !schemaInfo) return

    try {
      // Get schema elements to find the element ID
      const elements = await getSchemaElements(dbId, elementType)
      let element: any

      if (elementType === 'column' && tableName) {
        // For columns, find by name and table name
        element = elements.elements.find((e: any) => e.name === elementName && e.table_name === tableName)
      } else {
        // For tables, find by name
        element = elements.elements.find((e: any) => e.name === elementName)
      }

      if (!element) {
        // If not found via API, construct ID based on backend format
        // This is a fallback - ideally the element should be in the API response
        const schemaName = schemaInfo.schema_name || 'public'
        let elementId: string

        if (elementType === 'table') {
          // Table ID format: {db_node_id}_schema_{schema_name}_table_{table_name}
          // We'll need to construct this, but for now try to find it
          setError(`Table ${elementName} not found in schema elements. Please ensure schema is loaded.`)
          return
        } else {
          // Column ID format: {table_node_id}_col_{col_name}
          // We need the table ID first
          const tableElement = elements.elements.find((e: any) => e.type === 'table' && e.name === tableName)
          if (!tableElement) {
            setError(`Table ${tableName} not found`)
            return
          }
          elementId = `${tableElement.id}_col_${elementName}`
          element = { id: elementId, name: elementName, description: '', synonyms: [], domain: '' }
        }
      }

      setEnrichmentElement({
        type: elementType,
        id: element.id,
        name: elementName,
      })
      setEnrichmentData({
        description: element.description || '',
        synonyms: element.synonyms || [],
        domain: element.domain || '',
      })
      setEnrichmentDialogOpen(true)
    } catch (err: any) {
      console.error('Failed to load element data:', err)
      setError('Failed to load element data: ' + (err.message || 'Unknown error'))
    }
  }

  const handleSaveEnrichment = async () => {
    if (!dbId || !enrichmentElement) return

    try {
      const metadata: SchemaMetadataUpdate = {
        description: enrichmentData.description || undefined,
        synonyms: enrichmentData.synonyms.length > 0 ? enrichmentData.synonyms : undefined,
        domain: enrichmentData.domain || undefined,
      }

      await updateSchemaMetadata(dbId, enrichmentElement.type, enrichmentElement.id, metadata)
      setEnrichmentDialogOpen(false)
      alert('Metadata updated successfully!')

      // Reload schema elements to show updated data
      if (schemaInfo) {
        const elements = await getSchemaElements(dbId, enrichmentElement.type)
        // Update the schema info with new metadata
        // This is a simplified update - in production you'd want to merge the data properly
      }
    } catch (err: any) {
      console.error('Failed to update metadata:', err)
      setError('Failed to update metadata: ' + (err.message || 'Unknown error'))
    }
  }

  const handleCreateMetric = async () => {
    if (!dbId || !metricData.name || !metricData.definition || !metricData.calculation) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const metricRequest: MetricDefinitionRequest = {
        metric_name: metricData.name,
        metric_definition: metricData.definition,
        calculation: metricData.calculation,
        related_tables: metricData.relatedTables,
        related_columns: metricData.relatedColumns,
      }

      await createMetricDefinition(dbId, metricRequest)
      setMetricDialogOpen(false)
      setMetricData({
        name: '',
        definition: '',
        calculation: '',
        relatedTables: [],
        relatedColumns: [],
      })
      alert('Metric definition created successfully!')
    } catch (err: any) {
      console.error('Failed to create metric:', err)
      setError('Failed to create metric: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDeleteSchema = async () => {
    if (!dbId) return

    if (!confirm('Are you sure you want to delete the schema from Neo4j? This will remove all tables, columns, and metrics. The database configuration will be kept.')) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const result = await deleteDatabaseSchema(dbId)
      setSchemaInfo(null)
      alert(`Schema deleted successfully! Removed ${result.schemas_deleted} schema(s).`)
    } catch (err: any) {
      console.error('Failed to delete schema:', err)
      setError('Failed to delete schema: ' + (err.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteTable = async (tableName: string) => {
    if (!dbId) return

    if (!confirm(`Are you sure you want to delete the table "${tableName}"? This will remove the table and all its columns from Neo4j.`)) {
      return
    }

    setDeleting(true)
    setError(null)

    try {
      const result = await deleteTable(dbId, tableName)
      // Refresh schema info after deletion
      if (schemaInfo) {
        const updatedTables = schemaInfo.tables.filter(t => t.name !== tableName)
        setSchemaInfo({
          ...schemaInfo,
          tables: updatedTables
        })
      }
      alert(`Table "${tableName}" deleted successfully! Removed ${result.columns_deleted} column(s).`)
    } catch (err: any) {
      console.error('Failed to delete table:', err)
      setError('Failed to delete table: ' + (err.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  const handleOpenEditDialog = (useEnv: boolean = true) => {
    if (!config) return
    setEditUseEnv(useEnv)
    setEditConfig({
      database_type: config.database_type,
      name: config.name,
      host: config.host,
      port: config.port,
      database_name: config.database_name,
      username: config.username,
      password: '', // Don't pre-fill password for security
      schema_name: config.schema_name || '',
    })
    setEditDialogOpen(true)
  }

  const handleSaveConfig = async () => {
    if (!dbId) return

    if (!editConfig.name || !editConfig.host || !editConfig.database_name || !editConfig.username) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError(null)
      const updated = await updateDatabaseConfig(dbId, editConfig)
      setConfig(updated)
      setEditDialogOpen(false)
      alert('Database configuration updated successfully!')
    } catch (err: any) {
      console.error('Failed to update configuration:', err)
      setError('Failed to update configuration: ' + (err.message || 'Unknown error'))
    }
  }

  const handleTestConnection = async (useEnv: boolean = true) => {
    if (!dbId) return

    if (useEnv) {
      setTesting(true)
    } else {
      setTestingStored(true)
    }
    setError(null)

    try {
      const result = await testDatabaseConnection(dbId, useEnv)
      if (result.success) {
        alert(`Connection test successful!\n${result.message}`)
      } else {
        setError(`Connection test failed: ${result.error || result.message}`)
      }
    } catch (err: any) {
      console.error('Failed to test connection:', err)
      setError('Failed to test connection: ' + (err.message || 'Unknown error'))
    } finally {
      if (useEnv) {
        setTesting(false)
      } else {
        setTestingStored(false)
      }
    }
  }

  const handleTestConnectionEdit = async (useEnv: boolean) => {
    if (!editConfig.name || !editConfig.host || !editConfig.database_name || !editConfig.username) {
      alert('Please fill in all required fields before testing connection')
      return
    }

    if (useEnv) {
      setTestingEdit(true)
    } else {
      setTestingEditStored(true)
    }

    try {
      // Create a temporary config for testing
      const tempConfig = {
        ...editConfig,
        name: editConfig.name || 'Test Connection',
      }

      // First create/update the config
      const updatedConfig = await updateDatabaseConfig(dbId, tempConfig)

      // Then test the connection with the specified method
      const result = await testDatabaseConnection(updatedConfig.id, useEnv)
      if (result.success) {
        alert(`Connection test successful!\n${result.message}`)
      } else {
        alert(`Connection test failed: ${result.error || result.message}`)
      }
    } catch (err: any) {
      console.error('Failed to test connection:', err)
      alert('Failed to test connection: ' + (err.message || 'Unknown error'))
    } finally {
      if (useEnv) {
        setTestingEdit(false)
      } else {
        setTestingEditStored(false)
      }
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Database Configuration
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => handleTestConnection(true)}
                  disabled={testing || testingStored || introspecting || embedding || deleting}
                  startIcon={testing ? <CircularProgress size={16} /> : null}
                  title="Test connection using .env variables (if available)"
                >
                  {testing ? 'Testing...' : 'Test (.env)'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleTestConnection(false)}
                  disabled={testing || testingStored || introspecting || embedding || deleting}
                  startIcon={testingStored ? <CircularProgress size={16} /> : null}
                  title="Test connection using stored parameters"
                >
                  {testingStored ? 'Testing...' : 'Test (Stored)'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenEditDialog(true)}
                  disabled={introspecting || embedding || deleting}
                  startIcon={<EditIcon />}
                  title="Edit configuration (tests use .env variables)"
                >
                  Edit (.env)
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenEditDialog(false)}
                  disabled={introspecting || embedding || deleting}
                  startIcon={<EditIcon />}
                  title="Edit configuration (tests use stored parameters)"
                >
                  Edit (Stored)
                </Button>
              </Box>
            </Box>
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
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={() => setUploadDialogOpen(true)}
                  disabled={introspecting || embedding || deleting}
                >
                  Upload JSON
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleGenerateEmbeddings}
                  disabled={introspecting || embedding || deleting || !schemaInfo}
                  startIcon={embedding ? <CircularProgress size={16} /> : <AutoAwesomeIcon />}
                >
                  {embedding ? 'Generating...' : 'Generate Embeddings'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setMetricDialogOpen(true)}
                  disabled={!schemaInfo || deleting}
                  startIcon={<AddIcon />}
                >
                  Create Metric
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDeleteSchema}
                  disabled={introspecting || embedding || deleting || !schemaInfo}
                  startIcon={deleting ? <CircularProgress size={16} /> : <DeleteIcon />}
                >
                  {deleting ? 'Deleting...' : 'Delete Schema'}
                </Button>
                <Button
                  variant="contained"
                  onClick={handleIntrospect}
                  disabled={introspecting || embedding || deleting}
                  startIcon={introspecting ? <CircularProgress size={16} /> : <TableChartIcon />}
                >
                  {introspecting ? 'Discovering...' : 'Schema Discovery'}
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
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleOpenEnrichment('table', table.name)
                          }}
                          sx={{ mr: 1 }}
                          title="Edit table metadata"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTable(table.name)
                          }}
                          sx={{ mr: 1 }}
                          disabled={deleting}
                          title="Delete table"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Chip label={`${table.columns?.length || 0} columns`} size="small" />
                        {table.primary_keys && table.primary_keys.length > 0 && (
                          <Chip label={`${table.primary_keys.length} PK`} size="small" color="primary" />
                        )}
                        {table.foreign_keys && table.foreign_keys.length > 0 && (
                          <Chip label={`${table.foreign_keys.length} FK`} size="small" color="secondary" />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Columns:
                      </Typography>
                      <List dense>
                        {(table.columns || []).map((col) => (
                          <ListItem key={col.name} sx={{ pl: 0 }}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {col.name}
                                  </Typography>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEnrichment('column', col.name, table.name)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
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
                No schema loaded. Click "Schema Discovery" to discover the database schema, or "Upload JSON" to upload a schema file.
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

      {/* Enrichment Dialog */}
      <Dialog
        open={enrichmentDialogOpen}
        onClose={() => {
          setEnrichmentDialogOpen(false)
          setEnrichmentElement(null)
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit {enrichmentElement?.type === 'table' ? 'Table' : 'Column'}: {enrichmentElement?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Description"
              multiline
              rows={3}
              value={enrichmentData.description}
              onChange={(e) => setEnrichmentData({ ...enrichmentData, description: e.target.value })}
              fullWidth
              placeholder="Business description of this element"
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={enrichmentData.synonyms}
              onChange={(_, newValue) => {
                setEnrichmentData({ ...enrichmentData, synonyms: newValue })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Synonyms"
                  placeholder="Add synonyms (press Enter to add)"
                />
              )}
            />
            <TextField
              label="Business Domain"
              value={enrichmentData.domain}
              onChange={(e) => setEnrichmentData({ ...enrichmentData, domain: e.target.value })}
              fullWidth
              placeholder="e.g., Sales, Finance, HR"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEnrichmentDialogOpen(false)
            setEnrichmentElement(null)
          }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveEnrichment}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Metric Definition Dialog */}
      <Dialog
        open={metricDialogOpen}
        onClose={() => {
          setMetricDialogOpen(false)
          setMetricData({
            name: '',
            definition: '',
            calculation: '',
            relatedTables: [],
            relatedColumns: [],
          })
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create Metric Definition</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Metric Name"
              value={metricData.name}
              onChange={(e) => setMetricData({ ...metricData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Total Revenue, Customer Count"
            />
            <TextField
              label="Metric Definition"
              multiline
              rows={3}
              value={metricData.definition}
              onChange={(e) => setMetricData({ ...metricData, definition: e.target.value })}
              fullWidth
              required
              placeholder="Business definition of what this metric represents"
            />
            <TextField
              label="Calculation (SQL or Formula)"
              multiline
              rows={4}
              value={metricData.calculation}
              onChange={(e) => setMetricData({ ...metricData, calculation: e.target.value })}
              fullWidth
              required
              placeholder="e.g., SELECT SUM(amount) FROM orders WHERE status = 'completed'"
            />
            <Autocomplete
              multiple
              freeSolo
              options={schemaInfo?.tables.map(t => t.name) || []}
              value={metricData.relatedTables}
              onChange={(_, newValue) => {
                setMetricData({ ...metricData, relatedTables: newValue })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Related Tables"
                  placeholder="Select or type table names"
                />
              )}
            />
            <Autocomplete
              multiple
              freeSolo
              options={
                schemaInfo?.tables.flatMap(t => (t.columns || []).map(c => `${t.name}.${c.name}`)) || []
              }
              value={metricData.relatedColumns}
              onChange={(_, newValue) => {
                setMetricData({ ...metricData, relatedColumns: newValue })
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Related Columns"
                  placeholder="Select or type column names (format: table.column)"
                />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setMetricDialogOpen(false)
            setMetricData({
              name: '',
              definition: '',
              calculation: '',
              relatedTables: [],
              relatedColumns: [],
            })
          }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreateMetric}>
            Create Metric
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Database Config Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setError(null)
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Edit Database Configuration
          {editUseEnv ? ' (Tests use .env)' : ' (Tests use stored config)'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Name"
              value={editConfig.name}
              onChange={(e) => setEditConfig({ ...editConfig, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Database Type"
              value={editConfig.database_type}
              onChange={(e) => setEditConfig({ ...editConfig, database_type: e.target.value })}
              fullWidth
              required
              select
              SelectProps={{ native: true }}
            >
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="sqlserver">SQL Server</option>
              <option value="oracle">Oracle</option>
              <option value="snowflake">Snowflake</option>
            </TextField>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Host"
                value={editConfig.host}
                onChange={(e) => setEditConfig({ ...editConfig, host: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Port"
                type="number"
                value={editConfig.port}
                onChange={(e) => setEditConfig({ ...editConfig, port: parseInt(e.target.value) || 5432 })}
                fullWidth
                required
              />
            </Box>
            <TextField
              label="Database Name"
              value={editConfig.database_name}
              onChange={(e) => setEditConfig({ ...editConfig, database_name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Schema Name"
              value={editConfig.schema_name}
              onChange={(e) => setEditConfig({ ...editConfig, schema_name: e.target.value })}
              fullWidth
              placeholder="Optional (e.g., public, dbo)"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Username"
                value={editConfig.username}
                onChange={(e) => setEditConfig({ ...editConfig, username: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Password"
                type="password"
                value={editConfig.password}
                onChange={(e) => setEditConfig({ ...editConfig, password: e.target.value })}
                fullWidth
                placeholder="Leave blank to keep current password"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
            <Button
              variant="outlined"
              onClick={() => handleTestConnectionEdit(true)}
              disabled={testingEdit || testingEditStored}
              startIcon={testingEdit ? <CircularProgress size={16} /> : null}
              title="Test connection using .env variables (if available)"
            >
              {testingEdit ? 'Testing...' : 'Test (.env)'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleTestConnectionEdit(false)}
              disabled={testingEdit || testingEditStored}
              startIcon={testingEditStored ? <CircularProgress size={16} /> : null}
              title="Test connection using stored parameters"
            >
              {testingEditStored ? 'Testing...' : 'Test (Stored)'}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => {
              setEditDialogOpen(false)
              setError(null)
            }}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveConfig}>
              Save
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
