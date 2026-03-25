'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Loader2, QrCode, ChevronLeft, ChevronRight,
  Menu, ScanLine, Users, Gift, Sparkles,
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { useMerchant } from '@/components/merchant-provider'

interface MerchantStats {
  totalScans: number
  uniqueUsers: number
  totalRewards: number
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

export default function MerchantDashboard() {
  const { name, openDrawer } = useMerchant()
  const [stats, setStats]               = useState<MerchantStats>({ totalScans: 0, uniqueUsers: 0, totalRewards: 0 })
  const [scans, setScans]               = useState<Scan[]>([])
  const [totalScans, setTotalScans]     = useState(0)
  const [page, setPage]                 = useState(1)
  const [limit]                         = useState(5)
  const [search, setSearch]             = useState('')
  const [dateFilter, setDateFilter]     = useState('')
  const [loadingTable, setLoadingTable] = useState(true)

  const router = useRouter()
  const { t }  = useLanguage()

  const fetchScans = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (search) params.append('search', search)
      if (dateFilter) params.append('date', dateFilter)

      const res  = await fetch(`/api/merchant/scans?${params.toString()}`)
      const data = await res.json()

      if (res.ok) {
        setScans(data.scans)
        setTotalScans(data.total)
        setStats(prev => ({
          ...prev,
          totalScans:  data.stats.totalScans,
          uniqueUsers: data.stats.uniqueUsers,
        }))
      }
    } catch (err) {
      console.error('Failed to fetch scans', err)
    } finally {
      setLoadingTable(false)
    }
  }, [page, limit, search, dateFilter])

  useEffect(() => { fetchScans() }, [fetchScans])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchScans()
  }

  const totalPages = Math.ceil(totalScans / limit)

  return (
    <>
      {/* ── Mobile top header ─────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 w-full z-50 h-16 flex items-center justify-between px-6 shadow-[0_48px_48px_rgba(172,138,255,0.04)]"
        style={{ background: 'rgba(14,14,14,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-4">
          <button onClick={openDrawer} className="text-[#adaaaa] hover:bg-[#262626] p-2 rounded-full transition-colors active:scale-95">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg text-[#69f6b8] tracking-tight">Dashboard</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#262626] border border-[#494847]/15 flex items-center justify-center text-[#69f6b8] font-black text-sm">
          {name.charAt(0).toUpperCase()}
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="pt-20 lg:pt-8 pb-12 px-6 lg:px-12 space-y-10 lg:space-y-12">

        {/* Welcome */}
        <section className="space-y-1 pt-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#adaaaa]">{t('merchant.welcome').replace(',', '').trim()}</p>
          <h1 className="font-black tracking-tight leading-none text-[#69f6b8] text-2xl lg:text-[3.5rem]">
            {name}
          </h1>
          <p className="text-[#adaaaa]/70 text-base mt-2 lg:hidden">{t('merchant.manage')}</p>
        </section>

        {/* ── QR button + Stats ───────────────────────────────────────── */}

        {/* Mobile: stacked QR + stats grid */}
        <div className="lg:hidden space-y-6">
          <button
            onClick={() => router.push('/merchant/display-qr')}
            className="w-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-bold px-8 py-5 rounded-full flex items-center justify-center gap-3 active:scale-95 transition-all">
            <QrCode className="w-5 h-5" />
            {t('merchant.showQrCode')}
          </button>

          {/* Mobile stats grid */}
          <div className="bg-[#1a1919] rounded-2xl border border-[#494847]/10 overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-[#494847]/10">
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#69f6b8]/10 flex items-center justify-center mb-4">
                  <ScanLine className="w-5 h-5 text-[#69f6b8]" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{stats.totalScans}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#adaaaa] font-semibold mt-0.5">{t('merchant.totalScans')}</p>
              </div>
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#ac8aff]/10 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5 text-[#ac8aff]" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{stats.uniqueUsers}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#adaaaa] font-semibold mt-0.5">{t('merchant.uniqueUsers')}</p>
              </div>
              <div className="p-6 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-[#262626] flex items-center justify-center mb-4">
                  <Gift className="w-5 h-5 text-[#adaaaa]" />
                </div>
                <p className="text-2xl font-bold tracking-tight">{stats.totalRewards || 0}</p>
                <p className="text-[10px] uppercase tracking-widest text-[#adaaaa] font-semibold mt-0.5">{t('merchant.rewardsRedeemed')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop: side-by-side QR card + 3 stat cards */}
        <div className="hidden lg:grid grid-cols-12 gap-8 items-start">
          {/* QR card */}
          <button
            onClick={() => router.push('/merchant/display-qr')}
            className="col-span-4 group relative overflow-hidden h-[180px] bg-gradient-to-br from-[#69f6b8] to-[#06b77f] rounded-[2rem] p-8 flex flex-col justify-between items-start transition-all duration-300 hover:scale-[1.02] active:scale-95">
            <div className="bg-black/10 p-3 rounded-2xl">
              <QrCode className="w-8 h-8 text-[#002919]" />
            </div>
            <span className="text-[#002919] font-black text-xl tracking-tight">{t('merchant.showQrCode')}</span>
          </button>

          {/* 3 stat cards */}
          <div className="col-span-8 grid grid-cols-3 gap-6 h-[180px]">
            <div className="bg-[#1a1919] rounded-3xl p-6 flex flex-col justify-between hover:bg-[#201f1f] transition-colors">
              <span className="text-[#adaaaa] text-xs font-bold tracking-wider uppercase">{t('merchant.totalScans')}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{stats.totalScans}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#69f6b8] mb-2" />
              </div>
            </div>
            <div className="bg-[#1a1919] rounded-3xl p-6 flex flex-col justify-between hover:bg-[#201f1f] transition-colors">
              <span className="text-[#adaaaa] text-xs font-bold tracking-wider uppercase">{t('merchant.uniqueUsers')}</span>
              <span className="text-5xl font-black tracking-tighter">{stats.uniqueUsers}</span>
            </div>
            <div className="bg-[#1a1919] rounded-3xl p-6 flex flex-col justify-between hover:bg-[#201f1f] transition-colors">
              <span className="text-[#adaaaa] text-xs font-bold tracking-wider uppercase">{t('merchant.rewardsRedeemed')}</span>
              <span className={`text-5xl font-black tracking-tighter ${!stats.totalRewards ? 'opacity-30' : ''}`}>
                {stats.totalRewards || 0}
              </span>
            </div>
          </div>
        </div>

        {/* ── Recent scans ────────────────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold tracking-tight">{t('merchant.recentScans')}</h2>
            <Link href="/merchant/scans"
              className="group flex items-center gap-1.5 text-sm font-medium text-[#69f6b8] hover:text-white transition-colors">
              Voir tout
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Table */}
          <div className="bg-[#1a1919] rounded-2xl lg:rounded-[2rem] overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#201f1f]/50">
                  <th className="px-6 py-4 lg:px-8 lg:py-6 text-xs font-black uppercase tracking-widest text-[#adaaaa]">{t('merchant.dateAndTime')}</th>
                  <th className="px-6 py-4 lg:px-8 lg:py-6 text-xs font-black uppercase tracking-widest text-[#adaaaa]">{t('merchant.customer')}</th>
                  <th className="px-6 py-4 lg:px-8 lg:py-6 text-xs font-black uppercase tracking-widest text-[#adaaaa]">{t('merchant.type')}</th>
                  <th className="px-6 py-4 lg:px-8 lg:py-6 text-xs font-black uppercase tracking-widest text-[#adaaaa]">{t('merchant.device')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingTable ? (
                  <tr>
                    <td colSpan={4} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#adaaaa] mx-auto" />
                    </td>
                  </tr>
                ) : scans.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-32 text-center text-[#adaaaa]">
                      {t('merchant.noScans')}
                    </td>
                  </tr>
                ) : (
                  scans.map((scan) => (
                    <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 lg:px-8 lg:py-5 whitespace-nowrap text-sm font-medium text-white">
                        {new Date(scan.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 lg:px-8 lg:py-5 text-white">
                        {scan.email ? (
                          scan.email
                        ) : (
                          <span className="font-mono text-xs text-[#adaaaa]" title={scan.user_id}>
                            {scan.user_id.substring(0, 8)}...{scan.user_id.substring(scan.user_id.length - 4)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 lg:px-8 lg:py-5">
                        {scan.is_anonymous ? (
                          <span className="px-3 py-1 rounded-full bg-[#262626] text-[#adaaaa] text-[10px] font-bold uppercase tracking-wider">
                            {t('merchant.anonymous')}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-[#69f6b8]/10 text-[#69f6b8] text-[10px] font-bold uppercase tracking-wider">
                            {t('merchant.registered')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 lg:px-8 lg:py-5 text-[#adaaaa] text-sm whitespace-nowrap">
                        {scan.device_type || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {!loadingTable && totalPages > 1 && (
              <div className="px-6 py-4 lg:px-8 border-t border-white/5 flex items-center justify-between">
                <p className="text-sm text-[#adaaaa]">
                  {t('merchant.showing')}{' '}
                  <span className="font-medium text-white">{(page - 1) * limit + 1}</span>{' '}
                  {t('merchant.to')}{' '}
                  <span className="font-medium text-white">{Math.min(page * limit, totalScans)}</span>{' '}
                  {t('merchant.of')}{' '}
                  <span className="font-medium text-white">{totalScans}</span>{' '}
                  {t('merchant.results')}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="h-9 px-4 rounded-full bg-[#1a1919] border border-[#494847]/20 text-sm text-[#adaaaa] hover:text-white hover:border-[#494847]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1">
                    <ChevronLeft className="h-4 w-4" />{t('merchant.previous')}
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="h-9 px-4 rounded-full bg-[#1a1919] border border-[#494847]/20 text-sm text-[#adaaaa] hover:text-white hover:border-[#494847]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1">
                    {t('merchant.next')}<ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Promotional banner ───────────────────────────────────────── */}
        <section className="relative h-64 rounded-[2.5rem] overflow-hidden flex items-center px-10 lg:px-12 group cursor-pointer">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#69f6b8]/10 via-transparent to-[#ac8aff]/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-[#0e0e0e]/80 to-transparent" />
          <div className="absolute inset-0 bg-[#1a1919]" style={{ zIndex: -1 }} />
          <div className="relative z-10 max-w-lg">
            <span className="inline-block px-4 py-1.5 bg-[#ac8aff]/20 text-[#ac8aff] rounded-full text-[10px] font-bold tracking-widest uppercase mb-4 border border-[#ac8aff]/20">
              <Sparkles className="w-3 h-3 inline mr-1.5 -mt-0.5" />
              Insight Mensuel
            </span>
            <h4 className="text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-4">
              Augmentez votre rétention client de 24% ce mois-ci.
            </h4>
            <button className="px-8 py-3 bg-white text-[#0e0e0e] font-bold rounded-full hover:scale-105 active:scale-95 transition-transform text-sm">
              Découvrir comment
            </button>
          </div>
        </section>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-[#494847] pt-4 border-t border-[#494847]/10">
          <span>© {new Date().getFullYear()} Trelio.</span>
          <Link href="/" className="hover:text-[#adaaaa] transition-colors">trelio.app</Link>
        </div>

      </main>
    </>
  )
}
