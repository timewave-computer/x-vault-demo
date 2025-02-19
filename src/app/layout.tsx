import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { Providers } from '@/components/Providers'

/**
 * Application metadata configuration
 * Defines SEO and browser-related settings
 */
export const metadata: Metadata = {
  title: 'X—Vault Demo',
  description: 'A simple web application for interacting with ERC-4626 vault contracts.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.svg',
  },
}

/**
 * Root layout component
 * Provides the basic structure for all pages:
 * - HTML and body tags
 * - Provider context
 * - Header and footer
 * - Main content area with responsive padding
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* Flex container for sticky footer */}
          <div className="min-h-screen flex flex-col">
            <Header />
            {/* Main content area with responsive container */}
            <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
} 