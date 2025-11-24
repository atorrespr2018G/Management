'use client'

import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  CardHeader,
  Stack,
} from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DownloadIcon from '@mui/icons-material/Download'
import DatabaseIcon from '@mui/icons-material/Storage'
import DirectoryNodeStructure from './DirectoryNodeStructure'
import { DirectoryStructuresProps } from '@/types/components';
import { TimedAlert } from '@/components/TimedAlert';
import { DirectoryStructureContainer } from './DirectoryStructureContainer';

export default function ScannedDirectoryStructureCard({
  node,
  machineId,
  storeMessage,
  isStoring,
  onStoreInNeo4j,
  fetchNeo4jStructure,
  areActionsEnabled = true
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
    <DirectoryStructureContainer
      title="Directory Structure"
      chipLabel="LOCAL"
      chipColor="warning"
      actions={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {areActionsEnabled && (
            <Button
              variant="contained"
              size="large"
              onClick={onStoreInNeo4j}
              // disabled={(isStoring || !machineId) && showStoreButton}
              disabled={isStoring || !machineId}
              startIcon={
                isStoring ? <CircularProgress size={16} /> : <DatabaseIcon />
              }
            >
              {isStoring ? 'Storing...' : 'Store in Neo4j'}
            </Button>
          )}
          <IconButton onClick={handleCopy} size="small">
            <ContentCopyIcon />
          </IconButton>
          <IconButton onClick={handleDownload} size="small">
            <DownloadIcon />
          </IconButton>
        </Box>
      }
      alerts={
        <>
          {copied && (
            <TimedAlert
              sx={{ mb: 2 }}
              message="Copied to clipboard!"
              severity="success"
              durationMs={2000}
              onClose={() => setCopied(false)}
            />
          )}

          {storeMessage && (
            <TimedAlert
              sx={{ mb: 2 }}
              message={storeMessage}
              severity={storeMessage.includes('❌') ? 'error' : 'success'}
              durationMs={4000}
            />
          )}
        </>
      }
    >
      <DirectoryNodeStructure
        node={node}
        fetchNeo4jStructure={fetchNeo4jStructure}
        areActionsEnabled={areActionsEnabled}
      />
    </DirectoryStructureContainer>
  )
}
