/**
 * Workflow AI Features Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  LinearProgress,
} from '@mui/material'
import {
  Psychology as AIIcon,
  TrendingUp as PredictIcon,
  Lightbulb as RecommendIcon,
} from '@mui/icons-material'
import { getAIPrediction, getAIRecommendations } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowAIPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])
  const [prediction, setPrediction] = useState<any>(null)
  const [predictionType, setPredictionType] = useState<'execution_time' | 'cost'>('execution_time')
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const data = await listWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  const handleGetPrediction = async () => {
    if (!selectedWorkflowId) {
      setSnackbar({ open: true, message: 'Please select a workflow', severity: 'error' })
      return
    }

    try {
      setLoading(true)
      const result = await getAIPrediction(selectedWorkflowId, predictionType)
      setPrediction(result)
      setSnackbar({ open: true, message: 'Prediction generated successfully', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to get prediction', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleGetRecommendations = async () => {
    if (!selectedWorkflowId) {
      setSnackbar({ open: true, message: 'Please select a workflow', severity: 'error' })
      return
    }

    try {
      setLoading(true)
      const data = await getAIRecommendations(selectedWorkflowId)
      setRecommendations(data)
      setSnackbar({ open: true, message: 'Recommendations generated successfully', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to get recommendations', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AIIcon sx={{ mr: 1 }} />
          Workflow AI Features
        </Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Workflow</InputLabel>
          <Select
            value={selectedWorkflowId}
            label="Workflow"
            onChange={(e) => {
              setSelectedWorkflowId(e.target.value)
              setPrediction(null)
              setRecommendations([])
            }}
          >
            {workflows.map((wf) => (
              <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                {wf.name || wf.workflow_id}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<PredictIcon />}
          onClick={handleGetPrediction}
          disabled={!selectedWorkflowId || loading}
        >
          Get Prediction
        </Button>
        <Button
          variant="contained"
          startIcon={<RecommendIcon />}
          onClick={handleGetRecommendations}
          disabled={!selectedWorkflowId || loading}
        >
          Get Recommendations
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
        {/* Predictions */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">AI Predictions</Typography>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={predictionType}
                label="Type"
                onChange={(e) => {
                  setPredictionType(e.target.value as 'execution_time' | 'cost')
                  setPrediction(null)
                }}
              >
                <MenuItem value="execution_time">Execution Time</MenuItem>
                <MenuItem value="cost">Cost</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {prediction ? (
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                    Prediction
                  </Typography>
                  <Typography variant="h5">{JSON.stringify(prediction.prediction)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                    Confidence:
                  </Typography>
                  <Chip label={`${(prediction.confidence * 100).toFixed(1)}%`} color="primary" />
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Select a workflow and click "Get Prediction" to see AI-powered predictions for execution time or
                  cost.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>

        {/* Recommendations */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            AI Recommendations
          </Typography>
          {recommendations.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {recommendations.map((rec) => (
                <Card key={rec.recommendation_id} variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Chip label={rec.type} size="small" />
                      <Chip label={`${(rec.confidence * 100).toFixed(1)}%`} size="small" color="primary" />
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {rec.description}
                    </Typography>
                    {rec.expected_improvement && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Expected Improvement: {rec.expected_improvement}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Select a workflow and click "Get Recommendations" to see AI-powered optimization suggestions.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Paper>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
