'use client'

import { initializePaddle, Paddle, Environments } from '@paddle/paddle-js'
import { createContext, useContext, useEffect, useState } from 'react'

const PaddleContext = createContext<Paddle | undefined>(undefined)

export function PaddleProvider({ children }: { children: React.ReactNode }) {
  const [paddle, setPaddle] = useState<Paddle>()

  useEffect(() => {
    // 确保只在客户端运行
    if (typeof window !== 'undefined') {
      initializePaddle({
        environment: (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || 'sandbox') as Environments,
        token: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN!,
        checkout: {
          settings: {
            displayMode: 'overlay',
            theme: 'light',
            locale: 'zh-Hans',
          }
        }
      }).then(
        (paddleInstance: Paddle | undefined) => {
          if (paddleInstance) {
            setPaddle(paddleInstance)
          }
        }
      ).catch(console.error)
    }
  }, [])

  return (
    <PaddleContext.Provider value={paddle}>
      {children}
    </PaddleContext.Provider>
  )
}

export function usePaddle() {
  return useContext(PaddleContext)
}
