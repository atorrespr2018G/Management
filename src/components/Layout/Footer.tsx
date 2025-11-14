'use client'

import React from 'react'
import { Box, Container, Typography, Grid, Link as MuiLink } from '@mui/material'
import Link from 'next/link'

interface FooterProps {
  sidebarOpen?: boolean
}

export default function Footer({ sidebarOpen = false }: FooterProps) {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        py: 4,
        mt: 'auto',
        ml: { md: sidebarOpen ? '320px' : '64px' },
        width: { md: sidebarOpen ? 'calc(100% - 320px)' : 'calc(100% - 64px)' },
        transition: 'margin-left 0.3s ease, width 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              NextJS App
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A modern Next.js application with Redux, Material UI, and advanced routing.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} href="/" color="inherit" underline="hover">
                Home
              </MuiLink>
              <MuiLink component={Link} href="/about" color="inherit" underline="hover">
                About
              </MuiLink>
              <MuiLink component={Link} href="/features" color="inherit" underline="hover">
                Features
              </MuiLink>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" gutterBottom>
              Contact
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Email: info@nextjsapp.com
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Phone: +1 (555) 123-4567
            </Typography>
          </Grid>
        </Grid>
        <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} NextJS App. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}



