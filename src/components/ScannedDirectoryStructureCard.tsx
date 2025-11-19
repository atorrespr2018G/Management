'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import DatabaseIcon from '@mui/icons-material/Storage'
import DirectoryNodeStructure from './DirectoryNodeStructure'
import { DirectoryStructuresProps } from '@/types/components';


// interface ScannedDirectoryStructureCardProps {
//   node: any
//   machineId: string | null
//   storeMessage: string | undefined
//   isStoring: boolean
//   onStoreInNeo4j: () => void
//   fetchNeo4jStructure: () => Promise<void>
// }


export default function ScannedDirectoryStructureCard({
  node,
  machineId,
  storeMessage,
  isStoring,
  onStoreInNeo4j,
  fetchNeo4jStructure,
}: DirectoryStructuresProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const dataStr = JSON.stringify(node, null, 2)
    navigator.clipboard.writeText(dataStr).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleDownload = () => {
    const dataStr = JSON.stringify(node, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `scan-results-${new Date().toISOString()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header row */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography whiteSpace="nowrap" fontWeight={600}>
              Directory Structure (Scanned)
            </Typography>
            <Chip
              label="LOCAL"
              size="small"
              sx={{ bgcolor: 'grey.200', color: 'grey.700' }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              size="small"
              onClick={onStoreInNeo4j}
              disabled={isStoring || !machineId}
              startIcon={
                isStoring ? <CircularProgress size={16} /> : <DatabaseIcon />
              }
            >
              {isStoring ? 'Storing...' : 'Store in Neo4j'}
            </Button>
            <IconButton onClick={handleCopy} size="small">
              <ContentCopyIcon />
            </IconButton>
            <IconButton onClick={handleDownload} size="small">
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Alerts */}
        {copied && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Copied to clipboard!
          </Alert>
        )}
        {storeMessage && (
          <Alert
            severity={storeMessage.includes('❌') ? 'error' : 'success'}
            sx={{ mb: 2 }}
          >
            {storeMessage}
          </Alert>
        )}

        {/* Tree */}
        <Box sx={{ pt: 0 }}>
          <DirectoryNodeStructure
            node={node}
            fetchNeo4jStructure={fetchNeo4jStructure}
          />
        </Box>
      </CardContent>
    </Card>
  )
}
