'use client'

import React from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import CodeIcon from '@mui/icons-material/Code'
import CloudIcon from '@mui/icons-material/Cloud'
import HeroSection from '@/components/Hero/HeroSection'
import FeatureCard from '@/components/Cards/FeatureCard'
import { useAppSelector, useAppDispatch } from '@/store/hooks'
import { increment, decrement } from '@/store/slices/counterSlice'
import { Button, Stack } from '@mui/material'

export default function HomePage() {
  const count = useAppSelector((state) => state.counter.value)
  const dispatch = useAppDispatch()

  const features = [
    {
      title: 'Fast Performance',
      description:
        'Built with Next.js for optimal performance and server-side rendering capabilities.',
      icon: <SpeedIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Secure by Default',
      description:
        'Enterprise-grade security features built into every component of the application.',
      icon: <SecurityIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Modern Stack',
      description:
        'Powered by React, TypeScript, Redux Toolkit, and Material UI for a robust development experience.',
      icon: <CodeIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
    {
      title: 'Cloud Ready',
      description:
        'Deploy anywhere with support for Vercel, AWS, Azure, and other cloud platforms.',
      icon: <CloudIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
    },
  ]

  return (
    <Box>
      <HeroSection
        title="Welcome to NextJS Advanced App"
        subtitle="Experience the power of modern web development with Next.js, Redux, Material UI, and advanced routing. Build scalable applications with confidence."
        primaryAction={{ label: 'Get Started', href: '/features' }}
        secondaryAction={{ label: 'Learn More', href: '/about' }}
      />

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" component="h2" align="center" gutterBottom sx={{ mb: 6 }}>
          Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <FeatureCard
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
              />
            </Grid>
          ))}
        </Grid>
      </Container>

      <Box
        sx={{
          bgcolor: 'background.default',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <Typography variant="h4" component="h2" gutterBottom>
              Redux State Management Demo
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
              This is a live demonstration of Redux state management integrated with Next.js
            </Typography>
            <Card sx={{ maxWidth: 400, mx: 'auto', mb: 4 }}>
              <CardContent>
                <Typography variant="h2" component="div" color="primary" gutterBottom>
                  {count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Counter Value
                </Typography>
              </CardContent>
            </Card>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                onClick={() => dispatch(increment())}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              >
                Increment
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={() => dispatch(decrement())}
                sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
              >
                Decrement
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h4" component="h2" gutterBottom>
              Built with Modern Technologies
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              Our application leverages the latest web technologies to provide a seamless user
              experience. From server-side rendering to client-side state management, every aspect
              is optimized for performance and developer experience.
            </Typography>
            <Typography variant="body1" paragraph color="text.secondary">
              With Next.js 14, we utilize the App Router for efficient routing, React 18 for
              component rendering, Redux Toolkit for state management, and Material UI for a
              beautiful, accessible design system.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4 }}>
              <Typography variant="h6" gutterBottom>
                Tech Stack
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>Next.js 14 with App Router</li>
                <li>React 18 with TypeScript</li>
                <li>Redux Toolkit for State Management</li>
                <li>Material UI v5 Components</li>
                <li>Advanced Routing & Navigation</li>
                <li>Responsive Design</li>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}



