'use client'

import React, { useState } from 'react'
import { Box, Container, Drawer, useTheme, useMediaQuery } from '@mui/material'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onMenuClick={handleDrawerToggle} />
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          <Sidebar onClose={handleDrawerToggle} />
        </Drawer>
        {/* Desktop Permanent Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: desktopOpen ? 240 : 64,
              position: 'relative',
              height: '100%',
              borderTopRightRadius: 3,
              overflow: 'visible',
              borderRight: 'none',
              bgcolor: 'grey.100',
              transition: 'width 0.3s ease',
            },
          }}
          open={desktopOpen}
        >
          <Sidebar onToggle={handleDesktopToggle} isOpen={desktopOpen} />
        </Drawer>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 2,
            m: 0,
            width: { md: desktopOpen ? `calc(100% - 240px)` : `calc(100% - 64px)` },
            transition: 'width 0.3s ease',
            bgcolor: 'background.paper',
          }}
        >
          {children}
        </Box>
      </Box>
      <Footer />
    </Box>
  )
}

