'use client'

import Link from 'next/link'
import { Menu, Users } from 'lucide-react'
import { useMerchant } from '@/components/merchant-provider'

export default function ClientsPage() {
  const { openDrawer } = useMerchant()

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#494847]/10">
        <button onClick={openDrawer}
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

      <main className="flex-1 pt-14 lg:pt-0 flex flex-col items-center justify-center px-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-[#1a1919] flex items-center justify-center">
          <Users className="w-7 h-7 text-[#494847]" />
        </div>
        <p className="text-[#494847] text-sm text-center">La gestion des clients sera disponible prochainement.</p>
      </main>
    </>
  )
}
