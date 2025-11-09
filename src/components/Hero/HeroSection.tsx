'use client'

import React from 'react'
import { Box, Typography, Container, Grid, useTheme } from '@mui/material'
import ActionButton from '../Buttons/ActionButton'

interface HeroSectionProps {
  title: string
  subtitle: string
  primaryAction?: {
    label: string
    href: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export default function HeroSection({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
}: HeroSectionProps) {
  const theme = useTheme()

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        pt: 8,
        pb: 6,
        background: `linear-gradient(135deg, ${theme.palette.primary.light}15 0%, ${theme.palette.secondary.light}15 100%)`,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography
              component="h1"
              variant="h2"
              align="left"
              color="text.primary"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              {title}
            </Typography>
            <Typography variant="h5" align="left" color="text.secondary" paragraph>
              {subtitle}
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {primaryAction && (
                <ActionButton href={primaryAction.href}>{primaryAction.label}</ActionButton>
              )}
              {secondaryAction && (
                <ActionButton
                  href={secondaryAction.href}
                  variant="outlined"
                  color="primary"
                >
                  {secondaryAction.label}
                </ActionButton>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}



