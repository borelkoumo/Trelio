'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, Gift, History, ShieldAlert, X, QrCode } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'
import { ScanLanding } from './_components/ScanLanding'
import { LinkAccountDialog } from './_components/LinkAccountDialog'
import { QrExpiredDialog } from './_components/QrExpiredDialog'
import { useShortUserId, UserIdBadge } from './_components/UserIdBadge'

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
  const params = useSearchParams()
  const qrData = params.get('data')
  const earned = params.get('earned')

  if (qrData) return <EarnPointsWithQR qrData={qrData} />
  if (earned === '1') return <EarnedView />
  return <ScanLanding />
}

// ---------------------------------------------------------------------------
// QR earning flow
// ---------------------------------------------------------------------------

function EarnPointsWithQR({ qrData }: { qrData: string }) {
  const { t } = useLanguage()
  const supabase = createClient()
  const shortId = useShortUserId()

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

  // After earning, store merchant context in sessionStorage and swap ?data= for
  // ?earned=1 so a page refresh restores the save-CTA view (EarnedView) instead
  // of re-triggering the QR validation flow.
  useEffect(() => {
    if (pointEarned && merchant) {
      sessionStorage.setItem('earned_merchant', JSON.stringify(merchant))
      window.history.replaceState(null, '', '/earn-points?earned=1')
    }
  }, [pointEarned, merchant])

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
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#69f6b8]" />
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: hard error (invalid QR, unknown merchant, etc.)
  // ---------------------------------------------------------------------------

  if (error || !merchant) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0e0e0e] p-6 text-center">
        <div className="rounded-full bg-[#1a1919] p-4 mb-4">
          <CheckCircle2 className="h-8 w-8 text-[#ff716c]" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{t('earn.oops')}</h1>
        <p className="text-[#adaaaa]">{error || t('earn.wrong')}</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render: loyalty card
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0e0e0e] font-sans text-white">

      {/* Bottom fade decoration */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none z-10" />

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
            className="fixed top-4 right-4 z-50 h-9 w-9 rounded-full bg-[#1a1919]/90 backdrop-blur-sm border border-[#494847]/30 flex items-center justify-center text-[#adaaaa] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      <main className="pt-12 pb-16 px-6 max-w-md mx-auto">

        {/* Success flash */}
        <AnimatePresence>
          {successAnim && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="fixed inset-0 bg-[#69f6b8] z-50 flex items-center justify-center"
            >
              <CheckCircle2 className="h-24 w-24 text-[#002919]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Merchant Identity */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a1919] mb-4 shadow-lg border border-[#494847]/10">
            <span className="text-2xl font-black text-[#69f6b8]">{merchant.name.charAt(0)}</span>
          </div>
          <p className="text-[#ac8aff] font-medium tracking-wider text-[10px] mb-1 uppercase">Vous êtes chez</p>
          <h1 className="font-black tracking-tight text-white text-2xl mb-3">{merchant.name}</h1>
          <UserIdBadge shortId={shortId} />
        </motion.section>

        {/* Progress Bento Card */}
        {progress && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-[#1a1919] rounded-xl p-8 mb-8 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#69f6b8]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[#adaaaa] text-sm font-medium">Votre progression</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-5xl font-black text-white">{progress.points}</span>
                    <span className="text-xl font-bold text-[#adaaaa]">/ {merchant.reward_threshold}</span>
                  </div>
                </div>
                <Gift className="text-[#69f6b8] w-8 h-8" />
              </div>
              {/* Gradient progress bar */}
              <div className="w-full h-3 bg-[#262626] rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#69f6b8] to-[#06b77f] rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((progress.points / merchant.reward_threshold) * 100, 100)}%` }}
                />
              </div>
              {/* Reward info row */}
              <div className="flex items-center gap-3 p-4 bg-[#201f1f] rounded-xl">
                <div className="w-10 h-10 flex items-center justify-center bg-[#69f6b8]/10 rounded-full shrink-0">
                  <Gift className="text-[#69f6b8] w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#adaaaa] leading-none mb-1">Prochain avantage</p>
                  <p className="text-base font-bold text-white">{merchant.reward_description}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* Action area */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-12 text-center"
        >
          {progress?.rewardUnlocked ? (
            <RewardUnlocked />
          ) : pendingValidation ? (
            <PendingValidation shortId={shortId} />
          ) : showSaveCta ? (
            <SaveCtaButton onClick={() => setShowLinkDialog(true)} />
          ) : (
            <>
              <p className="text-[#adaaaa] text-xs mb-4 font-medium">
                {isCooldown
                  ? t('earn.cooldown')
                  : qrExpired
                  ? t('earn.qrExpired')
                  : 'Validez votre achat pour gagner un point de fidélité'}
              </p>
              <button
                onClick={handleAddPoint}
                disabled={validateButtonDisabled}
                className="w-full py-5 px-6 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-lg shadow-[0_12px_32px_-8px_rgba(105,246,184,0.3)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {addingPoint ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    {t('earn.validate')}
                  </>
                )}
              </button>
            </>
          )}
        </motion.section>

        {/* Education banner */}
        {showSaveCta && <EducationBanner />}

        {/* Recent activity */}
        {progress?.history && progress.history.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-[#adaaaa]" /> {t('earn.recent')}
              </h2>
            </div>
            <div className="space-y-3">
              {progress.history.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[#131313]">
                  <p className="text-[#adaaaa] text-sm">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="text-[#69f6b8] font-black">+1pt</span>
                </div>
              ))}
            </div>
          </motion.section>
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
// Earned view — shown when ?earned=1 (after page refresh post-scan)
// ---------------------------------------------------------------------------

function EarnedView() {
  const { t } = useLanguage()
  const shortId = useShortUserId()
  // Lazy init from sessionStorage avoids setState inside effect body
  const [merchant] = useState<MerchantInfo | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const stored = sessionStorage.getItem('earned_merchant')
      return stored ? (JSON.parse(stored) as MerchantInfo) : null
    } catch { return null }
  })
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [showLinkDialog, setShowLinkDialog] = useState(false)

  useEffect(() => {
    if (!merchant) return
    fetch(`/api/user/progress?merchant_id=${merchant.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProgress(data) })
      .catch(() => {})
  }, [merchant])

  // No stored merchant (e.g. new tab opened with ?earned=1) — fall back to landing
  if (merchant === null && typeof window !== 'undefined' && !sessionStorage.getItem('earned_merchant')) {
    return <ScanLanding />
  }

  if (!merchant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#69f6b8]" />
      </div>
    )
  }

  const handleClose = () => {
    sessionStorage.removeItem('earned_merchant')
    window.location.href = '/earn-points'
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] font-sans text-white">

      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none z-10" />

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        onClick={handleClose}
        aria-label={t('earn.closeTab')}
        className="fixed top-4 right-4 z-50 h-9 w-9 rounded-full bg-[#1a1919]/90 backdrop-blur-sm border border-[#494847]/30 flex items-center justify-center text-[#adaaaa] hover:text-white transition-colors cursor-pointer"
      >
        <X className="h-4 w-4" />
      </motion.button>

      <main className="pt-12 pb-16 px-6 max-w-md mx-auto">

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a1919] mb-4 shadow-lg border border-[#494847]/10">
            <span className="text-2xl font-black text-[#69f6b8]">{merchant.name.charAt(0)}</span>
          </div>
          <p className="text-[#ac8aff] font-medium tracking-wider text-[10px] mb-1 uppercase">Vous êtes chez</p>
          <h1 className="font-black tracking-tight text-white text-2xl mb-3">{merchant.name}</h1>
          <UserIdBadge shortId={shortId} />
        </motion.section>

        {progress && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="bg-[#1a1919] rounded-xl p-8 mb-8 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#69f6b8]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <span className="text-[#adaaaa] text-sm font-medium">Votre progression</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-5xl font-black text-white">{progress.points}</span>
                    <span className="text-xl font-bold text-[#adaaaa]">/ {merchant.reward_threshold}</span>
                  </div>
                </div>
                <Gift className="text-[#69f6b8] w-8 h-8" />
              </div>
              <div className="w-full h-3 bg-[#262626] rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#69f6b8] to-[#06b77f] rounded-full transition-all duration-700"
                  style={{ width: `${Math.min((progress.points / merchant.reward_threshold) * 100, 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#201f1f] rounded-xl">
                <div className="w-10 h-10 flex items-center justify-center bg-[#69f6b8]/10 rounded-full shrink-0">
                  <Gift className="text-[#69f6b8] w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#adaaaa] leading-none mb-1">Prochain avantage</p>
                  <p className="text-base font-bold text-white">{merchant.reward_description}</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-12 text-center"
        >
          <SaveCtaButton onClick={() => setShowLinkDialog(true)} />
        </motion.section>

        <EducationBanner />

        {progress?.history && progress.history.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="mt-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                <History className="h-5 w-5 text-[#adaaaa]" /> {t('earn.recent')}
              </h2>
            </div>
            <div className="space-y-3">
              {progress.history.slice(0, 5).map(item => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-[#131313]">
                  <p className="text-[#adaaaa] text-sm">
                    {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <span className="text-[#69f6b8] font-black">+1pt</span>
                </div>
              ))}
            </div>
          </motion.section>
        )}
      </main>

      <LinkAccountDialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        merchantId={merchant.id}
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
    <div className="w-full bg-[#69f6b8]/10 border border-[#69f6b8]/20 rounded-2xl p-6 mb-6">
      <h3 className="text-[#69f6b8] font-bold text-lg mb-2">{t('earn.rewardUnlocked')}</h3>
      <p className="text-[#adaaaa] text-sm mb-4">{t('earn.showScreen')}</p>
      <button className="w-full py-4 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-lg active:scale-95 transition-all">
        {t('earn.redeem')}
      </button>
    </div>
  )
}

function PendingValidation({ shortId }: { shortId: string | null }) {
  const { t } = useLanguage()
  return (
    <div className="w-full bg-[#ac8aff]/10 border border-[#ac8aff]/20 rounded-2xl p-6 mb-6 flex flex-col items-center text-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-[#ac8aff]" />
      <div>
        <h3 className="text-[#ac8aff] font-bold text-lg mb-1">{t('earn.waitingValidation')}</h3>
        <p className="text-[#adaaaa] text-sm">{t('earn.askMerchant')}</p>
      </div>
      {shortId && (
        <div className="flex flex-col items-center gap-1.5 pt-2 border-t border-[#ac8aff]/15 w-full">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]">Montrez ce code au commerçant</p>
          <span className="font-mono text-3xl font-black text-[#ac8aff] tracking-[0.2em]">{shortId}</span>
        </div>
      )}
    </div>
  )
}

function SaveCtaButton({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="w-full">
      <p className="text-center mb-4">
        <span className="text-sm font-medium text-[#adaaaa]">Sauvegarde tes points et gagne </span>
        <span className="inline-block text-xs bg-[#69f6b8]/10 text-[#69f6b8] px-3 py-1 rounded-full font-semibold border border-[#69f6b8]/20">+1 bonus</span>
      </p>
      <button
        onClick={onClick}
        className="w-full py-5 px-6 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-lg shadow-[0_12px_32px_-8px_rgba(105,246,184,0.3)] active:scale-95 transition-all duration-300"
      >
        {t('earn.savePoints')}
      </button>
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
      className="w-full mt-4 bg-[#1a1919] rounded-2xl p-4 flex items-start gap-3"
    >
      <div className="h-8 w-8 bg-[#ac8aff]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
        <ShieldAlert className="h-4 w-4 text-[#ac8aff]" />
      </div>
      <div>
        <p className="text-sm font-medium text-white mb-0.5">{t('earn.protectTitle')}</p>
        <p className="text-xs text-[#adaaaa] leading-relaxed">{t('earn.eduDesc')}</p>
        <p className="text-xs text-[#69f6b8] font-medium mt-1">{t('earn.eduCta')}</p>
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
      <div className="flex min-h-screen items-center justify-center bg-[#0e0e0e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#69f6b8]" />
      </div>
    }>
      <EarnPointsContent />
    </Suspense>
  )
}
