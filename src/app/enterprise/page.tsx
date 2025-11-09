'use client'

import React from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material'
import {
  Cloud as CloudIcon,
  Storage as StorageIcon,
  Folder as FolderIcon,
  CloudQueue as CloudQueueIcon,
  FolderShared as FolderSharedIcon,
  Description as DescriptionIcon,
  Work as WorkIcon,
} from '@mui/icons-material'

interface Enterprise {
  name: string
  icon: React.ReactNode
}

const enterprises: Enterprise[] = [
  { name: 'Salesforce', icon: <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'SAP', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'ServiceNow', icon: <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Zendesk', icon: <CloudQueueIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Workday', icon: <WorkIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'NetSuite', icon: <FolderSharedIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Jira', icon: <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
]

export default function EnterprisePage() {
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Enterprise
        </Typography>

        <Grid container spacing={4}>
          {enterprises.map((enterprise) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={enterprise.name}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 200, mx: 'auto' }}>
                <CardActionArea sx={{ height: '100%', p: 1.5 }}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: 120,
                      p: 1.5,
                    }}
                  >
                    <Box sx={{ mb: 1.5 }}>{enterprise.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {enterprise.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  )
}

