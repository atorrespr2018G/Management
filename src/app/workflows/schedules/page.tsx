/**
 * Workflow Schedules Page
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  Add as AddIcon,
  PlayArrow as EnableIcon,
  Pause as DisableIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material'
import {
  listSchedules,
  createSchedule,
  enableSchedule,
  disableSchedule,
} from '@/services/workflowApi'
import { listWorkflows } from '@/services/workflowApi'

interface Schedule {
  schedule_id: string
  workflow_id: string
  schedule_type: string
  enabled: boolean
  next_run?: string
  interval_seconds?: number
  time_of_day?: string
  days_of_week?: number[]
}

export default function WorkflowSchedulesPage() {
  const router = useRouter()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [workflows, setWorkflows] = useState<Array<{ workflow_id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Form state
  const [scheduleId, setScheduleId] = useState('')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('')
  const [scheduleType, setScheduleType] = useState<'interval' | 'daily' | 'weekly'>('interval')
  const [intervalSeconds, setIntervalSeconds] = useState<number>(3600)
  const [timeOfDay, setTimeOfDay] = useState('09:00')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])

  useEffect(() => {
    loadSchedules()
    loadWorkflows()
  }, [])

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const data = await listSchedules()
      setSchedules(data)
    } catch (error) {
      console.error('Failed to load schedules:', error)
      setSnackbar({ open: true, message: 'Failed to load schedules', severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const loadWorkflows = async () => {
    try {
      const data = await listWorkflows()
      setWorkflows(data)
    } catch (error) {
      console.error('Failed to load workflows:', error)
    }
  }

  const handleCreateSchedule = async () => {
    try {
      const options: any = {}
      if (scheduleType === 'interval') {
        options.interval_seconds = intervalSeconds
      } else if (scheduleType === 'daily') {
        options.time_of_day = timeOfDay
      } else if (scheduleType === 'weekly') {
        options.time_of_day = timeOfDay
        options.days_of_week = daysOfWeek
      }

      await createSchedule(scheduleId, selectedWorkflowId, scheduleType, options)
      setCreateDialogOpen(false)
      setSnackbar({ open: true, message: 'Schedule created successfully', severity: 'success' })
      loadSchedules()
      
      // Reset form
      setScheduleId('')
      setSelectedWorkflowId('')
      setScheduleType('interval')
      setIntervalSeconds(3600)
      setTimeOfDay('09:00')
      setDaysOfWeek([])
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to create schedule', severity: 'error' })
    }
  }

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await disableSchedule(scheduleId)
      } else {
        await enableSchedule(scheduleId)
      }
      setSnackbar({
        open: true,
        message: `Schedule ${enabled ? 'disabled' : 'enabled'} successfully`,
        severity: 'success',
      })
      loadSchedules()
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to toggle schedule', severity: 'error' })
    }
  }

  const formatScheduleType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  const formatDaysOfWeek = (days: number[]) => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return days.map((d) => dayNames[d]).join(', ')
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <ScheduleIcon sx={{ mr: 1 }} />
          Workflow Schedules
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
          Create Schedule
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Schedule ID</TableCell>
              <TableCell>Workflow</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Configuration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Next Run</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {schedules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No schedules found. Create one to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              schedules.map((schedule) => (
                <TableRow key={schedule.schedule_id}>
                  <TableCell>{schedule.schedule_id}</TableCell>
                  <TableCell>
                    {workflows.find((w) => w.workflow_id === schedule.workflow_id)?.name || schedule.workflow_id}
                  </TableCell>
                  <TableCell>{formatScheduleType(schedule.schedule_type)}</TableCell>
                  <TableCell>
                    {schedule.schedule_type === 'interval' && schedule.interval_seconds && (
                      <Typography variant="body2">
                        Every {schedule.interval_seconds / 60} minutes
                      </Typography>
                    )}
                    {schedule.schedule_type === 'daily' && schedule.time_of_day && (
                      <Typography variant="body2">Daily at {schedule.time_of_day}</Typography>
                    )}
                    {schedule.schedule_type === 'weekly' && (
                      <Typography variant="body2">
                        {schedule.days_of_week && formatDaysOfWeek(schedule.days_of_week)} at {schedule.time_of_day}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={schedule.enabled ? 'Enabled' : 'Disabled'}
                      color={schedule.enabled ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {schedule.next_run ? new Date(schedule.next_run).toLocaleString() : 'N/A'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleSchedule(schedule.schedule_id, schedule.enabled)}
                      color={schedule.enabled ? 'warning' : 'success'}
                    >
                      {schedule.enabled ? <DisableIcon /> : <EnableIcon />}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Schedule Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Schedule</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Schedule ID"
              value={scheduleId}
              onChange={(e) => setScheduleId(e.target.value)}
              fullWidth
              required
            />
            <FormControl fullWidth required>
              <InputLabel>Workflow</InputLabel>
              <Select
                value={selectedWorkflowId}
                label="Workflow"
                onChange={(e) => setSelectedWorkflowId(e.target.value)}
              >
                {workflows.map((wf) => (
                  <MenuItem key={wf.workflow_id} value={wf.workflow_id}>
                    {wf.name || wf.workflow_id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth required>
              <InputLabel>Schedule Type</InputLabel>
              <Select
                value={scheduleType}
                label="Schedule Type"
                onChange={(e) => setScheduleType(e.target.value as 'interval' | 'daily' | 'weekly')}
              >
                <MenuItem value="interval">Interval</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
              </Select>
            </FormControl>
            {scheduleType === 'interval' && (
              <TextField
                label="Interval (seconds)"
                type="number"
                value={intervalSeconds}
                onChange={(e) => setIntervalSeconds(Number(e.target.value))}
                fullWidth
                required
                helperText={`${intervalSeconds / 60} minutes`}
              />
            )}
            {(scheduleType === 'daily' || scheduleType === 'weekly') && (
              <TextField
                label="Time of Day"
                type="time"
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                fullWidth
                required
                InputLabelProps={{ shrink: true }}
              />
            )}
            {scheduleType === 'weekly' && (
              <FormControl fullWidth>
                <InputLabel>Days of Week</InputLabel>
                <Select
                  multiple
                  value={daysOfWeek}
                  label="Days of Week"
                  onChange={(e) => setDaysOfWeek(e.target.value as number[])}
                  renderValue={(selected) => {
                    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                    return (selected as number[]).map((d) => dayNames[d]).join(', ')
                  }}
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                    return (
                      <MenuItem key={day} value={day}>
                        {dayNames[day]}
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateSchedule}
            variant="contained"
            disabled={!scheduleId || !selectedWorkflowId}
          >
            Create
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
