'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, Gift, History, ShieldAlert, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'
import { ScanLanding } from './_components/ScanLanding'
import { LinkAccountDialog } from './_components/LinkAccountDialog'
import { QrExpiredDialog } from './_components/QrExpiredDialog'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MerchantInfo {
  id: string
  name: string
  reward_threshold: number
  reward_description: string
}

interface ProgressInfo {
  points: number
  threshold: number
  rewardDescription: string
  history: { id: string; date: string }[]
  rewardUnlocked: boolean
}

function getDeviceType(): string {
  const ua = navigator.userAgent
  if (/iPhone/i.test(ua)) return 'iPhone (Safari)'
  if (/iPad/i.test(ua)) return 'iPad (Safari)'
  if (/Android/i.test(ua) && /Chrome/i.test(ua)) return 'Android (Chrome)'
  if (/Android/i.test(ua)) return 'Android'
  if (/Windows/i.test(ua) && /Chrome/i.test(ua)) return 'Windows (Chrome)'
  if (/Windows/i.test(ua) && /Firefox/i.test(ua)) return 'Windows (Firefox)'
  if (/Windows/i.test(ua)) return 'Windows'
  if (/Macintosh/i.test(ua) && /Chrome/i.test(ua)) return 'Mac (Chrome)'
  if (/Macintosh/i.test(ua)) return 'Mac (Safari)'
  return 'Unknown device'
}

// ---------------------------------------------------------------------------
// Main content — routes to ScanLanding or EarnPointsWithQR
// ---------------------------------------------------------------------------

function EarnPointsContent() {
  const qrData = useSearchParams().get('data')
  if (!qrData) return <ScanLanding />
  return <EarnPointsWithQR qrData={qrData} />
}

// ---------------------------------------------------------------------------
// QR earning flow
// ---------------------------------------------------------------------------

