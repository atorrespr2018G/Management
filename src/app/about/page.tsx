'use client'

import React from 'react'
import { Box, Container, Typography, Paper, Grid } from '@mui/material'
import InfoIcon from '@mui/icons-material/Info'
import HistoryIcon from '@mui/icons-material/History'
import MissionIcon from '@mui/icons-material/Flag'

export default function AboutPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          About Us
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Learn more about our mission, our history, and our values
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
            <InfoIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Who We Are
            </Typography>
            <Typography variant="body1" color="text.secondary">
              We are a team of passionate developers building modern web applications with the
              latest technologies and best practices.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
            <MissionIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Our Mission
            </Typography>
            <Typography variant="body1" color="text.secondary">
              To create exceptional digital experiences that are fast, secure, and user-friendly
              while maintaining the highest code quality standards.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center', height: '100%' }}>
            <HistoryIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Our History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Founded with a vision to revolutionize web development through innovative solutions
              and cutting-edge technology.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Our Values
        </Typography>
        <Typography variant="body1" paragraph color="text.secondary">
          At the core of everything we do are our fundamental values:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <li>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>Innovation:</strong> We constantly explore new technologies and methodologies
              to stay ahead of the curve.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>Quality:</strong> We believe in writing clean, maintainable, and well-tested
              code.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>User Experience:</strong> Every decision we make prioritizes the end-user
              experience.
            </Typography>
          </li>
          <li>
            <Typography variant="body1" color="text.secondary" paragraph>
              <strong>Collaboration:</strong> We foster a culture of teamwork and knowledge
              sharing.
            </Typography>
          </li>
        </Box>
      </Paper>
    </Container>
  )
}



