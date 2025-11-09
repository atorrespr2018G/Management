'use client'

import React from 'react'
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material'
import { ReactNode } from 'react'

interface FeatureCardProps {
  title: string
  description: string
  icon?: ReactNode
  image?: string
}

export default function FeatureCard({ title, description, icon, image }: FeatureCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {image && <CardMedia component="img" height="200" image={image} alt={title} />}
      <CardContent sx={{ flexGrow: 1 }}>
        {icon && (
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
            {icon}
          </Box>
        )}
        <Typography gutterBottom variant="h5" component="h2" align="center">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}



