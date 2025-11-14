'use client'

import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import { useAppSelector } from '@/store/hooks'

interface HeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export default function Header({ onMenuClick, sidebarOpen = false }: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)
  const user = useAppSelector((state) => state.user.currentUser)

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'grey.100',
        color: 'text.primary',
        overflow: 'visible',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        ml: { md: sidebarOpen ? '320px' : '64px' },
        width: { md: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 64px)' },
        transition: 'margin-left 0.3s ease, width 0.3s ease',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: '64px !important', py: 1, position: 'relative' }}>
        {isMobile && (
          <IconButton
            edge="start"
            color="primary"
            aria-label="menu"
            onClick={onMenuClick}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}
        {/* Logo in Sidebar Area */}
        <Box
          component={Link}
          href="/"
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
            position: 'absolute',
            left: { md: sidebarOpen ? '-304px' : '-48px' },
            top: '50%',
            transform: 'translateY(-50%)',
            pl: { md: sidebarOpen ? 6 : 2 },
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            A
          </Box>
          {sidebarOpen && (
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
              RAG Management
            </Typography>
          )}
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center', ml: 'auto' }}>
          <Button color="primary" component={Link} href="/" sx={{ fontSize: '1.1rem', py: 1 }}>
            Home
          </Button>
          <Button color="primary" component={Link} href="/about" sx={{ fontSize: '1.1rem', py: 1 }}>
            About
          </Button>
          <Button color="primary" component={Link} href="/features" sx={{ fontSize: '1.1rem', py: 1 }}>
            Features
          </Button>
          <Button color="primary" component={Link} href="/rag-dashboard" sx={{ fontSize: '1.1rem', py: 1 }}>
            RAG Dashboard
          </Button>
          <Button color="primary" component={Link} href="/scanner" sx={{ fontSize: '1.1rem', py: 1 }}>
            Scanner
          </Button>
          <Button color="primary" component={Link} href="/results" sx={{ fontSize: '1.1rem', py: 1 }}>
            Results
          </Button>
          <Button color="primary" component={Link} href="/retrieve" sx={{ fontSize: '1.1rem', py: 1 }}>
            Retrieve
          </Button>
          {isAuthenticated ? (
            <Typography variant="body2" sx={{ ml: 2, fontSize: '1.1rem' }}>
              {user?.name}
            </Typography>
          ) : (
            <Button color="primary" component={Link} href="/login" sx={{ fontSize: '1.1rem', py: 1 }}>
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

