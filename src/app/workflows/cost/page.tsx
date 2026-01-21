/**
 * Workflow Cost Management Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  AttachMoney as CostIcon,
  Add as AddIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material'
import { recordCost, addBudget, getCostReport } from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

export default function WorkflowCostPage() {
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Cost entry state
  const [costDialogOpen, setCostDialogOpen] = useState(false)
  const [costWorkflowId, setCostWorkflowId] = useState('')
  const [costType, setCostType] = useState('')
  const [costAmount, setCostAmount] = useState<number>(0)
  const [costUnits, setCostUnits] = useState<number>(1)

  // Budget state
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false)
  const [budgetId, setBudgetId] = useState('')
  const [budgetAmount, setBudgetAmount] = useState<number>(0)
  const [budgetWorkflowId, setBudgetWorkflowId] = useState('')
  const [budgetPeriod, setBudgetPeriod] = useState('monthly')

  // Report state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [reportWorkflowId, setReportWorkflowId] = useState('')
  const [reportStartDate, setReportStartDate] = useState('')
  const [reportEndDate, setReportEndDate] = useState('')
  const [costReport, setCostReport] = useState<any>(null)

  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])

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

  const handleRecordCost = async () => {
    try {
      await recordCost(costWorkflowId, costType, costAmount, costUnits)
      setCostDialogOpen(false)
      setSnackbar({ open: true, message: 'Cost recorded successfully', severity: 'success' })
      setCostWorkflowId('')
      setCostType('')
      setCostAmount(0)
      setCostUnits(1)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to record cost', severity: 'error' })
    }
  }

  const handleAddBudget = async () => {
    try {
      await addBudget(budgetId, budgetAmount, budgetWorkflowId || undefined, budgetPeriod)
      setBudgetDialogOpen(false)
      setSnackbar({ open: true, message: 'Budget added successfully', severity: 'success' })
      setBudgetId('')
      setBudgetAmount(0)
      setBudgetWorkflowId('')
      setBudgetPeriod('monthly')
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to add budget', severity: 'error' })
    }
  }

  const handleGenerateReport = async () => {
    try {
      const report = await getCostReport(
        reportWorkflowId || undefined,
        reportStartDate || undefined,
        reportEndDate || undefined
      )
      setCostReport(report)
      setReportDialogOpen(true)
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to generate report', severity: 'error' })
    }
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <CostIcon sx={{ mr: 1 }} />
          Workflow Cost Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<ReportIcon />} onClick={handleGenerateReport}>
            Generate Report
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setBudgetDialogOpen(true)}>
            Add Budget
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCostDialogOpen(true)}>
            Record Cost
          </Button>
        </Box>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Track and manage costs associated with workflow executions. Record costs, set budgets, and generate
            reports to monitor spending.
          </Typography>
        </CardContent>
      </Card>

      {/* Record Cost Dialog */}
      <Dialog open={costDialogOpen} onClose={() => setCostDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Cost</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Workflow</InputLabel>
              <Select
                value={costWorkflowId}
                label="Workflow"
                onChange={(e) => setCostWorkflowId(e.target.value)}
              >
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Cost Type</InputLabel>
              <Select value={costType} label="Cost Type" onChange={(e) => setCostType(e.target.value)}>
                <MenuItem value="execution">Execution</MenuItem>
                <MenuItem value="storage">Storage</MenuItem>
                <MenuItem value="api_call">API Call</MenuItem>
                <MenuItem value="compute">Compute</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Amount"
              type="number"
              value={costAmount}
              onChange={(e) => setCostAmount(Number(e.target.value))}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Units"
              type="number"
              value={costUnits}
              onChange={(e) => setCostUnits(Number(e.target.value))}
              fullWidth
              required
              inputProps={{ min: 0.01, step: 0.01 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCostDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRecordCost} variant="contained" disabled={!costWorkflowId || !costType}>
            Record
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Budget Dialog */}
      <Dialog open={budgetDialogOpen} onClose={() => setBudgetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Budget</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Budget ID"
              value={budgetId}
              onChange={(e) => setBudgetId(e.target.value)}
              fullWidth
              required
            />
            <TextField
              label="Amount"
              type="number"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(Number(e.target.value))}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl fullWidth>
              <InputLabel>Workflow (optional)</InputLabel>
              <Select
                value={budgetWorkflowId}
                label="Workflow (optional)"
                onChange={(e) => setBudgetWorkflowId(e.target.value)}
              >
                <MenuItem value="">All Workflows</MenuItem>
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Period</InputLabel>
              <Select value={budgetPeriod} label="Period" onChange={(e) => setBudgetPeriod(e.target.value)}>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBudgetDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddBudget} variant="contained" disabled={!budgetId || budgetAmount <= 0}>
            Add Budget
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cost Report Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Cost Report</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {costReport ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Total Cost
                      </Typography>
                      <Typography variant="h4">${costReport.total_cost?.toFixed(2) || '0.00'}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Execution Count
                      </Typography>
                      <Typography variant="h4">{costReport.execution_count || 0}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>
                        Avg Cost per Execution
                      </Typography>
                      <Typography variant="h4">
                        ${costReport.avg_cost_per_execution?.toFixed(2) || '0.00'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                {costReport.cost_by_type && Object.keys(costReport.cost_by_type).length > 0 && (
                  <Grid item xs={12}>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Cost Type</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(costReport.cost_by_type).map(([type, amount]: [string, any]) => (
                            <TableRow key={type}>
                              <TableCell>{type}</TableCell>
                              <TableCell align="right">${amount.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Workflow (optional)</InputLabel>
                  <Select
                    value={reportWorkflowId}
                    label="Workflow (optional)"
                    onChange={(e) => setReportWorkflowId(e.target.value)}
                  >
                    <MenuItem value="">All Workflows</MenuItem>
                    {workflows.map((wf) => (
                      <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                        {wf.name || wf.workflow_id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Start Date"
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
                <Button variant="contained" onClick={handleGenerateReport} fullWidth>
                  Generate Report
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialogOpen(false)}>Close</Button>
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
