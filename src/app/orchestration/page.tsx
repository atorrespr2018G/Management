'use client'

import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Alert,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Info as InfoIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import { useDispatch, useSelector } from 'react-redux'
import { setRlmEnabled } from '@/store/slices/orchestrationSlice'
import type { RootState } from '@/store/store'

const TABS = [
  { id: 'rlm-setup', label: 'RLM Setup', icon: <SettingsIcon /> },
]

export default function OrchestrationPage() {
  const dispatch = useDispatch()
  const rlmEnabled = useSelector((state: RootState) => state.orchestration.rlmEnabled)
  const [activeTab, setActiveTab] = useState('rlm-setup')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tempRlmValue, setTempRlmValue] = useState(rlmEnabled)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleSave = () => {
    dispatch(setRlmEnabled(tempRlmValue))
    setSidebarOpen(false)
  }

  const handleCancel = () => {
    setTempRlmValue(rlmEnabled)
    setSidebarOpen(false)
  }

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ width: { xs: '100%', md: 280 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Orchestration
          </Typography>
          {isMobile && (
            <IconButton size="small" onClick={() => setSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          Configure workflow settings
        </Typography>
      </Box>

      {/* Tabs */}
      <List sx={{ flex: 1, pt: 1 }}>
        {TABS.map((tab) => (
          <ListItemButton
            key={tab.id}
            selected={activeTab === tab.id}
            onClick={() => {
              setActiveTab(tab.id)
              if (isMobile) setSidebarOpen(false)
            }}
            sx={{
              borderLeft: activeTab === tab.id ? 3 : 0,
              borderColor: 'primary.main',
              backgroundColor: activeTab === tab.id ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemIcon>{tab.icon}</ListItemIcon>
            <ListItemText
              primary={tab.label}
              primaryTypographyProps={{
                variant: activeTab === tab.id ? 'subtitle2' : 'body2',
                sx: { fontWeight: activeTab === tab.id ? 600 : 400 },
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'background.default' }}>
      {/* Sidebar - Desktop */}
      {!isMobile && (
        <Paper elevation={3} sx={{ display: { xs: 'none', md: 'flex' }, width: 280 }}>
          {sidebarContent}
        </Paper>
      )}

      {/* Sidebar - Mobile Drawer */}
      <Drawer
        anchor="left"
        open={sidebarOpen && isMobile}
        onClose={() => setSidebarOpen(false)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'auto',
          backgroundColor: 'background.default',
        }}
      >
        {/* Mobile Header with Menu Button */}
        {isMobile && (
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <IconButton size="small" onClick={() => setSidebarOpen(true)}>
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Orchestration Settings
              </Typography>
            </Box>
          </Box>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <SettingsIcon sx={{ fontSize: 32 }} />
              <Typography variant="h4" sx={{ fontWeight: 600 }}>
                Orchestration Settings
              </Typography>
            </Box>
          </Box>
        )}

        {/* Content Area */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {activeTab === 'rlm-setup' && (
            <Paper elevation={2} sx={{ p: 4, maxWidth: 600 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <SettingsIcon sx={{ fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  RLM Setup
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Description */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enable or disable Recursive Language Model (RLM) mode for workflow execution. When enabled, the system
                performs file-level expansion and recursive summarization for more comprehensive answers with
                chunk-level citations.
              </Typography>

              {/* Radio Group */}
              <Box sx={{ mb: 4, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  RLM Mode
                </Typography>
                <RadioGroup
                  value={tempRlmValue ? 'enabled' : 'disabled'}
                  onChange={(e) => setTempRlmValue(e.target.value === 'enabled')}
                >
                  <FormControlLabel
                    value="disabled"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Disabled (Default)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Use standard sequential workflow
                        </Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="enabled"
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Enabled (Experimental)
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Use RLM-based retrieval and answering
                        </Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>

              {/* Info Alert */}
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="caption" color="inherit">
                  Changes apply per-execution and do not modify global defaults.
                </Typography>
              </Alert>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="contained" onClick={handleSave}>
                  Save and Exit
                </Button>
              </Box>

              {/* Current Status */}
              <Divider sx={{ my: 3 }} />
              <Box sx={{ p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Current Status
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  RLM: <strong>{rlmEnabled ? '🟢 Enabled' : '🔴 Disabled'}</strong>
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  )
}
