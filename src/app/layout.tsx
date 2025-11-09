import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReduxProvider } from '@/store/Provider'
import { ThemeProvider } from '@/components/Providers/ThemeProvider'
import MainLayout from '@/components/Layout/MainLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NextJS Advanced App',
  description: 'A modern Next.js application with Redux, Material UI, and advanced routing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          <ThemeProvider>
            <MainLayout>{children}</MainLayout>
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  )
}

