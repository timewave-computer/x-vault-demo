'use client'

import { WagmiProvider } from '@/providers/WagmiProvider'
import { useEffect, useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    // Check if the fonts are loaded
    document.fonts.ready.then(() => {
      setFontsLoaded(true)
    })
  }, [])

  return (
    <div className={fontsLoaded ? 'fonts-loaded' : 'fonts-loading'}>
      <WagmiProvider>
        {children}
      </WagmiProvider>
    </div>
  )
} 