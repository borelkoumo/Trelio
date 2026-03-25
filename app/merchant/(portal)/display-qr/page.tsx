'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import {
  Check, X, ExternalLink,
  Menu, ScanLine, RefreshCw, QrCode, BellRing, Fingerprint,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useMerchant } from '@/components/merchant-provider'

/** Must match toShortId() in UserIdBadge.tsx */
const toShortId = (userId: string) => userId.replace(/-/g, '').substring(0, 6).toUpperCase()

interface ValidationRequest {
  id: string
  user_id: string
  user_email: string | null
  device_type: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function DisplayQRPage() {
  const { id: merchantId, validation_mode, openDrawer } = useMerchant()
  const [qrData, setQrData]       = useState<string | null>(null)
  const [requests, setRequests]   = useState<ValidationRequest[]>([])
  const [countdown, setCountdown] = useState(60)

  const { t }    = useLanguage()
  const supabase = createClient()

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/qr')
      const data = await res.json()
      if (data.qrData) setQrData(data.qrData)
      setCountdown(60)
    } catch (error) {
      console.error('Failed to fetch QR code', error)
    }
  }, [])

  // Countdown tick
  useEffect(() => {
    const tick = setInterval(() => setCountdown(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(tick)
  }, [])

  // QR refresh + wake lock + realtime subscription
  useEffect(() => {
    fetchQR()
    const interval = setInterval(fetchQR, 60000)

    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible')
          wakeLock = await navigator.wakeLock.request('screen')
      } catch {}
    }
    requestWakeLock()
    document.addEventListener('visibilitychange', requestWakeLock)

    let subscription: ReturnType<typeof supabase.channel> | null = null
    if (validation_mode === 'manual') {
      subscription = supabase
        .channel('validation_requests')
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public',
          table: 'validation_requests',
          filter: `merchant_id=eq.${merchantId}`,
        }, (payload) => {
          const newReq = payload.new as ValidationRequest
          if (newReq.status === 'pending') {
            setRequests(prev => [...prev, newReq])
            try { if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]) } catch {}
          }
        })
        .subscribe()
    }

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', requestWakeLock)
      if (wakeLock) wakeLock.release().catch(console.error)
      if (subscription) supabase.removeChannel(subscription)
    }
  }, [merchantId, validation_mode, fetchQR, supabase])

  const handleValidation = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setRequests(prev => prev.filter(r => r.id !== requestId))
      const res = await fetch('/api/merchant/validate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('merchant.failedProcessRequest'))
      } else {
        toast.success(action === 'approve' ? t('merchant.requestApproved') : t('merchant.requestRejected'))
      }
    } catch {
      toast.error(t('merchant.failedProcessRequest'))
    }
  }

  const origin           = typeof window !== 'undefined' ? window.location.origin : ''
  const earnUrl          = qrData ? `${origin}/earn-points?data=${encodeURIComponent(qrData)}` : ''
  const isLocalhost      = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const isDemoMerchant   = merchantId === process.env.NEXT_PUBLIC_DEMO_MERCHANT_ID
  const showCustomerLink = (isLocalhost || isDemoMerchant) && !!earnUrl

  const countdownColor = countdown <= 10 ? '#ff716c' : countdown <= 20 ? '#f59e0b' : '#69f6b8'

  const CountdownBadge = ({ size = 'sm' }: { size?: 'sm' | 'lg' }) => (
    <div className={`flex items-center gap-1.5 ${size === 'lg' ? 'text-xs' : 'text-[10px]'} font-bold tabular-nums`}
      style={{ color: countdownColor }}>
      <RefreshCw className={`${size === 'lg' ? 'w-3.5 h-3.5' : 'w-3 h-3'} ${countdown === 0 ? 'animate-spin' : ''}`} />
      <span>{countdown}s</span>
    </div>
  )

  return (
    <div className="flex flex-col flex-1">

      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#494847]/10">
        <button onClick={openDrawer}
          className="text-[#adaaaa] hover:text-white p-2 -ml-2 rounded-full hover:bg-[#262626] transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-[#69f6b8]" />
          <span className="text-sm font-bold tracking-tight">Mon QR</span>
        </div>
        <CountdownBadge />
      </header>

      {/* ── Desktop top bar ────────────────────────────────────────── */}
      <header className="hidden lg:flex items-center justify-between px-8 h-16 border-b border-[#494847]/10 bg-[#0e0e0e]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/merchant" className="text-[#adaaaa] hover:text-white text-sm transition-colors">Dashboard</Link>
          <span className="text-[#494847]">/</span>
          <div className="flex items-center gap-2">
            <ScanLine className="w-4 h-4 text-[#69f6b8]" />
            <span className="text-sm font-bold text-white">Mon QR</span>
          </div>
        </div>
        <CountdownBadge size="lg" />
      </header>

      {/* ── Page content ───────────────────────────────────────────── */}
      <main className="flex-1 pt-14 lg:pt-0">

        {/* ── Mobile layout ────────────────────────────────────────── */}
        <div className="lg:hidden px-5 pt-8 pb-16 max-w-md mx-auto flex flex-col gap-10">

          <section className="flex flex-col items-center gap-6">
            <div className="relative group w-full max-w-xs">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#69f6b8] to-[#ac8aff] rounded-[2.5rem] blur opacity-20 group-hover:opacity-35 transition duration-1000" />
              <div className="relative bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-7">
                {qrData ? (
                  <QRCodeSVG value={earnUrl} size={220} level="H" marginSize={0} className="w-full h-auto max-w-[220px]" />
                ) : (
                  <div className="w-[220px] h-[220px] flex items-center justify-center text-zinc-500 text-center text-sm">
                    {t('merchant.failedLoadQr')}
                  </div>
                )}
              </div>
            </div>
            <div className="text-center space-y-2 px-4">
              <p className="text-[#adaaaa] text-xs leading-relaxed">{t('merchant.scanQrDesc')}</p>
              {showCustomerLink && (
                <a href={earnUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium text-[#adaaaa]/60 hover:text-[#69f6b8] transition-colors underline underline-offset-4">
                  {t('sim.openView')}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
          </section>

          {validation_mode === 'manual' && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#ac8aff]/25" />
                <div className="flex items-center gap-2">
                  <BellRing className="w-3.5 h-3.5 text-[#ac8aff]" />
                  <span className="text-[10px] font-black tracking-widest uppercase text-[#ac8aff]">Demandes</span>
                  {requests.length > 0 && (
                    <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      <span className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />
                      LIVE
                    </div>
                  )}
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#ac8aff]/25" />
              </div>

              {requests.length === 0 ? (
                <p className="text-center text-[#494847] text-sm py-6">{t('merchant.waitingCustomers')}</p>
              ) : (
                <div className="space-y-3">
                  {requests.map(req => (
                    <div key={req.id}
                      className="bg-[#1a1919] border border-[#494847]/10 rounded-2xl p-5 space-y-4 animate-in slide-in-from-bottom-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-[#262626] flex items-center justify-center text-[#ac8aff] shrink-0">
                            <ScanLine className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{t('merchant.newRequest')}</p>
                            {req.device_type && <p className="text-[#adaaaa] text-xs">{req.device_type}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 py-1 px-2 bg-[#000000] rounded-lg border border-[#262626]">
                          <Fingerprint className="w-3 h-3 text-[#494847]" />
                          <span className="text-[10px] font-mono font-bold text-[#ac8aff] tracking-wider">
                            {toShortId(req.user_id)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => handleValidation(req.id, 'reject')}
                          className="w-14 h-12 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-90 transition-all duration-200 shrink-0">
                          <X className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleValidation(req.id, 'approve')}
                          className="flex-1 h-12 flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-sm active:scale-95 transition-all duration-200">
                          <Check className="w-4 h-4" />
                          {t('merchant.approve')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* ── Desktop layout ────────────────────────────────────────── */}
        <div className="hidden lg:flex gap-6 p-6 h-[calc(100vh-4rem)] max-w-[1440px] mx-auto w-full">

          {/* Left panel: QR */}
          <div className={`flex flex-col rounded-2xl border border-[#69f6b8]/10 overflow-hidden ${validation_mode === 'manual' ? 'w-[45%]' : 'flex-1'}`}
            style={{ background: 'linear-gradient(160deg, rgba(105,246,184,0.03) 0%, rgba(14,14,14,0) 60%)' }}>

            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#69f6b8]/10 shrink-0">
              <div className="w-7 h-7 rounded-lg bg-[#69f6b8]/10 flex items-center justify-center">
                <QrCode className="w-4 h-4 text-[#69f6b8]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">Scanner pour Valider</h3>
                <p className="text-[10px] text-[#adaaaa]">QR code de fidélité</p>
              </div>
              <div className="ml-auto">
                <CountdownBadge />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 gap-7">
              <div className="relative group w-full max-w-sm">
                <div className="absolute inset-0 bg-[#69f6b8]/8 blur-[60px] rounded-full" />
                <div className="relative bg-[#131313] p-7 rounded-[2rem] shadow-2xl flex flex-col items-center border border-[#69f6b8]/8">
                  <div className="bg-white p-3.5 rounded-2xl shadow-inner mb-5">
                    {qrData ? (
                      <QRCodeSVG value={earnUrl} size={180} level="H" marginSize={0} className="w-[180px] h-[180px]" />
                    ) : (
                      <div className="w-[180px] h-[180px] flex items-center justify-center text-zinc-500 text-center text-sm">
                        {t('merchant.failedLoadQr')}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium text-center text-[#adaaaa]">{t('merchant.scanQrDesc')}</p>
                </div>
              </div>
              {showCustomerLink && (
                <a href={earnUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[#ac8aff] hover:text-white transition-colors text-xs font-medium group">
                  {t('sim.openView')}
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </a>
              )}
            </div>
          </div>

          {/* Right panel: manual validation requests */}
          {validation_mode === 'manual' && (
            <>
              <div className="shrink-0 w-px self-stretch bg-gradient-to-b from-transparent via-[#494847]/30 to-transparent" />

              <div className="w-[55%] flex flex-col rounded-2xl border border-[#ac8aff]/10 overflow-hidden"
                style={{ background: 'linear-gradient(160deg, rgba(172,138,255,0.03) 0%, rgba(14,14,14,0) 60%)' }}>

                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#ac8aff]/10 shrink-0">
                  <div className="w-7 h-7 rounded-lg bg-[#ac8aff]/10 flex items-center justify-center">
                    <BellRing className="w-4 h-4 text-[#ac8aff]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{t('merchant.validationRequests')}</h3>
                    <p className="text-[10px] text-[#adaaaa]">Mode manuel</p>
                  </div>
                  {requests.length > 0 && (
                    <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-[9px] font-black text-red-400 tracking-widest uppercase">{requests.length} live</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(172,138,255,0.2) rgba(255,255,255,0.03)' }}>
                  {requests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-16">
                      <div className="w-14 h-14 rounded-2xl bg-[#ac8aff]/5 border border-[#ac8aff]/10 flex items-center justify-center mb-4">
                        <BellRing className="w-6 h-6 text-[#ac8aff]/40" />
                      </div>
                      <p className="text-[#494847] text-sm text-center">{t('merchant.waitingCustomers')}</p>
                    </div>
                  ) : (
                    requests.map(req => (
                      <div key={req.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-[#1a1919] hover:bg-[#201f1f] transition-all border border-transparent hover:border-[#ac8aff]/10 group animate-in slide-in-from-right-2">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-[#adaaaa] group-hover:text-[#ac8aff] transition-colors shrink-0">
                            <ScanLine className="w-5 h-5" />
                          </div>
                          <div>
                            <h5 className="text-sm font-bold">{t('merchant.newRequest')}</h5>
                            <p className="text-[10px] text-[#adaaaa] flex items-center gap-1.5">
                              {req.device_type && `${req.device_type} • `}
                              <Fingerprint className="w-3 h-3 text-[#494847] shrink-0" />
                              <span className="font-mono font-bold text-[#ac8aff]">{toShortId(req.user_id)}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => handleValidation(req.id, 'approve')}
                            className="px-3 py-1.5 rounded-full bg-[#06b77f] text-[#002919] font-bold text-[11px] flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition-all">
                            <Check className="w-3.5 h-3.5" />
                            {t('merchant.approve')}
                          </button>
                          <button onClick={() => handleValidation(req.id, 'reject')}
                            className="w-8 h-8 rounded-full border border-[#494847]/20 flex items-center justify-center text-[#adaaaa] hover:bg-red-500/10 hover:text-red-400 transition-all">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
