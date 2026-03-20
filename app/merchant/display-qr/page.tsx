'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { Loader2, ArrowLeft, Check, X, BellRing, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface MerchantInfo {
  id: string
  name: string
  validation_mode: 'automatic' | 'manual'
}

interface ValidationRequest {
  id: string
  user_id: string
  user_email: string | null
  device_type: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export default function DisplayQRPage() {
  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [requests, setRequests] = useState<ValidationRequest[]>([])
  const router = useRouter()
  const { t } = useLanguage()
  const supabase = createClient()

  const fetchMerchant = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/stats')
      if (res.status === 401) {
        router.push('/merchant/login')
        return
      }
      const data = await res.json()
      if (res.ok) {
        setMerchant(data.merchant)
      } else {
        toast.error(t('merchant.failedData'))
      }
    } catch (error) {
      toast.error(t('merchant.failedData'))
    }
  }, [router, t])

  const fetchQR = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/qr')
      const data = await res.json()
      if (data.qrData) {
        setQrData(data.qrData)
      }
    } catch (error) {
      console.error('Failed to fetch QR code', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMerchant()
  }, [fetchMerchant])

  useEffect(() => {
    if (!merchant) return

    fetchQR()
    const interval = setInterval(fetchQR, 60000)

    // Request Wake Lock to keep screen on
    let wakeLock: WakeLockSentinel | null = null
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') {
          wakeLock = await navigator.wakeLock.request('screen')
        }
      } catch (err) {
        // Silently ignore — wake lock is a best-effort enhancement
      }
    }
    requestWakeLock()
    document.addEventListener('visibilitychange', requestWakeLock)

    // Setup Realtime subscription for manual validation
    let subscription: ReturnType<typeof supabase.channel> | null = null
    if (merchant.validation_mode === 'manual') {
      subscription = supabase
        .channel('validation_requests')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'validation_requests',
            filter: `merchant_id=eq.${merchant.id}`,
          },
          (payload) => {
            const newReq = payload.new as ValidationRequest
            if (newReq.status === 'pending') {
              setRequests((prev) => [...prev, newReq])
              // Play a sound or vibrate if possible
              try {
                if ('vibrate' in navigator) {
                  navigator.vibrate([200, 100, 200])
                }
              } catch (e) {}
            }
          }
        )
        .subscribe()
    }

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', requestWakeLock)
      if (wakeLock) {
        wakeLock.release().catch(console.error)
      }
      if (subscription) {
        supabase.removeChannel(subscription)
      }
    }
  }, [merchant, fetchQR, supabase])

  const handleValidation = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      // Optimistically remove from list
      setRequests((prev) => prev.filter((r) => r.id !== requestId))

      const res = await fetch('/api/merchant/validate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || t('merchant.failedProcessRequest'))
        // Re-fetch requests if it failed
      } else {
        toast.success(action === 'approve' ? t('merchant.requestApproved') : t('merchant.requestRejected'))
      }
    } catch (error) {
      toast.error(t('merchant.failedProcessRequest'))
    }
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const earnUrl = qrData ? `${origin}/earn-points?data=${encodeURIComponent(qrData)}` : ''

  // Show the "open customer view" debug link on localhost (all merchants)
  // and in production only for the designated demo merchant.
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  const isDemoMerchant = merchant?.id === process.env.NEXT_PUBLIC_DEMO_MERCHANT_ID
  const showCustomerLink = (isLocalhost || isDemoMerchant) && !!earnUrl

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col font-sans text-white">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        <Button
          variant="ghost"
          onClick={() => router.push('/merchant')}
          className="text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          {t('merchant.backToDashboard')}
        </Button>
        <div className="text-zinc-400 text-sm font-medium">
          {merchant?.name}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl flex flex-col items-center max-w-md w-full">
          {qrData ? (
            <QRCodeSVG
              value={earnUrl}
              size={220}
              level="H"
              includeMargin={false}
              className="w-full h-auto max-w-[220px]"
            />
          ) : (
            <div className="w-[300px] h-[300px] flex items-center justify-center text-zinc-500 text-center">
              {t('merchant.failedLoadQr')}
            </div>
          )}
        </div>
        <p className="mt-8 text-zinc-400 text-center max-w-sm">
          {t('merchant.scanQrDesc')}
        </p>

        {showCustomerLink && (
          <a
            href={earnUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 underline underline-offset-4 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('sim.openView')}
          </a>
        )}
      </div>

      {/* Validation Requests Area (Manual Mode) */}
      {merchant?.validation_mode === 'manual' && (
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 min-h-[120px]">
          <div className="max-w-md mx-auto">
            <h3 className="text-sm font-medium text-zinc-400 mb-4 flex items-center uppercase tracking-wider">
              <BellRing className="h-4 w-4 mr-2" />
              {t('merchant.validationRequests')} ({requests.length})
            </h3>
            
            {requests.length === 0 ? (
              <div className="text-center text-zinc-600 py-4">
                {t('merchant.waitingCustomers')}
              </div>
            ) : (
              <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                {requests.map((req) => (
                  <div key={req.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-medium text-white">{t('merchant.newRequest')}</span>
                      {req.device_type && (
                        <span className="text-xs text-zinc-400">{req.device_type}</span>
                      )}
                      <span className="text-xs text-zinc-500 font-mono truncate">
                        {req.user_email ?? `${req.user_id.substring(0, 8)}…`}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleValidation(req.id, 'reject')}
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full border-red-900/50 text-red-500 hover:bg-red-950 hover:text-red-400"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                      <Button
                        onClick={() => handleValidation(req.id, 'approve')}
                        className="h-10 px-6 rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                      >
                        <Check className="mr-2 h-5 w-5" />
                        {t('merchant.approve')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
