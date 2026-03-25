'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Menu, Users } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { MerchantNav } from '@/components/merchant-nav'

interface MerchantInfo {
  id: string
  name: string
  code: string
}

export default function ClientsPage() {
  const [loading, setLoading]       = useState(true)
  const [merchant, setMerchant]     = useState<MerchantInfo | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const router   = useRouter()
  const supabase = createClient()
  const { t }    = useLanguage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/merchant/login')
  }

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/stats')
      if (res.status === 401) { router.push('/merchant/login'); return }
      const data = await res.json()
      if (res.ok) setMerchant(data.merchant)
      else toast.error(t('merchant.failedData'))
    } catch {
      toast.error(t('merchant.failedData'))
    } finally {
      setLoading(false)
    }
  }, [router, t])

  useEffect(() => { fetchMerchant() }, [fetchMerchant])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#69f6b8]" />
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
        <p className="text-[#adaaaa]">{t('merchant.failedData')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-sans">

      <MerchantNav
        merchantName={merchant.name}
        merchantCode={merchant.code}
        activePath="/merchant/clients"
        onLogout={handleLogout}
        drawerOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">

        {/* Mobile top bar */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#494847]/10">
          <button onClick={() => setDrawerOpen(true)}
            className="text-[#adaaaa] hover:text-white p-2 -ml-2 rounded-full hover:bg-[#262626] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#69f6b8]" />
            <span className="text-sm font-bold tracking-tight">Clients</span>
          </div>
          <div className="w-9" />
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex items-center px-8 h-16 border-b border-[#494847]/10 bg-[#0e0e0e]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link href="/merchant" className="text-[#adaaaa] hover:text-white text-sm transition-colors">Dashboard</Link>
            <span className="text-[#494847]">/</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#69f6b8]" />
              <span className="text-sm font-bold text-white">Clients</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pt-14 lg:pt-0 flex flex-col items-center justify-center px-8 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1919] flex items-center justify-center">
            <Users className="w-7 h-7 text-[#494847]" />
          </div>
          <p className="text-[#494847] text-sm text-center">La gestion des clients sera disponible prochainement.</p>
        </main>

      </div>
    </div>
  )
}
