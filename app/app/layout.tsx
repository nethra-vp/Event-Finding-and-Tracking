import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Eventide | Plans made social',
  description: 'Find the next thing worth showing up for.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}