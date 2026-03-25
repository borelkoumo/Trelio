'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'motion/react'
import {
  LayoutDashboard, ScanLine, QrCode, Users, Gift,
  Settings, LogOut, X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useMerchant } from '@/components/merchant-provider'

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Dashboard',  href: '/merchant',            activeKey: '/merchant'            },
  { icon: ScanLine,        label: 'Scans',      href: '/merchant/scans',      activeKey: '/merchant/scans'      },
  { icon: QrCode,          label: 'Mon QR',     href: '/merchant/display-qr', activeKey: '/merchant/display-qr' },
  { icon: Users,           label: 'Clients',    href: '/merchant/clients',    activeKey: '/merchant/clients'    },
  { icon: Gift,            label: 'Rewards',    href: '/merchant/rewards',    activeKey: '/merchant/rewards'    },
  { icon: Settings,        label: 'Settings',   href: '/merchant/settings',   activeKey: '/merchant/settings'   },
]

export function MerchantNav() {
  const { name, code, drawerOpen, closeDrawer } = useMerchant()
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()
  const initial  = name.charAt(0).toUpperCase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/merchant/login')
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <>
      {NAV_ITEMS.map(({ icon: Icon, label, href, activeKey }) => {
        const active = pathname === activeKey
        return (
          <Link key={activeKey} href={href} onClick={onClick}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              active
                ? 'text-[#69f6b8] bg-[#1a1919] font-bold'
                : 'text-[#adaaaa] hover:text-white hover:bg-[#1a1919]/50'
            }`}>
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        )
      })}
    </>
  )

  return (
    <>
      {/* ── Mobile overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[55] lg:hidden"
            onClick={closeDrawer}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-[280px] bg-[#0e0e0e] rounded-r-2xl shadow-2xl flex flex-col p-4 gap-2 transition-transform duration-300 ease-in-out lg:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-4 p-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#1a1919] flex items-center justify-center text-[#69f6b8] font-black text-lg shrink-0">
            {initial}
          </div>
          <div className="overflow-hidden flex-1">
            <h3 className="text-sm font-bold text-[#69f6b8] truncate">{name}</h3>
            <p className="text-xs text-[#adaaaa]">Commerçant</p>
          </div>
          <button className="ml-auto p-1 text-[#adaaaa] hover:text-white" onClick={closeDrawer}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ icon: Icon, label, href, activeKey }) => {
            const active = pathname === activeKey
            return (
              <Link key={activeKey} href={href} onClick={closeDrawer}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all active:translate-x-1 duration-150 ${
                  active
                    ? 'bg-[#69f6b8]/10 text-[#69f6b8]'
                    : 'text-[#adaaaa] hover:bg-[#262626] hover:text-white'
                }`}>
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        <button onClick={handleLogout}
          className="mt-auto flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </aside>

      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 z-50 p-4 border-r border-[#494847]/15"
        style={{ background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)' }}>

        <div className="mb-10 px-4">
          <h1 className="text-2xl font-black text-[#69f6b8] tracking-tighter">Trelio</h1>
          <p className="text-[10px] text-[#adaaaa] tracking-widest uppercase mt-1 font-bold">Merchant Portal</p>
        </div>

        <nav className="flex-1 space-y-1">
          <NavLinks />
        </nav>

        {/* Merchant card */}
        <div className="mt-auto p-4 bg-[#1a1919] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#69f6b8] font-black shrink-0">
            {initial}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate">{name}</p>
            <p className="text-[10px] text-[#adaaaa] truncate">
              {code ? `Code: ${code}` : 'Commerçant'}
            </p>
          </div>
          <button onClick={handleLogout} title="Déconnexion"
            className="text-[#adaaaa] hover:text-red-400 transition-colors p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>
    </>
  )
}
