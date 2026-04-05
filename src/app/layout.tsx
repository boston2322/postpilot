import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PostPilot - AI-Powered Social Media Automation',
  description:
    'Automate your social media with AI. Schedule posts, generate content, and grow your brand on autopilot.',
  keywords: ['social media', 'automation', 'AI', 'scheduling', 'marketing'],
  openGraph: {
    title: 'PostPilot',
    description: 'AI-Powered Social Media Automation',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
