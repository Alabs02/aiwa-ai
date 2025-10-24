'use client'

import { Toaster } from '@/components/ui/sonner'
import { useIsMobile } from '@/lib/client-utils'

export function ToastProvider() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <Toaster position="top-center" />
  }

  return <Toaster position="bottom-right" />
}
