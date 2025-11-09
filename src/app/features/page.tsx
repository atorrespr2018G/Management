'use client'

import React from 'react'
import { Box, Container, Typography, Grid, Paper, Chip } from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import FeatureCard from '@/components/Cards/FeatureCard'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import CodeIcon from '@mui/icons-material/Code'
import CloudIcon from '@mui/icons-material/Cloud'
import StorageIcon from '@mui/icons-material/Storage'
import PaletteIcon from '@mui/icons-material/Palette'

export default function FeaturesPage() {
  const features = [
    {
      title: 'Next.js 14 App Router',
      description:
        'Leverage the power of the new App Router for better performance, layouts, and server components.',
      icon: <SpeedIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Redux Toolkit',
      description:
        'Efficient state management with Redux Toolkit, featuring simplified actions and reducers.',
      icon: <StorageIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Material UI v5',
      description:
        'Beautiful, accessible components with Material Design principles and custom theming.',
      icon: <PaletteIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'TypeScript',
      description:
        'Full TypeScript support for type safety, better IDE support, and improved developer experience.',
      icon: <CodeIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Responsive Design',
      description:
        'Mobile-first approach ensuring your application looks great on all devices and screen sizes.',
      icon: <CloudIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Security First',
      description:
        'Built-in security best practices and protection against common web vulnerabilities.',
      icon: <SecurityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
  ]

  const benefits = [
    'Server-Side Rendering (SSR)',
    'Static Site Generation (SSG)',
    'API Routes',
    'Image Optimization',
    'Automatic Code Splitting',
    'Hot Module Replacement',
    'Type-Safe Redux Store',
    'Middleware Support',
    'DevTools Integration',
    'Component Library',
    'Theme Customization',
    'Accessibility (a11y)',
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Features & Capabilities
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Everything you need to build modern web applications
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 8 }}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <FeatureCard
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          </Grid>
        ))}
      </Grid>

      <Paper elevation={3} sx={{ p: 4, mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="primary" />
          Key Benefits
        </Typography>
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {benefits.map((benefit, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon color="success" sx={{ fontSize: 20 }} />
                <Typography variant="body1">{benefit}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Performance
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Our application is optimized for speed with automatic code splitting, image
              optimization, and server-side rendering for lightning-fast page loads.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="SSR" color="primary" />
              <Chip label="SSG" color="primary" />
              <Chip label="Code Splitting" color="primary" />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              Developer Experience
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Built with developer productivity in mind. TypeScript, hot reloading, and excellent
              tooling make development a joy.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="TypeScript" color="secondary" />
              <Chip label="Hot Reload" color="secondary" />
              <Chip label="DevTools" color="secondary" />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}



