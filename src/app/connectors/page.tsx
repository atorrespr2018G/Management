'use client'

import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
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
  { name: 'Google Drive', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Microsoft SharePoint', icon: <FolderSharedIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'OneDrive', icon: <CloudQueueIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Dropbox', icon: <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Amazon S3', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Azure Blob Storage', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'iCloud Drive', icon: <CloudDownloadIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'pCloud', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'File System / Local Directory', icon: <FolderIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'FTP / SFTP', icon: <DnsIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Network Attached Storage (NAS)', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Confluence', icon: <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Slab', icon: <ArticleIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
]

export default function ConnectorsPage() {
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCardClick = (connector: Connector) => {
    setSelectedConnector(connector)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedConnector(null)
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Connectors
        </Typography>

        <Grid container spacing={4}>
          {connectors.map((connector) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={connector.name}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 400, mx: 'auto' }}>
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => handleCardClick(connector)}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      minHeight: 240,
                      p: 3,
                    }}
                  >
                    <Box sx={{ mb: 3 }}>{connector.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem' }}>
                      {connector.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Connector Modal */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: '80vw',
            maxWidth: '1600px',
            height: '80vh',
            maxHeight: '1200px',
            m: 2,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {selectedConnector?.icon}
            <Typography variant="h5">{selectedConnector?.name}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Configure your {selectedConnector?.name} connector settings here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleClose}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

