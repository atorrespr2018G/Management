'use client'

import React, { useEffect, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import LogoutIcon from '@mui/icons-material/Logout'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { logoutUser, fetchCurrentUser } from '@/store/slices/userSlice'

interface HeaderProps {
  onMenuClick?: () => void
  sidebarOpen?: boolean
}

export default function Header({ onMenuClick, sidebarOpen = false }: HeaderProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)
  const user = useAppSelector((state) => state.user.currentUser)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const menuOpen = Boolean(anchorEl)

  // Restore session on mount (only once)
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch(fetchCurrentUser())
    }
  }, [])

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = async () => {
    handleMenuClose()
    await dispatch(logoutUser())
    router.push('/login')
  }

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
              RAG Management Tool
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
          <Button color="primary" component={Link} href="/retrieve" sx={{ fontSize: '1.1rem', py: 1 }}>
            Retrieve
          </Button>
          {isAuthenticated ? (
            <>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={menuOpen ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={menuOpen}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
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

