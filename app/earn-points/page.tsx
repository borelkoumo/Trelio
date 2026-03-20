'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, Gift, History, ShieldAlert, X } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'

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

function EarnPointsContent() {
  const searchParams = useSearchParams()
  const qrData = searchParams.get('data')
  const { t } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [addingPoint, setAddingPoint] = useState(false)
  const [successAnim, setSuccessAnim] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [email, setEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [pendingValidation, setPendingValidation] = useState(false)
  const [validationRequestId, setValidationRequestId] = useState<string | null>(null)
  const [pointEarned, setPointEarned] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.debug('[earn-points] auth user:', user?.email ?? user?.id ?? 'anonymous')
      setIsAuthenticated(!!user)
    })
  }, [supabase.auth])

  useEffect(() => {
    if (!qrData) {
      setError(t('earn.invalidQr'))
      setLoading(false)
      return
    }

    const validateQR = async () => {
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
        } else {
          setError(data.error || t('earn.invalidQr'))
        }
      } catch (err) {
        setError(t('earn.failedValidate'))
      } finally {
        setLoading(false)
      }
    }

    validateQR()
  }, [qrData, t])

  const fetchProgress = async (merchantId: string) => {
    try {
      const res = await fetch(`/api/user/progress?merchant_id=${merchantId}`)
      const data = await res.json()
      if (res.ok) setProgress(data)
    } catch (err) {
      console.error('Failed to fetch progress', err)
    }
  }

  const handleAddPoint = async () => {
    if (!merchant || !qrData) return

    setAddingPoint(true)
    try {
      const res = await fetch('/api/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: merchant.id, qr_data: qrData }),
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
    } catch (err) {
      toast.error(t('earn.error'), { description: t('earn.unexpected') })
    } finally {
      setAddingPoint(false)
    }
  }

  useEffect(() => {
    if (!pendingValidation || !validationRequestId || !merchant) return

    const subscription = supabase
      .channel(`validation_${validationRequestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'validation_requests',
          filter: `id=eq.${validationRequestId}`,
        },
        async (payload) => {
          const updatedReq = payload.new
          if (updatedReq.status === 'approved') {
            setPendingValidation(false)
            setSuccessAnim(true)
            setTimeout(() => setSuccessAnim(false), 2000)
            await fetchProgress(merchant.id)
            setPointEarned(true)
            toast(t('earn.pointAdded'), { description: t('earn.pointEarned') })
          } else if (updatedReq.status === 'rejected') {
            setPendingValidation(false)
            toast.error(t('earn.validationRejected'), { description: t('earn.merchantRejected') })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(subscription) }
  }, [pendingValidation, validationRequestId, merchant, supabase, t])

  const handleLinkAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !merchant) return

    setLinking(true)
    try {
      const res = await fetch('/api/auth/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, merchant_id: merchant.id }),
      })
      if (res.ok) {
        toast(t('earn.magicSent'), { description: t('earn.magicDesc') })
        setShowLinkDialog(false)
      } else {
        toast.error(t('earn.error'), { description: t('earn.failedMagic') })
      }
    } catch (err) {
      toast.error(t('earn.error'), { description: t('earn.unexpected') })
    } finally {
      setLinking(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    if (!merchant) return
    setOauthLoading(provider)
    try {
      const res = await fetch('/api/auth/anon-id')
      const { anonId } = await res.json()
      const redirectTo = `${window.location.origin}/auth/callback?anon_id=${anonId ?? ''}&merchant_id=${merchant.id}`
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
      if (error) throw error
    } catch (err) {
      toast.error(t('earn.error'))
      setOauthLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    )
  }

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

  const showSaveCta = pointEarned && !isAuthenticated

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <main className="flex-1 px-6 py-12 flex flex-col items-center max-w-md mx-auto w-full">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-3xl shadow-sm border border-zinc-100 p-8 flex flex-col items-center text-center relative overflow-hidden"
        >
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

          <div className="h-16 w-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-6">
            <span className="text-2xl font-bold text-zinc-900">{merchant.name.charAt(0)}</span>
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-1">{merchant.name}</h1>
          <p className="text-zinc-500 text-sm mb-8">{t('earn.digitalCard')}</p>

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

          {progress?.rewardUnlocked ? (
            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-6 mb-6">
              <h3 className="text-emerald-800 font-bold text-lg mb-2">{t('earn.rewardUnlocked')}</h3>
              <p className="text-emerald-600 text-sm mb-4">{t('earn.showScreen')}</p>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-12 text-lg font-medium">
                {t('earn.redeem')}
              </Button>
            </div>
          ) : pendingValidation ? (
            <div className="w-full bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-6 flex flex-col items-center text-center">
              <Loader2 className="h-8 w-8 animate-spin text-amber-600 mb-3" />
              <h3 className="text-amber-800 font-bold text-lg mb-1">{t('earn.waitingValidation')}</h3>
              <p className="text-amber-600 text-sm">{t('earn.askMerchant')}</p>
            </div>
          ) : showSaveCta ? (
            <div className="w-full space-y-3">
              <Button
                onClick={() => setShowLinkDialog(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-14 text-base font-semibold shadow-md active:scale-[0.98] transition-all"
              >
                {t('earn.savePoints')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => window.close()}
                className="w-full text-zinc-400 hover:text-zinc-600 rounded-full h-11"
              >
                <X className="h-4 w-4 mr-2" />
                {t('earn.closeTab')}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAddPoint}
              disabled={addingPoint}
              className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full h-14 text-lg font-medium shadow-md transition-all active:scale-[0.98]"
            >
              {addingPoint ? <Loader2 className="h-5 w-5 animate-spin" /> : t('earn.validate')}
            </Button>
          )}
        </motion.div>

        {/* Education message — shown after earning, for anonymous users only */}
        {showSaveCta && (
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
        )}

        {progress?.history && progress.history.length > 0 && (
          <div className="w-full mt-10">
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="h-4 w-4" /> {t('earn.recent')}
            </h3>
            <div className="space-y-3">
              {progress.history.slice(0, 5).map((item) => (
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

      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl">{t('earn.protectTitle')}</DialogTitle>
            <DialogDescription>{t('earn.protectDesc')}</DialogDescription>
          </DialogHeader>

          {/* OAuth options */}
          <div className="space-y-3 mt-2">
            <Button
              type="button"
              variant="outline"
              disabled={oauthLoading !== null}
              onClick={() => handleOAuth('google')}
              className="w-full h-12 rounded-xl border-zinc-200 font-medium flex items-center gap-3"
            >
              {oauthLoading === 'google' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {t('earn.saveWithGoogle')}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={oauthLoading !== null}
              onClick={() => handleOAuth('facebook')}
              className="w-full h-12 rounded-xl border-zinc-200 font-medium flex items-center gap-3"
            >
              {oauthLoading === 'facebook' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              )}
              {t('earn.saveWithFacebook')}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-xs font-medium text-zinc-400 uppercase">{t('earn.or')}</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </div>

          {/* Email magic link */}
          <form onSubmit={handleLinkAccount} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('earn.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={linking || oauthLoading !== null}
              className="w-full h-12 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {linking ? <Loader2 className="h-5 w-5 animate-spin" /> : t('earn.sendMagic')}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
