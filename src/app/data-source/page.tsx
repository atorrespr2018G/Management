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
  { name: 'MySQL', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'PostgreSQL', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Microsoft SQL Server', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Oracle Database', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'MongoDB', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Elasticsearch', icon: <DnsIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Snowflake', icon: <CloudIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'BigQuery', icon: <DescriptionIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Databricks', icon: <FolderIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Neo4j (Graph DB)', icon: <DnsIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
  { name: 'Redis', icon: <StorageIcon sx={{ fontSize: 32, color: 'primary.main' }} /> },
]

export default function DataSourcePage() {
  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', m: 0, p: 0 }}>
      <Box sx={{ flexGrow: 1, p: 1, m: 0 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Data Source
        </Typography>

        <Grid container spacing={4}>
          {dataSources.map((dataSource) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={dataSource.name}>
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
                    <Box sx={{ mb: 1.5 }}>{dataSource.icon}</Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
                      {dataSource.name}
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

