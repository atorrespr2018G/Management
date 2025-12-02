'use client'

import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'
import {
  Container,
  Card,
  CardContent,
  Button,
  Typography,
} from '@mui/material'
import { clearResults } from '@/store/slices/scannerSlice'
import ScanResultsDisplay from '@/components/ScanResultsDisplay'

export default function ResultsPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const { scanResults } = useSelector((state: any) => state.scanner)

  if (!scanResults) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No scan results available
            </Typography>
            <Button variant="contained" onClick={() => router.push('/scanner')}>
              Start Scanning
            </Button>
          </CardContent>
        </Card>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ScanResultsDisplay
        scanResults={scanResults}
        areActionsEnabled={true}
        onClearResults={() => dispatch(clearResults())}
        onScanAgain={() => router.push('/scanner')}
      />
    </Container>
  )
}

