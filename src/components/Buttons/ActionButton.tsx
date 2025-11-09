'use client'

import React from 'react'
import { Button, ButtonProps } from '@mui/material'
import Link from 'next/link'

interface ActionButtonProps extends ButtonProps {
  href?: string
  children: React.ReactNode
}

export default function ActionButton({ href, children, ...props }: ActionButtonProps) {
  if (href) {
    return (
      <Button component={Link} href={href} variant="contained" size="large" {...props}>
        {children}
      </Button>
    )
  }

  return (
    <Button variant="contained" size="large" {...props}>
      {children}
    </Button>
  )
}



