'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Loader2, LogOut, Settings, Code, Menu, X,
  LayoutDashboard, ScanLine, Users, Gift, QrCode,
  Search, Calendar, ChevronLeft, ChevronRight,
  SlidersHorizontal, Monitor, Smartphone, Tablet, ChevronDown, Check,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '@/components/language-provider'

interface MerchantInfo {
  id: string
  code: string
  name: string
}

interface Scan {
  id: string
  user_id: string
  merchant_id: string
  created_at: string
  email: string | null
  is_anonymous: boolean
  device_type: string | null
}

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/merchant',             active: false },
  { icon: ScanLine,        label: 'Scans',     href: '/merchant/scans',       active: true  },
  { icon: QrCode,          label: 'Mon QR',    href: '/merchant/display-qr',  active: false },
  { icon: Users,           label: 'Clients',   href: '/merchant',             active: false },
  { icon: Gift,            label: 'Rewards',   href: '/merchant',             active: false },
  { icon: Settings,        label: 'Settings',  href: '/merchant/settings',    active: false },
]

const DEVICE_OPTIONS = [
  { value: '',        label: 'Tous les appareils', icon: Monitor    },
  { value: 'desktop', label: 'Desktop',            icon: Monitor    },
  { value: 'mobile',  label: 'Mobile',             icon: Smartphone },
  { value: 'tablet',  label: 'Tablette',           icon: Tablet     },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Custom device dropdown ───────────────────────────────────────────────────
function DeviceSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = DEVICE_OPTIONS.find(o => o.value === value) ?? DEVICE_OPTIONS[0]

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 h-10 px-3.5 pr-3 rounded-xl text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
          open
            ? 'bg-[#201f1f] border-[#69f6b8]/40 text-white'
            : value
            ? 'bg-[#1a1919] border-[#69f6b8]/20 text-[#69f6b8]'
            : 'bg-[#1a1919] border-[#494847]/20 text-[#adaaaa] hover:text-white hover:border-[#494847]/50'
        }`}
      >
        <selected.icon className="w-3.5 h-3.5 shrink-0" />
        {selected.label}
        <ChevronDown className={`w-3.5 h-3.5 ml-0.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-1.5 left-0 min-w-full z-50 bg-[#131313] border border-[#494847]/30 rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1"
          >
            {DEVICE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm transition-colors text-left ${
                  opt.value === value
                    ? 'text-[#69f6b8] bg-[#69f6b8]/8'
                    : 'text-[#adaaaa] hover:text-white hover:bg-[#1a1919]'
                }`}
              >
                <opt.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{opt.label}</span>
                {opt.value === value && <Check className="w-3 h-3 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Date range picker ────────────────────────────────────────────────────────
function DateRangePicker({
  from, to, onFromChange, onToChange,
}: { from: string; to: string; onFromChange: (v: string) => void; onToChange: (v: string) => void }) {
  const hasValue = !!(from || to)
  return (
    <div className={`flex items-center gap-0 h-10 rounded-xl border transition-all overflow-hidden ${
      hasValue ? 'border-[#69f6b8]/20 bg-[#1a1919]' : 'border-[#494847]/20 bg-[#1a1919]'
    }`}>
      <Calendar className="w-3.5 h-3.5 text-[#adaaaa] ml-3 shrink-0" />
      <input
        type="date"
        value={from}
        onChange={e => onFromChange(e.target.value)}
        className="h-full bg-transparent pl-2 pr-1 text-sm text-white focus:outline-none w-[130px] [color-scheme:dark]"
      />
      <span className="text-[#494847] text-xs px-1 shrink-0">→</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={e => onToChange(e.target.value)}
        className="h-full bg-transparent pl-1 pr-3 text-sm text-white focus:outline-none w-[130px] [color-scheme:dark]"
      />
    </div>
  )
}

export default function ScansPage() {
  const [loading, setLoading]           = useState(true)
  const [loadingTable, setLoadingTable] = useState(false)
  const [merchant, setMerchant]         = useState<MerchantInfo | null>(null)
  const [scans, setScans]               = useState<Scan[]>([])
  const [total, setTotal]               = useState(0)
  const [page, setPage]                 = useState(1)
  const [drawerOpen, setDrawerOpen]     = useState(false)
  const [filtersOpen, setFiltersOpen]   = useState(false)

  // Filter state — "applied" values drive the API call
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch]           = useState('')
  const [dateFrom, setDateFrom]       = useState('')
  const [dateTo, setDateTo]           = useState('')
  const [device, setDevice]           = useState('')
  const [userType, setUserType]       = useState<'' | 'anonymous' | 'registered'>('')

  const limit    = 20
  const router   = useRouter()
  const { t }    = useLanguage()
  const supabase = createClient()

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
    }
  }, [router, t])

  const fetchScans = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (search)   params.append('search',   search)
      if (dateFrom) params.append('dateFrom', dateFrom)
      if (dateTo)   params.append('dateTo',   dateTo)
      if (device)   params.append('device',   device)
      if (userType) params.append('userType', userType)

      const res  = await fetch(`/api/merchant/scans?${params}`)
      const data = await res.json()
      if (res.ok) {
        setScans(data.scans)
        setTotal(data.total)
      }
    } catch {
      console.error('Failed to fetch scans')
    } finally {
      setLoadingTable(false)
      setLoading(false)
    }
  }, [page, search, dateFrom, dateTo, device, userType])

  useEffect(() => { fetchMerchant() }, [fetchMerchant])

  // Re-fetch whenever applied filters or page change
  useEffect(() => {
    if (merchant) fetchScans()
  }, [merchant, fetchScans])

  // Device and dates apply immediately (no need to press Search)
  const handleDeviceChange = (v: string) => { setDevice(v); setPage(1) }
  const handleDateFrom     = (v: string) => { setDateFrom(v); setPage(1) }
  const handleDateTo       = (v: string) => { setDateTo(v); setPage(1) }

  const applySearch = () => { setSearch(searchInput); setPage(1) }

  const resetFilters = () => {
    setSearch(''); setSearchInput('')
    setDateFrom(''); setDateTo('')
    setDevice(''); setUserType('')
    setPage(1)
  }

  const handleClientClick = (scan: Scan) => {
    const value = scan.email ?? scan.user_id
    setSearchInput(value)
    setSearch(value)
    setPage(1)
  }

  const handleTypeBadgeClick = (anonymous: boolean) => {
    const next = anonymous ? 'anonymous' : 'registered'
    setUserType(prev => prev === next ? '' : next)
    setPage(1)
  }

  const hasActiveFilters = !!(search || dateFrom || dateTo || device || userType)
  const totalPages = Math.ceil(total / limit)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#69f6b8]" />
      </div>
    )
  }

  // ── Sidebar shared nav ───────────────────────────────────────────────────
  const SidebarContent = () => (
    <>
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-black text-[#69f6b8] tracking-tighter">Trelio</h1>
        <p className="text-[10px] text-[#adaaaa] tracking-widest uppercase mt-1 font-bold">Merchant Portal</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ icon: Icon, label, href, active }) => (
          <Link key={label} href={href} onClick={() => setDrawerOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
              active ? 'text-[#69f6b8] bg-[#1a1919] font-bold' : 'text-[#adaaaa] hover:text-white hover:bg-[#1a1919]/50'
            }`}>
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}
        <Link href="/merchant/integration" onClick={() => setDrawerOpen(false)}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#adaaaa] hover:text-white hover:bg-[#1a1919]/50 transition-all duration-200">
          <Code className="w-5 h-5" />
          {t('merchant.integration')}
        </Link>
      </nav>
      {merchant && (
        <div className="mt-auto p-4 bg-[#1a1919] rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center text-[#69f6b8] font-black shrink-0">
            {merchant.name.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold truncate">{merchant.name}</p>
            <p className="text-[10px] text-[#adaaaa] truncate">Code: {merchant.code}</p>
          </div>
          <button onClick={handleLogout} title={t('merchant.logout')}
            className="text-[#adaaaa] hover:text-red-400 transition-colors p-1">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )

  const TypeBadge = ({ anonymous }: { anonymous: boolean }) => {
    const type = anonymous ? 'anonymous' : 'registered'
    const isActive = userType === type
    return (
      <button
        onClick={() => handleTypeBadgeClick(anonymous)}
        title={`Filtrer par: ${anonymous ? 'Anonyme' : 'Enregistré'}`}
        className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit transition-all cursor-pointer ring-offset-[#0e0e0e] hover:ring-2 active:scale-95 ${
          anonymous
            ? isActive
              ? 'bg-[#494847] text-white ring-[#777575]'
              : 'bg-[#262626] text-[#adaaaa] hover:ring-[#494847]/60'
            : isActive
              ? 'bg-[#69f6b8]/20 text-[#69f6b8] ring-[#69f6b8]/50'
              : 'bg-[#69f6b8]/10 text-[#69f6b8] hover:ring-[#69f6b8]/30'
        }`}>
        {anonymous ? 'Anonyme' : 'Enregistré'}
      </button>
    )
  }

  const DeviceIcon = ({ dtype }: { dtype: string | null }) => {
    const d = dtype?.toLowerCase() ?? ''
    if (d.includes('mobile') || d.includes('iphone') || d.includes('android'))
      return <Smartphone className="w-3.5 h-3.5" />
    if (d.includes('tablet') || d.includes('ipad'))
      return <Tablet className="w-3.5 h-3.5" />
    return <Monitor className="w-3.5 h-3.5" />
  }

  const Pagination = () => (
    <div className="flex items-center justify-between">
      <p className="text-xs text-[#adaaaa] tabular-nums">
        {total === 0 ? '0'
          : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)}`} sur {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#adaaaa] hover:bg-[#1a1919] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = totalPages <= 5 ? i + 1
            : page <= 3 ? i + 1
            : page >= totalPages - 2 ? totalPages - 4 + i
            : page - 2 + i
          return (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                p === page ? 'bg-[#69f6b8]/10 text-[#69f6b8]' : 'text-[#adaaaa] hover:bg-[#1a1919] hover:text-white'
              }`}>
              {p}
            </button>
          )
        })}
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#adaaaa] hover:bg-[#1a1919] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-sans">

      {/* ── Mobile drawer overlay ──────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-[55] lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile nav drawer ─────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-[60] w-[280px] bg-[#0e0e0e] rounded-r-2xl shadow-2xl flex flex-col gap-2 p-4 transition-transform duration-300 ease-in-out lg:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {merchant && (
          <div className="flex items-center gap-4 p-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#1a1919] flex items-center justify-center text-[#69f6b8] font-black text-lg shrink-0">
              {merchant.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold text-[#69f6b8] truncate">{merchant.name}</h3>
              <p className="text-xs text-[#adaaaa]">Commerçant</p>
            </div>
            <button className="ml-auto p-1 text-[#adaaaa] hover:text-white" onClick={() => setDrawerOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <nav className="flex flex-col gap-1">
          {NAV.map(({ icon: Icon, label, href, active }) => (
            <Link key={label} href={href} onClick={() => setDrawerOpen(false)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all active:translate-x-1 duration-150 ${
                active ? 'bg-[#69f6b8]/10 text-[#69f6b8]' : 'text-[#adaaaa] hover:bg-[#262626] hover:text-white'
              }`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <Link href="/merchant/integration" onClick={() => setDrawerOpen(false)}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-[#adaaaa] hover:bg-[#262626] hover:text-white transition-all duration-150">
            <Code className="w-5 h-5" />
            {t('merchant.integration')}
          </Link>
        </nav>
        <button onClick={handleLogout}
          className="mt-auto flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-5 h-5" />
          {t('merchant.logout')}
        </button>
      </aside>

      {/* ── Desktop sidebar ────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 z-50 p-4 border-r border-[#494847]/15"
        style={{ background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)' }}>
        <SidebarContent />
      </aside>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <div className="lg:pl-64 flex flex-col min-h-screen">

        {/* ── Mobile top bar ─────────────────────────────────────────── */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#494847]/10">
          <button onClick={() => setDrawerOpen(true)}
            className="text-[#adaaaa] hover:text-white p-2 -ml-2 rounded-full hover:bg-[#262626] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-[#69f6b8]" />
            <span className="text-sm font-bold tracking-tight">Scans</span>
          </div>
          <button onClick={() => setFiltersOpen(o => !o)}
            className={`relative p-2 -mr-2 rounded-full transition-colors ${
              filtersOpen ? 'text-[#69f6b8] bg-[#69f6b8]/10' : 'text-[#adaaaa] hover:text-white hover:bg-[#262626]'
            }`}>
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#69f6b8]" />
            )}
          </button>
        </header>

        {/* ── Desktop top bar ────────────────────────────────────────── */}
        <header className="hidden lg:flex items-center justify-between px-8 h-16 border-b border-[#494847]/10 bg-[#0e0e0e]/80 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <Link href="/merchant" className="text-[#adaaaa] hover:text-white text-sm transition-colors">Dashboard</Link>
            <span className="text-[#494847]">/</span>
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-[#69f6b8]" />
              <span className="text-sm font-bold text-white">Scans</span>
            </div>
          </div>
          <p className="text-xs text-[#adaaaa] tabular-nums">{total} scan{total !== 1 ? 's' : ''} au total</p>
        </header>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* MOBILE LAYOUT                                                  */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:hidden flex flex-col flex-1 pt-14">

          {/* Mobile filter panel */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div key="mf"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden border-b border-[#494847]/15 bg-[#0a0a0a]"
              >
                <div className="px-5 py-4 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#adaaaa] pointer-events-none" />
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && applySearch()}
                      placeholder="Email ou ID utilisateur…"
                      className="w-full h-10 bg-[#1a1919] rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-[#777575] border border-[#494847]/30 focus:border-[#69f6b8] focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Date range */}
                  <DateRangePicker from={dateFrom} to={dateTo} onFromChange={handleDateFrom} onToChange={handleDateTo} />

                  {/* Device chips */}
                  <div className="flex gap-2 flex-wrap">
                    {DEVICE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => handleDeviceChange(opt.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          device === opt.value
                            ? 'bg-[#69f6b8]/10 text-[#69f6b8] border-[#69f6b8]/30'
                            : 'text-[#adaaaa] border-[#494847]/30 hover:border-[#494847] hover:text-white'
                        }`}>
                        <opt.icon className="w-3 h-3" />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button onClick={applySearch}
                      className="flex-1 h-9 rounded-xl bg-[#69f6b8] text-[#002919] text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all">
                      Appliquer
                    </button>
                    {hasActiveFilters && (
                      <button onClick={resetFilters}
                        className="px-4 h-9 rounded-xl text-sm font-medium text-[#adaaaa] border border-[#494847]/30 hover:text-white hover:border-[#494847] transition-all">
                        Réinitialiser
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active filter chips */}
          {hasActiveFilters && !filtersOpen && (
            <div className="px-5 py-2 flex gap-2 overflow-x-auto border-b border-[#494847]/10">
              {search && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1919] border border-[#69f6b8]/20 text-[#69f6b8] text-[10px] font-bold shrink-0">
                  "{search}"
                  <button onClick={() => { setSearch(''); setSearchInput(''); setPage(1) }}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {(dateFrom || dateTo) && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1919] border border-[#494847]/20 text-[#adaaaa] text-[10px] font-bold shrink-0">
                  {dateFrom || '…'} → {dateTo || '…'}
                  <button onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {device && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1919] border border-[#494847]/20 text-[#adaaaa] text-[10px] font-bold shrink-0">
                  {DEVICE_OPTIONS.find(d => d.value === device)?.label}
                  <button onClick={() => { setDevice(''); setPage(1) }}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {userType && (
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1a1919] text-[10px] font-bold shrink-0 border ${
                  userType === 'anonymous' ? 'border-[#494847]/20 text-[#adaaaa]' : 'border-[#69f6b8]/20 text-[#69f6b8]'
                }`}>
                  {userType === 'anonymous' ? 'Anonyme' : 'Enregistré'}
                  <button onClick={() => { setUserType(''); setPage(1) }}><X className="w-2.5 h-2.5" /></button>
                </span>
              )}
            </div>
          )}

          {/* Scan cards */}
          <div className="flex-1 px-4 py-4 space-y-2">
            {loadingTable ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[#69f6b8]" />
              </div>
            ) : scans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-[#1a1919] flex items-center justify-center">
                  <ScanLine className="w-6 h-6 text-[#494847]" />
                </div>
                <p className="text-[#494847] text-sm">Aucun scan trouvé</p>
              </div>
            ) : (
              scans.map(scan => (
                <div key={scan.id} className="bg-[#1a1919] rounded-xl p-4 flex items-center gap-3 border border-[#494847]/10">
                  <div className="w-9 h-9 rounded-lg bg-[#262626] flex items-center justify-center text-[#adaaaa] shrink-0">
                    <DeviceIcon dtype={scan.device_type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => handleClientClick(scan)}
                      title="Filtrer par ce client"
                      className="text-sm font-medium truncate text-white hover:text-[#69f6b8] transition-colors text-left w-full truncate">
                      {scan.email ?? `${scan.user_id.substring(0, 16)}…`}
                    </button>
                    <p className="text-[10px] text-[#777575] mt-0.5">
                      {scan.device_type ?? '—'} · {formatDate(scan.created_at)}
                    </p>
                  </div>
                  <TypeBadge anonymous={scan.is_anonymous} />
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-[#494847]/15">
              <Pagination />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* DESKTOP LAYOUT                                                 */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="hidden lg:flex flex-col flex-1 px-8 py-6 gap-5">

          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Search */}
            <form onSubmit={e => { e.preventDefault(); applySearch() }} className="relative flex-1 min-w-[200px] max-w-xs flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#adaaaa] pointer-events-none" />
                <input
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Email ou ID utilisateur…"
                  className="w-full h-10 bg-[#1a1919] rounded-xl pl-9 pr-4 text-sm text-white placeholder:text-[#777575] border border-[#494847]/20 focus:border-[#69f6b8] focus:outline-none transition-colors"
                />
              </div>
              <button type="submit"
                className="h-10 px-4 rounded-xl bg-[#69f6b8] text-[#002919] text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all shrink-0">
                Chercher
              </button>
            </form>

            {/* Date range */}
            <DateRangePicker from={dateFrom} to={dateTo} onFromChange={handleDateFrom} onToChange={handleDateTo} />

            {/* Device select */}
            <DeviceSelect value={device} onChange={handleDeviceChange} />

            {/* Reset */}
            {hasActiveFilters && (
              <button onClick={resetFilters}
                className="h-10 px-4 rounded-xl text-sm font-medium text-[#adaaaa] border border-[#494847]/20 hover:text-white hover:border-[#494847] transition-all shrink-0 flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 rounded-2xl border border-[#494847]/15 overflow-hidden flex flex-col min-h-0"
            style={{ background: 'rgba(26,25,25,0.4)' }}>

            <div className="grid grid-cols-[2fr_1.5fr_1fr_auto] gap-4 px-6 py-3 border-b border-[#494847]/15 shrink-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#adaaaa]">Client</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#adaaaa]">Date</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#adaaaa]">Appareil</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#adaaaa]">Type</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#494847]/10">
              {loadingTable ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-[#69f6b8]" />
                </div>
              ) : scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#131313] flex items-center justify-center">
                    <ScanLine className="w-6 h-6 text-[#494847]" />
                  </div>
                  <p className="text-[#494847] text-sm">Aucun scan trouvé</p>
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="text-xs text-[#69f6b8] underline underline-offset-4">
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                scans.map(scan => (
                  <div key={scan.id}
                    className="grid grid-cols-[2fr_1.5fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-[#1a1919]/60 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#262626] flex items-center justify-center text-[#adaaaa] shrink-0 group-hover:text-[#69f6b8] transition-colors">
                        <DeviceIcon dtype={scan.device_type} />
                      </div>
                      <button
                        onClick={() => handleClientClick(scan)}
                        title="Filtrer par ce client"
                        className="text-sm truncate text-white font-medium hover:text-[#69f6b8] transition-colors text-left max-w-full">
                        {scan.email ?? `${scan.user_id.substring(0, 20)}…`}
                      </button>
                    </div>
                    <span className="text-xs text-[#adaaaa] tabular-nums">{formatDate(scan.created_at)}</span>
                    <span className="text-xs text-[#adaaaa] truncate">{scan.device_type ?? '—'}</span>
                    <TypeBadge anonymous={scan.is_anonymous} />
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-4 border-t border-[#494847]/15 shrink-0">
              <Pagination />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
