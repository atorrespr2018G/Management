/**
 * Workflow Templates Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
} from '@mui/material'
import {
  Search as SearchIcon,
  PlayArrow as UseTemplateIcon,
  Description as TemplateIcon,
} from '@mui/icons-material'
import { getWorkflowTemplates, instantiateTemplate } from '@/services/workflowApi'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store/store'
import { setWorkflow } from '@/store/slices/workflowSlice'
import type { WorkflowTemplate } from '@/types/workflow'

export default function WorkflowTemplatesPage() {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await getWorkflowTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    try {
      const workflow = await instantiateTemplate(template.id, {})
      dispatch(setWorkflow(workflow))
      router.push('/workflows/builder')
    } catch (error) {
      console.error('Failed to instantiate template:', error)
    }
  }

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Workflow Templates
        </Typography>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2 }}>
        <TextField
          placeholder="Search templates..."
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ width: 400 }}
        />
      </Box>

      {/* Templates Grid */}
      {loading ? (
        <Typography>Loading templates...</Typography>
      ) : filteredTemplates.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            No templates found
          </Typography>
          <Button variant="contained" onClick={() => router.push('/workflows/builder')}>
            Create New Workflow
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} sm={6} md={4} key={template.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TemplateIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {template.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    {template.description}
                  </Typography>
                  {template.category && (
                    <Chip label={template.category} size="small" sx={{ mr: 1 }} />
                  )}
                  {template.tags && template.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ mr: 0.5, mt: 0.5 }} />
                  ))}
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<UseTemplateIcon />}
                    onClick={() => handleUseTemplate(template)}
                    fullWidth
                  >
                    Use Template
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}
