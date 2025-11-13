'use client'

import React from 'react'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Paper,
} from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ShareIcon from '@mui/icons-material/Share'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DescriptionIcon from '@mui/icons-material/Description'
import Link from 'next/link'

export default function RAGDashboard() {
  const sources = [
    {
      id: 'local',
      title: 'Local Directory',
      description: 'Scan files from your local machine',
      icon: FolderIcon,
      color: '#2196F3',
      route: '/scanner?source=local',
    },
    {
      id: 'drive',
      title: 'Google Drive',
      description: 'Connect and scan Google Drive',
      icon: CloudUploadIcon,
      color: '#4CAF50',
      route: '/scanner?source=drive',
    },
    {
      id: 'sharepoint',
      title: 'SharePoint',
      description: 'Connect and scan SharePoint',
      icon: ShareIcon,
      color: '#9C27B0',
      route: '/scanner?source=sharepoint',
    },
  ]

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2, color: 'text.primary' }}>
          Welcome to RAG File Scanner
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Choose a source to scan and extract file structures as JSON
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 6 }}>
        {sources.map((source) => {
          const Icon = source.icon
          return (
            <Grid item xs={12} md={4} key={source.id}>
              <Card
                sx={{
                  height: '100%',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: 6,
                  },
                }}
              >
                <CardActionArea component={Link} href={source.route} sx={{ height: '100%', p: 3 }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        bgcolor: source.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        transition: 'transform 0.3s',
                        '&:hover': {
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <Icon sx={{ fontSize: 32, color: 'white' }} />
                    </Box>
                    <Typography variant="h5" component="h3" sx={{ fontWeight: 600, mb: 1 }}>
                      {source.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {source.description}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'primary.main', fontWeight: 500 }}>
                      Get Started
                      <ArrowForwardIcon sx={{ ml: 1, transition: 'transform 0.3s' }} />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      <Paper
        elevation={3}
        sx={{
          p: 4,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <DescriptionIcon sx={{ fontSize: 32, flexShrink: 0 }} />
          <Box>
            <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
              How It Works
            </Typography>
            <Box component="ol" sx={{ pl: 2, m: 0 }}>
              <Typography component="li" sx={{ mb: 1 }}>
                Select a file source (Local, Google Drive, or SharePoint)
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                Authenticate if required (for cloud services)
              </Typography>
              <Typography component="li" sx={{ mb: 1 }}>
                Choose directories to scan
              </Typography>
              <Typography component="li">
                View extracted file structure in JSON format
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  )
}