function EarnPointsWithQR({ qrData }: { qrData: string }) {
  const { t } = useLanguage()
  const supabase = createClient()

  // Core state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [progress, setProgress] = useState<ProgressInfo | null>(null)

  // Interaction state
  const [addingPoint, setAddingPoint] = useState(false)
  const [successAnim, setSuccessAnim] = useState(false)
  const [pendingValidation, setPendingValidation] = useState(false)
  const [validationRequestId, setValidationRequestId] = useState<string | null>(null)
  const [pointEarned, setPointEarned] = useState(false)

  // Dialog state
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [qrExpired, setQrExpired] = useState(false)
  const [qrExpiredDialogOpen, setQrExpiredDialogOpen] = useState(false)

  // ---------------------------------------------------------------------------
  // QR validation on mount
  // ---------------------------------------------------------------------------

  const fetchProgress = async (merchantId: string) => {
    try {
      const res = await fetch(`/api/user/progress?merchant_id=${merchantId}`)
      if (res.ok) setProgress(await res.json())
    } catch { /* non-blocking */ }
  }

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch('/api/scan/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: qrData }),
        })
        const data = await res.json()

        if (data.valid) {
          setMerchant(data.merchant)
          await fetchProgress(data.merchant.id)
        } else if (data.merchant) {
          // Expired QR — still show the card, open expired dialog
          setMerchant(data.merchant)
          await fetchProgress(data.merchant.id)
          setQrExpired(true)
          setQrExpiredDialogOpen(true)
        } else {
          setError(data.error || t('earn.invalidQr'))
        }
      } catch {
        setError(t('earn.failedValidate'))
      } finally {
        setLoading(false)
      }
    }
    validate()
  }, [qrData, t])

  // ---------------------------------------------------------------------------
  // Real-time subscription for manual validation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!pendingValidation || !validationRequestId || !merchant) return

    const channel = supabase
      .channel(`validation_${validationRequestId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'validation_requests',
        filter: `id=eq.${validationRequestId}`,
      }, async (payload) => {
        const req = payload.new
        if (req.status === 'approved') {
          setPendingValidation(false)
          setSuccessAnim(true)
          setTimeout(() => setSuccessAnim(false), 2000)
          await fetchProgress(merchant.id)
          setPointEarned(true)
          toast(t('earn.pointAdded'), { description: t('earn.pointEarned') })
        } else if (req.status === 'rejected') {
          setPendingValidation(false)
          toast.error(t('earn.validationRejected'), { description: t('earn.merchantRejected') })
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [pendingValidation, validationRequestId, merchant, supabase, t])

  // ---------------------------------------------------------------------------
  // Add point handler
  // ---------------------------------------------------------------------------

  const handleAddPoint = async () => {
    if (!merchant) return
    setAddingPoint(true)
    try {
      const device_type = typeof navigator !== 'undefined' ? getDeviceType() : undefined
      const res = await fetch('/api/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchant.id, qr_data: qrData, device_type }),
      })
      const data = await res.json()

      if (res.ok) {
        if (data.status === 'pending_validation') {
          setPendingValidation(true)
          setValidationRequestId(data.requestId)
        } else {
          setSuccessAnim(true)
          setTimeout(() => setSuccessAnim(false), 2000)
          await fetchProgress(merchant.id)
          setPointEarned(true)
          toast(t('earn.pointAdded'), { description: t('earn.pointEarned') })
        }
      } else {
        toast.error(t('earn.error'), { description: data.error || t('earn.failedAdd') })
      }
    } catch {
      toast.error(t('earn.error'), { description: t('earn.unexpected') })
    } finally {
      setAddingPoint(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Derived state
  // ---------------------------------------------------------------------------

  const isCooldown = !!(
    progress &&
    progress.history.length > 0 &&
    Date.now() - new Date(progress.history[0].date).getTime() < 10 * 60 * 1000
  )
  const validateButtonDisabled = addingPoint || isCooldown || qrExpired
  const showSaveCta = pointEarned

  // ---------------------------------------------------------------------------
  // Render: loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: hard error (invalid QR, unknown merchant, etc.)
  // ---------------------------------------------------------------------------

  if (error || !merchant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="rounded-full bg-red-100 p-4 mb-4">
          <CheckCircle2 className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">{t('earn.oops')}</h1>
        <p className="text-zinc-600">{error || t('earn.wrong')}</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: loyalty card
  // ---------------------------------------------------------------------------

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">

      {/* Close-tab button — appears after earning */}
      <AnimatePresence>
        {pointEarned && (
          <motion.button
            key="close-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => window.close()}
            aria-label={t('earn.closeTab')}
            className="fixed top-4 right-4 z-50 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-white transition-colors"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <main className="flex-1 px-6 pt-6 pb-10 flex flex-col items-center max-w-md mx-auto w-full">

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-3xl shadow-sm border border-zinc-100 p-8 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Success flash */}
          <AnimatePresence>
            {successAnim && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                className="absolute inset-0 bg-emerald-500 z-10 flex items-center justify-center"
              >
                <CheckCircle2 className="h-24 w-24 text-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Merchant identity */}
          <div className="h-16 w-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-zinc-900">{merchant.name.charAt(0)}</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-1">{merchant.name}</h1>
          <p className="text-zinc-500 text-sm mb-8">{t('earn.digitalCard')}</p>

          {/* Progress */}
          {progress && (
            <div className="w-full mb-8">
              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-bold text-zinc-900">{progress.points}</span>
                <span className="text-zinc-500 font-medium">/ {merchant.reward_threshold}</span>
              </div>
              <Progress value={(progress.points / merchant.reward_threshold) * 100} className="h-3 bg-zinc-100" />
              <p className="text-sm text-zinc-500 mt-3 flex items-center justify-center gap-1.5">
                <Gift className="h-4 w-4" /> {merchant.reward_description}
              </p>
            </div>
          )}

          {/* Action area */}
          {progress?.rewardUnlocked ? (
            <RewardUnlocked />
          ) : pendingValidation ? (
            <PendingValidation />
          ) : showSaveCta ? (
            <SaveCtaButton onClick={() => setShowLinkDialog(true)} />
          ) : (
            <Button
              onClick={handleAddPoint}
              disabled={validateButtonDisabled}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full h-14 text-lg font-medium shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingPoint ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isCooldown ? (
                t('earn.cooldown')
              ) : qrExpired ? (
                t('earn.qrExpired')
              ) : (
                t('earn.validate')
              )}
            </Button>
          )}
        </motion.div>

        {/* Education banner */}
        {showSaveCta && <EducationBanner />}

        {/* Recent scans */}
        {progress?.history && progress.history.length > 0 && (
          <div className="w-full mt-8">
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="h-4 w-4" /> {t('earn.recent')}
            </h3>
            <div className="space-y-3">
              {progress.history.slice(0, 5).map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl border border-zinc-100 flex justify-between items-center shadow-sm">
                  <span className="font-medium text-zinc-900">{t('earn.plusOne')}</span>
                  <span className="text-sm text-zinc-500">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <LinkAccountDialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        merchantId={merchant.id}
      />

      <QrExpiredDialog
        open={qrExpiredDialogOpen}
        onClose={() => setQrExpiredDialogOpen(false)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Small presentational sub-components
// ---------------------------------------------------------------------------

function RewardUnlocked() {
  const { t } = useLanguage()
  return (
    <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6">
      <h3 className="text-emerald-800 font-bold text-lg mb-2">{t('earn.rewardUnlocked')}</h3>
      <p className="text-emerald-600 text-sm mb-4">{t('earn.showScreen')}</p>
      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-12 text-lg font-medium">
        {t('earn.redeem')}
      </Button>
    </div>
  )
}

function PendingValidation() {
  const { t } = useLanguage()
  return (
    <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-6 flex flex-col items-center text-center">
      <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
      <h3 className="text-amber-800 font-bold text-lg mb-1">{t('earn.waitingValidation')}</h3>
      <p className="text-amber-600 text-sm">{t('earn.askMerchant')}</p>
    </div>
  )
}

function SaveCtaButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="w-full">
      <p className="text-center mt-2 mb-4">
        <span className="text-sm font-medium text-zinc-900">Sauvegarde tes points et gagne </span>
        <span className="inline-block text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold">+1 bonus</span>
      </p>
      <Button
        onClick={onClick}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-14 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
      >
        {t('earn.savePoints')}
      </Button>
    </div>
  )
}

function EducationBanner() {
  const { t } = useLanguage()
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="w-full mt-4 bg-white border border-zinc-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm"
    >
      <div className="h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-900 mb-0.5">{t('earn.protectTitle')}</p>
        <p className="text-xs text-zinc-500 leading-relaxed">{t('earn.eduDesc')}</p>
        <p className="text-xs text-emerald-600 font-medium mt-1">{t('earn.eduCta')}</p>
      </div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export default function EarnPointsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    }>
      <EarnPointsContent />
    </Suspense>
  )
}
