/**
 * Workflow Tests Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  LinearProgress,
} from '@mui/material'
import {
  Add as AddIcon,
  PlayArrow as RunIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  BugReport as TestIcon,
} from '@mui/icons-material'
import { addTestCase, runWorkflowTests } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

interface TestCase {
  test_id: string
  name: string
  goal: string
  expected_output?: string
}

interface TestResult {
  test_id: string
  passed: boolean
  execution_time_ms?: number
  error?: string
  output?: any
}

export default function WorkflowTestsPage() {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('')
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({})
  const [testSummary, setTestSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Form state
  const [testId, setTestId] = useState('')
  const [testName, setTestName] = useState('')
  const [testGoal, setTestGoal] = useState('')
  const [expectedOutput, setExpectedOutput] = useState('')

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

  const handleAddTestCase = async () => {
    if (!selectedWorkflowId) {
      setSnackbar({ open: true, message: 'Please select a workflow first', severity: 'error' })
      return
    }

    try {
      await addTestCase(selectedWorkflowId, testId, testName, testGoal, expectedOutput || undefined)
      setAddDialogOpen(false)
      setSnackbar({ open: true, message: 'Test case added successfully', severity: 'success' })
      
      // Add to local state
      setTestCases([...testCases, { test_id: testId, name: testName, goal: testGoal, expected_output: expectedOutput }])
      
      // Reset form
      setTestId('')
      setTestName('')
      setTestGoal('')
      setExpectedOutput('')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to add test case', severity: 'error' })
    }
  }

  const handleRunTests = async () => {
    if (!selectedWorkflowId) {
      setSnackbar({ open: true, message: 'Please select a workflow first', severity: 'error' })
      return
    }

    try {
      setRunning(true)
      const result = await runWorkflowTests(selectedWorkflowId)
      setTestResults(result.results || {})
      setTestSummary(result.summary || null)
      setSnackbar({ open: true, message: 'Tests completed', severity: 'success' })
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to run tests', severity: 'error' })
    } finally {
      setRunning(false)
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <TestIcon sx={{ mr: 1 }} />
          Workflow Tests
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Workflow</InputLabel>
            <Select
              value={selectedWorkflowId}
              label="Workflow"
              onChange={(e) => {
                setSelectedWorkflowId(e.target.value)
                setTestCases([])
                setTestResults({})
                setTestSummary(null)
              }}
            >
              {workflows.map((wf) => (
                <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                  {wf.name || wf.workflow_id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAddDialogOpen(true)}
            disabled={!selectedWorkflowId}
          >
            Add Test
          </Button>
          <Button
            variant="contained"
            startIcon={<RunIcon />}
            onClick={handleRunTests}
            disabled={!selectedWorkflowId || running}
          >
            Run Tests
          </Button>
        </Box>
      </Box>

      {running && <LinearProgress sx={{ mb: 2 }} />}

      {/* Test Summary */}
      {testSummary && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Total Tests
                </Typography>
                <Typography variant="h4">{testSummary.total_tests || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Passed
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.main' }}>
                  {testSummary.passed || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Failed
                </Typography>
                <Typography variant="h4" sx={{ color: 'error.main' }}>
                  {testSummary.failed || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Success Rate
                </Typography>
                <Typography variant="h4">
                  {testSummary.total_tests
                    ? `${((testSummary.passed / testSummary.total_tests) * 100).toFixed(1)}%`
                    : '0%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Test Cases Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Test ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Goal</TableCell>
              <TableCell>Expected Output</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Execution Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {testCases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {selectedWorkflowId
                      ? 'No test cases. Add one to get started.'
                      : 'Select a workflow to view test cases.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              testCases.map((testCase) => {
                const result = testResults[testCase.test_id]
                return (
                  <TableRow key={testCase.test_id}>
                    <TableCell>{testCase.test_id}</TableCell>
                    <TableCell>{testCase.name}</TableCell>
                    <TableCell>{testCase.goal}</TableCell>
                    <TableCell>{testCase.expected_output || 'N/A'}</TableCell>
                    <TableCell>
                      {result ? (
                        <Chip
                          label={result.passed ? 'Passed' : 'Failed'}
                          color={result.passed ? 'success' : 'error'}
                          size="small"
                          icon={result.passed ? <SuccessIcon /> : <ErrorIcon />}
                        />
                      ) : (
                        <Chip label="Not Run" size="small" variant="outlined" />
                      )}
                    </TableCell>
                    <TableCell>
                      {result?.execution_time_ms
                        ? `${(result.execution_time_ms / 1000).toFixed(2)}s`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Test Case Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Test Case</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Test ID"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Test Name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Goal"
              value={testGoal}
              onChange={(e) => setTestGoal(e.target.value)}
              fullWidth
              required
              multiline
              rows={3}
            />
            <TextField
              label="Expected Output (optional)"
              value={expectedOutput}
              onChange={(e) => setExpectedOutput(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleAddTestCase}
            variant="contained"
            disabled={!testId || !testName || !testGoal}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

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
