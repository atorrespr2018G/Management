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
  Storage as StorageIcon,
  Cloud as CloudIcon,
  Dns as DnsIcon,
  Description as DescriptionIcon,
  Folder as FolderIcon,
} from '@mui/icons-material'

interface DataSource {
  name: string
  icon: React.ReactNode
}

const dataSources: DataSource[] = [
  { name: 'MySQL', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'PostgreSQL', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Microsoft SQL Server', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Oracle Database', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'MongoDB', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Elasticsearch', icon: <DnsIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Snowflake', icon: <CloudIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'BigQuery', icon: <DescriptionIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Databricks', icon: <FolderIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Neo4j (Graph DB)', icon: <DnsIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
  { name: 'Redis', icon: <StorageIcon sx={{ fontSize: 64, color: 'primary.main' }} /> },
]

export default function DataSourcePage() {
  const [selectedDataSource, setSelectedDataSource] = useState<DataSource | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCardClick = (dataSource: DataSource) => {
    setSelectedDataSource(dataSource)
    setDialogOpen(true)
  }

  const handleClose = () => {
    setDialogOpen(false)
    setSelectedDataSource(null)
  }

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Data Source
        </Typography>

        <Grid container spacing={4}>
          {dataSources.map((dataSource) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dataSource.name}>
              <Card elevation={2} sx={{ height: '100%', maxWidth: 400, mx: 'auto' }}>
                <CardActionArea sx={{ height: '100%', p: 3 }} onClick={() => handleCardClick(dataSource)}>
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
                    <Box sx={{ mb: 3 }}>{dataSource.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '1.75rem' }}>
                      {dataSource.name}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Data Source Modal */}
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
            {selectedDataSource?.icon}
            <Typography variant="h5">{selectedDataSource?.name}</Typography>
          </Box>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Configure your {selectedDataSource?.name} data source settings here.
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

