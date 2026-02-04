'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  IconButton,
  Button,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import AgentSetupPanel from '@/components/Workflow/AgentSetupPanel'
import { getAgents, updateAgent, type Agent } from '@/services/agentApi'

export default function AgentsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [loadingAgents, setLoadingAgents] = useState(false)
  const [panelWidth, setPanelWidth] = useState(50) // Percentage width of setup panel
  const [isResizing, setIsResizing] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    setLoadingAgents(true)
    try {
      const loadedAgents = await getAgents()
      setAgents(loadedAgents)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to load agents',
        severity: 'error',
      })
    } finally {
      setLoadingAgents(false)
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleAgentSelect = (agent: Agent) => {
    if (selectedAgent?.id === agent.id) {
      // Deselect if clicking the same agent
      setSelectedAgent(null)
    } else {
      // Select the new agent
      setSelectedAgent(agent)
    }
  }

  const handleRefresh = () => {
    loadAgents()
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !selectedAgent) return

      const container = document.getElementById('agents-container')
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const relativeX = e.clientX - containerRect.left
      const totalWidth = containerRect.width
      const rightPercentage = ((totalWidth - relativeX) / totalWidth) * 100

      // Limit panel width between 30% and 70%
      const newPanelWidth = Math.max(30, Math.min(70, rightPercentage))
      setPanelWidth(newPanelWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    } else {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, selectedAgent])

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, p: 1, m: 0, display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Create and debug your agents
        </Typography>

        {/* Tabs and Action Buttons */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button variant="contained" size="small" sx={{ textTransform: 'none' }}>
              + New agent
            </Button>
            <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={handleRefresh} disabled={loadingAgents}>
              <RefreshIcon />
            </IconButton>
          </Box>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ minHeight: 'auto' }}>
            <Tab label="My agents" sx={{ textTransform: 'none', minHeight: 'auto', py: 1 }} />
            <Tab label="My threads" sx={{ textTransform: 'none', minHeight: 'auto', py: 1 }} />
          </Tabs>
        </Box>

        {/* Split View: Table and Setup Panel */}
        <Box id="agents-container" sx={{ display: 'flex', gap: 0, flexGrow: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Left: Agents Table */}
          <Box sx={{ flex: selectedAgent ? `0 0 ${100 - panelWidth}%` : '1 1 auto', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Search and Filter */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
              <TextField
                placeholder="Search"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ flexGrow: 1, maxWidth: 400 }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
                sx={{ textTransform: 'none' }}
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ColumnsIcon />}
                sx={{ textTransform: 'none' }}
              >
                Columns
              </Button>
            </Box>

            {/* Agents Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: 1, borderColor: 'divider', flexGrow: 1, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', width: 40 }}></TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Model</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      Created
                      <ArrowDownIcon sx={{ fontSize: 16, verticalAlign: 'middle', ml: 0.5 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem' }}>Tools</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow
                      key={agent.id}
                      hover
                      onClick={() => handleAgentSelect(agent)}
                      sx={{ cursor: 'pointer', bgcolor: selectedAgent?.id === agent.id ? 'action.selected' : 'inherit' }}
                    >
                      <TableCell>
                        {selectedAgent?.id === agent.id && (
                          <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{agent.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem', fontFamily: 'monospace' }}>
                        {agent.id}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{agent.model}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{agent.created}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{agent.description || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{agent.tools || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button
                  size="small"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  sx={{ textTransform: 'none' }}
                >
                  &lt; Prev
                </Button>
                <Button
                  size="small"
                  disabled={agents.length < rowsPerPage}
                  onClick={() => setPage(page + 1)}
                  sx={{ textTransform: 'none' }}
                >
                  Next &gt;
                </Button>
              </Box>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <Select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  sx={{
                    fontSize: '0.875rem',
                    height: 32,
                    '& .MuiSelect-select': {
                      py: 0.5,
                    },
                  }}
                >
                  <MenuItem value={10}>10/Page</MenuItem>
                  <MenuItem value={25}>25/Page</MenuItem>
                  <MenuItem value={50}>50/Page</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Resizable Divider */}
          {selectedAgent && (
            <Box
              onMouseDown={handleMouseDown}
              sx={{
                width: 4,
                minWidth: 4,
                cursor: 'col-resize',
                bgcolor: 'divider',
                userSelect: 'none',
                position: 'relative',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  bgcolor: 'primary.main',
                },
                '&:active': {
                  bgcolor: 'primary.dark',
                },
                transition: isResizing ? 'none' : 'background-color 0.2s',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 1,
                  bgcolor: 'divider',
                  transform: 'translateX(-50%)',
                },
              }}
            />
          )}

          {/* Right: Setup Panel */}
          {selectedAgent && (
            <Box sx={{ flex: `0 0 ${panelWidth}%`, display: 'flex', flexDirection: 'column', pl: 2, minWidth: 0, borderLeft: 1, borderColor: 'divider', overflow: 'auto' }}>
              <AgentSetupPanel
                agent={selectedAgent}
                onSave={async (agentId, updates) => {
                  try {
                    const updatedAgent = await updateAgent(agentId, updates)
                    // Refresh agents list after update
                    await loadAgents()
                    // Update selected agent if it's the same one
                    if (selectedAgent.id === agentId) {
                      setSelectedAgent(updatedAgent)
                    }
                    return updatedAgent
                  } catch (error) {
                    throw error
                  }
                }}
                onShowMessage={(message, severity) => {
                  setSnackbar({ open: true, message, severity: severity as 'success' | 'error' | 'info' | 'warning' })
                }}
                showPlaygroundButton={true}
                onPlaygroundClick={() => {
                  // TODO: Implement playground functionality
                  setSnackbar({ open: true, message: 'Playground functionality coming soon', severity: 'info' })
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbar for notifications */}
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
