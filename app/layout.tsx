import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata: Metadata = {
  title: 'LeadDesk',
  description: 'Created by Zyris',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Zyris Logo.png" type="image/png" />
      </head>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

export function Head() {
  return (
    <>
      <link rel="icon" href="/Zyris Logo.png" type="image/png" />
    </>
  );
}
