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
  Slider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Link,
  Divider,
  Checkbox,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ViewColumn as ColumnsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
} from '@mui/icons-material'

interface Agent {
  name: string
  id: string
  model: string
  created: string
  description: string
  tools: string
}

const agents: Agent[] = [
    {
      name: 'GraphRAGAgent',
      id: 'asst_F3zxRSJtjOIJYVXLtGGOI0Xx',
      model: 'gpt-4o-mini',
      created: 'Oct 16, 2025 1...',
      description: '',
      tools: '',
    },
    {
      name: 'ReviewAgent',
      id: 'asst_hih0dA6Xc2sC5tRzyaiQyGRF',
      model: 'o3-mini',
      created: 'Oct 14, 2025 1...',
      description: "Classifies the user's re...",
      tools: '',
    },
    {
      name: 'NewsReporterAgent',
      id: 'asst_2CYLm2SZUNQYMPxYrftrgzJB',
      model: 'o3-mini',
      created: 'Oct 14, 2025 9...',
      description: "Classifies the user's re...",
      tools: '',
    },
    {
      name: 'AiSearchAgent',
      id: 'asst_EOiaaKe3CtL5penJUc6ELHrN',
      model: 'o3-mini',
      created: 'Oct 14, 2025 9...',
      description: "Classifies the user's re...",
      tools: '',
    },
    {
      name: 'TriageAgent',
      id: 'asst_wFLqOr6s8dX3Sp1KNfZYwpkZ',
      model: 'o3-mini',
      created: 'Oct 14, 2025 9...',
      description: "Classifies the user's re...",
      tools: '',
    },
  ]

export default function AgentsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [temperature, setTemperature] = useState(1)
  const [topP, setTopP] = useState(1)
  const [instructions, setInstructions] = useState('You are a helpful AI assistant. Be concise and friendly.')
  const [panelWidth, setPanelWidth] = useState(50) // Percentage width of setup panel
  const [isResizing, setIsResizing] = useState(false)

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
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
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
            <Box sx={{ flex: `0 0 ${panelWidth}%`, display: 'flex', flexDirection: 'column', pl: 2, minWidth: 0, borderLeft: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Setup
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayArrowIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  Try in playground
                </Button>
              </Box>

              {/* Agent ID */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
                  Agent ID
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                  {selectedAgent.id}
                </Typography>
              </Box>

              {/* Agent Name */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
                  Agent name
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={selectedAgent.name}
                  sx={{ fontSize: '0.875rem' }}
                />
              </Box>

              {/* Deployment */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
                  Deployment
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <Select
                      value={`${selectedAgent.model} (version:2024-07-18)`}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={`${selectedAgent.model} (version:2024-07-18)`}>
                        {selectedAgent.model} (version:2024-07-18)
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <Link href="#" sx={{ fontSize: '0.875rem', textDecoration: 'none' }}>
                    + Create new deployment
                  </Link>
                </Box>
              </Box>

              {/* Instructions */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontSize: '0.75rem' }}>
                  Instructions
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  size="small"
                  sx={{ fontSize: '0.875rem' }}
                />
              </Box>

              {/* Agent Description */}
              <Accordion sx={{ mb: 1, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Agent Description
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TextField fullWidth size="small" placeholder="Enter description" />
                </AccordionDetails>
              </Accordion>

              {/* Knowledge */}
              <Accordion sx={{ mb: 1, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Knowledge (0)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                    Knowledge gives the agent access to data sources for grounding responses.{' '}
                    <Link href="#" sx={{ fontSize: '0.875rem' }}>
                      Learn more
                    </Link>
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                    + Add
                  </Button>
                </AccordionDetails>
              </Accordion>

              {/* Actions */}
              <Accordion sx={{ mb: 1, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Actions (0)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                    Actions give the agent the ability to perform tasks.{' '}
                    <Link href="#" sx={{ fontSize: '0.875rem' }}>
                      Learn more
                    </Link>
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                    + Add
                  </Button>
                </AccordionDetails>
              </Accordion>

              {/* Connected agents */}
              <Accordion sx={{ mb: 1, boxShadow: 'none', border: 1, borderColor: 'divider' }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Connected agents (0)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary', mb: 1 }}>
                    Hand-off thread context to other agents to focus on specialized tasks.{' '}
                    <Link href="#" sx={{ fontSize: '0.875rem' }}>
                      Learn more
                    </Link>
                  </Typography>
                  <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: 'none' }}>
                    + Add
                  </Button>
                </AccordionDetails>
              </Accordion>

              <Divider sx={{ my: 2 }} />

              {/* Model settings */}
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, fontSize: '0.875rem' }}>
                Model settings
              </Typography>

              {/* Temperature */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Temperature
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {temperature}
                  </Typography>
                </Box>
                <Slider
                  value={temperature}
                  onChange={(e, newValue) => setTemperature(newValue as number)}
                  min={0}
                  max={2}
                  step={0.1}
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>

              {/* Top P */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                    Top P
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                    {topP}
                  </Typography>
                </Box>
                <Slider
                  value={topP}
                  onChange={(e, newValue) => setTopP(newValue as number)}
                  min={0}
                  max={1}
                  step={0.1}
                  valueLabelDisplay="auto"
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}
