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
  Description as DescriptionIcon,
  Work as WorkIcon,
} from '@mui/icons-material'

interface Enterprise {
  name: string
  icon: React.ReactNode
}

const enterprises: Enterprise[] = [
  { name: 'Salesforce', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'SAP', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'ServiceNow', icon: <FolderIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Zendesk', icon: <CloudQueueIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Workday', icon: <WorkIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'NetSuite', icon: <FolderSharedIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Jira', icon: <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
]

export default function EnterprisePage() {
  const [selectedEnterprise, setSelectedEnterprise] = useState<Enterprise | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCardClick = (enterprise: Enterprise) => {
    setSelectedEnterprise(enterprise)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedEnterprise(null)
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Enterprise
        </Typography>

        <Grid container spacing={4}>
          {enterprises.map((enterprise) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={enterprise.name}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 400, mx: 'auto' }}>
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => handleCardClick(enterprise)}>
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
                    <Box sx={{ mb: 3 }}>{enterprise.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem' }}>
                      {enterprise.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Enterprise Modal */}
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
            {selectedEnterprise?.icon}
            <Typography variant="h5">{selectedEnterprise?.name}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Configure your {selectedEnterprise?.name} enterprise integration settings here.
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

