'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
} from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import ShareIcon from '@mui/icons-material/Share'
import ScannerIcon from '@mui/icons-material/Scanner'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { setSource, setLoading, setError, setScanResults } from '@/store/slices/scannerSlice'
import type { ScanSource } from '@/types/scanner'

// Use Next.js API routes (relative path for same-origin requests)
const API_URL = '/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

export default function ScannerPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useDispatch()
  const { isLoading, error } = useSelector((state: any) => state.scanner)
  
  const [source, setSourceType] = useState<ScanSource>(
    (searchParams.get('source') as ScanSource) || 'local'
  )
  const [tabValue, setTabValue] = useState(0)
  const [directoryPath, setDirectoryPath] = useState('')

  useEffect(() => {
    dispatch(setSource(source))
    // Set tab based on source
    const sourceMap: Record<ScanSource, number> = { local: 0, drive: 1, sharepoint: 2 }
    setTabValue(sourceMap[source] || 0)
  }, [source, dispatch])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    const sources: ScanSource[] = ['local', 'drive', 'sharepoint']
    setSourceType(sources[newValue])
    dispatch(setSource(sources[newValue]))
  }

  const handleLocalScan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      dispatch(setLoading(true))
      dispatch(setError(null))
      
      const response = await fetch(`${API_URL}/local/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directoryPath }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to scan directory' }))
        throw new Error(errorData.error || 'Failed to scan directory')
      }

      const result = await response.json()
      dispatch(setScanResults(result))
      router.push('/results')
    } catch (err) {
      dispatch(setError(err instanceof Error ? err.message : 'Failed to scan directory'))
    } finally {
      dispatch(setLoading(false))
    }
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 4 }}>
        File Scanner
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
          <Tab icon={<FolderIcon />} label="Local" />
          <Tab icon={<CloudUploadIcon />} label="Google Drive" />
          <Tab icon={<ShareIcon />} label="SharePoint" />
        </Tabs>
      </Paper>

      <Card>
        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Scan Local Directory
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter the path to the directory you want to scan
              </Typography>
              <form onSubmit={handleLocalScan}>
                <TextField
                  fullWidth
                  label="Directory Path"
                  placeholder="C:\Users\Username\Documents or /home/user/documents"
                  value={directoryPath}
                  onChange={(e) => setDirectoryPath(e.target.value)}
                  required
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={isLoading}
                  startIcon={isLoading ? <CircularProgress size={20} /> : <ScannerIcon />}
                >
                  {isLoading ? 'Scanning...' : 'Scan Directory'}
                </Button>
              </form>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Scan Google Drive
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Authenticate with Google Drive to scan your files
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Google Drive integration requires the scanning server to be running.
                This feature will be implemented in a future update.
              </Alert>
              <Button variant="contained" fullWidth disabled>
                Authenticate with Google Drive
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Scan SharePoint
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter your SharePoint credentials to authenticate
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                SharePoint integration requires the scanning server to be running.
                This feature will be implemented in a future update.
              </Alert>
              <Button variant="contained" fullWidth disabled>
                Authenticate and Scan SharePoint
              </Button>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  )
}

