'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Loader2, ScanLine, Users, Gift, Search, Calendar, ChevronLeft, ChevronRight, QrCode, SlidersHorizontal, ChevronDown, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '@/components/language-provider'
import { MerchantHeader } from '@/components/merchant-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface MerchantStats {
  totalScans: number
  uniqueUsers: number
  totalRewards: number
}

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

export default function MerchantDashboard() {
  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [stats, setStats] = useState<MerchantStats | null>(null)
  
  // Table state
  const [scans, setScans] = useState<Scan[]>([])
  const [totalScans, setTotalScans] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loadingTable, setLoadingTable] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/stats')
      if (res.status === 401) {
        router.push('/merchant/login')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setMerchant(data.merchant)
        // We will update stats from the scans API to reflect filters
      } else {
        toast.error(t('merchant.failedLoad'), { description: data.error })
      }
    } catch (error) {
      toast.error(t('merchant.failedLoad'))
    }
  }, [router, t])

  const fetchScans = useCallback(async () => {
    setLoadingTable(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      })
      if (search) params.append('search', search)
      if (dateFilter) params.append('date', dateFilter)

      const res = await fetch(`/api/merchant/scans?${params.toString()}`)
      const data = await res.json()
      
      if (res.ok) {
        setScans(data.scans)
        setTotalScans(data.total)
        setStats(prev => ({
          ...prev,
          totalScans: data.stats.totalScans,
          uniqueUsers: data.stats.uniqueUsers,
          totalRewards: prev?.totalRewards || 0 // Keep rewards from overview if possible, or we need to add it to scans API. For now, we'll just use what we have or 0.
        }))
      }
    } catch (error) {
      console.error('Failed to fetch scans', error)
    } finally {
      setLoadingTable(false)
      setLoading(false)
    }
  }, [page, limit, search, dateFilter])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  useEffect(() => {
    fetchScans()
  }, [fetchScans])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchScans()
  }

  const totalPages = Math.ceil(totalScans / limit)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    )
  }

  if (!merchant || !stats) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">{t('merchant.failedData')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <MerchantHeader />

      <main className="flex-1 max-w-5xl mx-auto px-6 mt-8 w-full pb-12">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500 mb-0.5">{t('merchant.welcome').replace(',', '').trim()}</p>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">{merchant.name}</h1>
            <p className="text-zinc-500 hidden sm:block">{t('merchant.manage')}</p>
          </div>
          <Button
            onClick={() => router.push('/merchant/display-qr')}
            className="w-full sm:w-auto h-12 px-6 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 shrink-0"
          >
            <QrCode className="mr-2 h-5 w-5" />
            {t('merchant.showQrCode')}
          </Button>
        </div>

        {/* Mobile: single compact stats widget */}
        <div className="md:hidden bg-white rounded-3xl border border-zinc-100 shadow-sm mb-6 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-zinc-100">
            <div className="flex flex-col items-center py-4 px-2">
              <div className="h-8 w-8 bg-blue-50 rounded-xl flex items-center justify-center mb-2">
                <ScanLine className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-zinc-900">{stats.totalScans}</span>
              <span className="text-xs text-zinc-500 text-center leading-tight mt-1">{t('merchant.totalScans')}</span>
            </div>
            <div className="flex flex-col items-center py-4 px-2">
              <div className="h-8 w-8 bg-emerald-50 rounded-xl flex items-center justify-center mb-2">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-zinc-900">{stats.uniqueUsers}</span>
              <span className="text-xs text-zinc-500 text-center leading-tight mt-1">{t('merchant.uniqueUsers')}</span>
            </div>
            <div className="flex flex-col items-center py-4 px-2">
              <div className="h-8 w-8 bg-purple-50 rounded-xl flex items-center justify-center mb-2">
                <Gift className="h-4 w-4 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-zinc-900">{stats.totalRewards || 0}</span>
              <span className="text-xs text-zinc-500 text-center leading-tight mt-1">{t('merchant.rewardsRedeemed')}</span>
            </div>
          </div>
        </div>

        {/* Desktop: original 3 cards */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <ScanLine className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-zinc-500">{t('merchant.totalScans')}</h3>
            </div>
            <span className="text-4xl font-bold text-zinc-900">{stats.totalScans}</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-medium text-zinc-500">{t('merchant.uniqueUsers')}</h3>
            </div>
            <span className="text-4xl font-bold text-zinc-900">{stats.uniqueUsers}</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-zinc-500">{t('merchant.rewardsRedeemed')}</h3>
            </div>
            <span className="text-4xl font-bold text-zinc-900">{stats.totalRewards || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">{t('merchant.recentScans')}</h2>

              {/* Mobile: accordion toggle */}
              <button
                type="button"
                onClick={() => setShowFilters(v => !v)}
                className="sm:hidden flex items-center gap-1.5 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-full px-3 h-8 transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t('merchant.filter')}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop: filters always visible */}
              <form onSubmit={handleSearch} className="hidden sm:flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    placeholder={t('merchant.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 rounded-full h-10 w-64"
                  />
                </div>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
                    className="pl-9 rounded-full h-10 w-48"
                  />
                </div>
                <Button type="submit" className="rounded-full h-10 px-6">{t('merchant.filter')}</Button>
              </form>
            </div>

            {/* Mobile: collapsible filters */}
            <AnimatePresence initial={false}>
              {showFilters && (
                <motion.form
                  key="mobile-filters"
                  onSubmit={handleSearch}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="sm:hidden overflow-hidden flex flex-col gap-3 pt-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      placeholder={t('merchant.searchPlaceholder')}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 rounded-full h-10 w-full"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => { setDateFilter(e.target.value); setPage(1) }}
                      className="pl-9 rounded-full h-10 w-full"
                    />
                  </div>
                  <Button type="submit" className="rounded-full h-10 px-6 w-full">{t('merchant.filter')}</Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50/50 hover:bg-zinc-50/50">
                  <TableHead className="font-semibold text-zinc-900">{t('merchant.dateAndTime')}</TableHead>
                  <TableHead className="font-semibold text-zinc-900">{t('merchant.customer')}</TableHead>
                  <TableHead className="font-semibold text-zinc-900">{t('merchant.type')}</TableHead>
                  <TableHead className="font-semibold text-zinc-900">{t('merchant.device')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingTable ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-zinc-400 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : scans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-zinc-500">
                      {t('merchant.noScans')}
                    </TableCell>
                  </TableRow>
                ) : (
                  scans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="text-zinc-600 whitespace-nowrap">
                        {new Date(scan.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium text-zinc-900">
                        {scan.email ? (
                          scan.email
                        ) : (
                          <span className="text-zinc-500 font-mono text-xs" title={scan.user_id}>
                            {scan.user_id.substring(0, 8)}...{scan.user_id.substring(scan.user_id.length - 4)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {scan.is_anonymous ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800">
                            {t('merchant.anonymous')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {t('merchant.registered')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs whitespace-nowrap">
                        {scan.device_type || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!loadingTable && totalPages > 1 && (
            <div className="p-4 border-t border-zinc-100 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                {t('merchant.showing')} <span className="font-medium text-zinc-900">{(page - 1) * limit + 1}</span> {t('merchant.to')} <span className="font-medium text-zinc-900">{Math.min(page * limit, totalScans)}</span> {t('merchant.of')} <span className="font-medium text-zinc-900">{totalScans}</span> {t('merchant.results')}
              </p>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full h-9 px-4"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  {t('merchant.previous')}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full h-9 px-4"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  {t('merchant.next')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between text-sm text-zinc-400">
          <span>© {new Date().getFullYear()} Trelio. All rights reserved.</span>
          <Link href="/" className="hover:text-zinc-900 transition-colors flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            trelio.app
          </Link>
        </div>
      </footer>
    </div>
  )
}
