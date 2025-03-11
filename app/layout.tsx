import type { Metadata, Viewport } from 'next'
import '@/app/globals.css'
import AuthGuard from '@/components/AuthGuard'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    template: '%s | MacDash',
    default: 'MacDash',
  },
  description: 'Next.js 15 Dashboard Template',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  authors: [{ name: 'Ishant Yadav' }],
  creator: 'Ishant Yadav',
  keywords: ['dashboard', 'admin', 'template', 'nextjs', 'react'],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-gray-400 font-plus-jakarta text-sm/[22px] font-normal text-gray antialiased">
        <AuthGuard>{children}</AuthGuard>
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
