'use client'

import { createContext, useContext, useState } from 'react'

interface MerchantData {
  id: string
  code: string
  name: string
  validation_mode: 'automatic' | 'manual'
}

interface MerchantContextValue extends MerchantData {
  drawerOpen: boolean
  openDrawer: () => void
  closeDrawer: () => void
}

const MerchantContext = createContext<MerchantContextValue | null>(null)

export function MerchantProvider({
  merchant,
  children,
}: {
  merchant: MerchantData
  children: React.ReactNode
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <MerchantContext.Provider value={{
      ...merchant,
      drawerOpen,
      openDrawer:  () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }}>
      {children}
    </MerchantContext.Provider>
  )
}

export function useMerchant() {
  const ctx = useContext(MerchantContext)
  if (!ctx) throw new Error('useMerchant must be used within MerchantProvider')
  return ctx
}
