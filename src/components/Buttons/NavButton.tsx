'use client'

import React from 'react'
import { Button, ButtonProps } from '@mui/material'
import Link from 'next/link'

interface NavButtonProps extends ButtonProps {
  href?: string
  children: React.ReactNode
}

export default function NavButton({ href, children, ...props }: NavButtonProps) {
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



