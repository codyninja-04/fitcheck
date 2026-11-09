import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Inter } from 'next/font/google'
import './globals.css'

const sans = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: { default: 'FitCheck · Does this look okay?', template: '%s · FitCheck' },
  description: 'Snap your outfit, say where you are going, and get an honest second opinion on fit, colour and whether it suits the occasion.',
  applicationName: 'FitCheck',
  icons: { icon: '/icon.svg', apple: '/icon-192.png' },
  appleWebApp: { capable: true, title: 'FitCheck', statusBarStyle: 'default' },
}

export const viewport: Viewport = {
  themeColor: '#FAFAFA',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
