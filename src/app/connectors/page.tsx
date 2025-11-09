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
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Dns as DnsIcon,
  Description as DescriptionIcon,
  Article as ArticleIcon,
} from '@mui/icons-material'

interface Connector {
  name: string
  icon: React.ReactNode
}

const connectors: Connector[] = [
  { name: 'Google Drive', icon: <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Microsoft SharePoint', icon: <FolderSharedIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'OneDrive', icon: <CloudQueueIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Dropbox', icon: <CloudUploadIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Amazon S3', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Azure Blob Storage', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'iCloud Drive', icon: <CloudDownloadIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'pCloud', icon: <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'File System / Local Directory', icon: <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'FTP / SFTP', icon: <DnsIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Network Attached Storage (NAS)', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Confluence', icon: <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Slab', icon: <ArticleIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
]

export default function ConnectorsPage() {
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Connectors
        </Typography>

        <Grid container spacing={4}>
          {connectors.map((connector) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={connector.name}>
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
                    <Box sx={{ mb: 1.5 }}>{connector.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {connector.name}
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

