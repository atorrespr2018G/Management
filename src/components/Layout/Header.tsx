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
}

export default function Header({ onMenuClick }: HeaderProps) {
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
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', gap: 2, minHeight: '48px !important', py: 0.5 }}>
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
        <Box
          component={Link}
          href="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            textDecoration: 'none',
            color: 'inherit',
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
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Azure AI Foundry
          </Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2, alignItems: 'center', ml: 'auto' }}>
          <Button color="primary" component={Link} href="/">
            Home
          </Button>
          <Button color="primary" component={Link} href="/about">
            About
          </Button>
          <Button color="primary" component={Link} href="/features">
            Features
          </Button>
          {isAuthenticated ? (
            <Typography variant="body2" sx={{ ml: 2 }}>
              {user?.name}
            </Typography>
          ) : (
            <Button color="primary" component={Link} href="/login">
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

