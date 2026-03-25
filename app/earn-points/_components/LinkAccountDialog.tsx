'use client'

import { useState } from 'react'
import { Loader2, X, Mail, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  merchantId: string
}

// ---------------------------------------------------------------------------
// Google SVG logo
// ---------------------------------------------------------------------------
function GoogleLogo() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Facebook SVG logo
// ---------------------------------------------------------------------------
function FacebookLogo() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="#1877F2">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Main dialog
// ---------------------------------------------------------------------------
export function LinkAccountDialog({ open, onClose, merchantId }: Props) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'facebook' | null>(null)
  const supabase = createClient()

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setOauthLoading(provider)
    try {
      const res = await fetch('/api/auth/anon-id')
      const { anonId } = await res.json()
      const redirectTo = `${window.location.origin}/auth/callback?anon_id=${anonId ?? ''}&merchant_id=${merchantId}`
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })
      if (error) throw error
    } catch {
      toast.error(t('earn.error'))
      setOauthLoading(null)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSending(true)
    try {
      const res = await fetch('/api/auth/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, merchant_id: merchantId }),
      })
      if (res.ok) {
        setSentEmail(email)
        setSent(true)
      } else {
        toast.error(t('earn.error'), { description: t('earn.failedMagic') })
      }
    } catch {
      toast.error(t('earn.error'), { description: t('earn.unexpected') })
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset state after close animation
    setTimeout(() => {
      setSent(false)
      setSentEmail('')
      setEmail('')
      setOauthLoading(null)
    }, 300)
  }

  const busy = sending || oauthLoading !== null

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div
              className="rounded-t-3xl overflow-hidden"
              style={{ background: '#111111', border: '1px solid rgba(255,255,255,0.05)', borderBottom: 'none' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-[#262626]" />
              </div>

              <AnimatePresence mode="wait">
                {sent ? (
                  /* ── Sent state ─────────────────────────────────────── */
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pt-4 pb-10 flex flex-col items-center text-center gap-5"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-[#69f6b8]/10 border border-[#69f6b8]/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-[#69f6b8]" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white mb-1">{t('earn.magicSent')}</h2>
                      <p className="text-[#adaaaa] text-sm leading-relaxed">{t('earn.magicDesc')}</p>
                      <p className="mt-2 font-mono text-sm font-bold text-[#69f6b8]">{sentEmail}</p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="w-full py-4 rounded-full bg-[#1a1919] border border-[#262626] text-[#adaaaa] font-bold text-sm active:scale-95 transition-all"
                    >
                      {t('earn.close')}
                    </button>
                  </motion.div>
                ) : (
                  /* ── Form state ─────────────────────────────────────── */
                  <motion.div
                    key="form"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    className="px-6 pt-4 pb-10"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-5">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-7 h-7 rounded-lg bg-[#69f6b8]/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-[#69f6b8]" />
                          </div>
                          <h2 className="text-lg font-black text-white">{t('earn.protectTitle')}</h2>
                        </div>
                        <p className="text-[#adaaaa] text-sm leading-relaxed">{t('earn.protectDesc')}</p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="ml-3 w-8 h-8 rounded-full bg-[#1a1919] flex items-center justify-center text-[#adaaaa] hover:text-white shrink-0 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bonus chip */}
                    <div className="flex items-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-[#69f6b8]/5 border border-[#69f6b8]/15">
                      <span className="text-[#69f6b8] text-xl">🎁</span>
                      <p className="text-sm text-[#adaaaa]">
                        Créez un compte et recevez{' '}
                        <span className="text-[#69f6b8] font-bold">+1 point bonus</span>{' '}
                        offert sur ce passage
                      </p>
                    </div>

                    {/* OAuth buttons */}
                    <div className="grid grid-cols-2 gap-3 mb-5">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleOAuth('google')}
                        className="h-14 rounded-2xl bg-[#1a1919] border border-[#262626] flex items-center justify-center gap-2.5 font-bold text-sm text-white hover:bg-[#201f1f] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {oauthLoading === 'google'
                          ? <Loader2 className="w-4 h-4 animate-spin text-[#adaaaa]" />
                          : <><GoogleLogo /><span>{t('earn.saveWithGoogle').split(' ').pop()}</span></>
                        }
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleOAuth('facebook')}
                        className="h-14 rounded-2xl bg-[#1a1919] border border-[#262626] flex items-center justify-center gap-2.5 font-bold text-sm text-white hover:bg-[#201f1f] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {oauthLoading === 'facebook'
                          ? <Loader2 className="w-4 h-4 animate-spin text-[#adaaaa]" />
                          : <><FacebookLogo /><span>Facebook</span></>
                        }
                      </button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-px bg-[#1f1f1f]" />
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#494847]">{t('earn.or')}</span>
                      <div className="flex-1 h-px bg-[#1f1f1f]" />
                    </div>

                    {/* Magic link form */}
                    <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#494847] group-focus-within:text-[#69f6b8] transition-colors pointer-events-none" />
                        <input
                          type="email"
                          placeholder="votre@email.com"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          disabled={busy}
                          className="w-full h-14 bg-[#131313] rounded-2xl pl-11 pr-4 text-sm text-white placeholder:text-[#494847] border border-[#262626] focus:border-[#69f6b8] focus:outline-none transition-colors disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={busy || !email}
                        className="w-full h-14 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-base flex items-center justify-center gap-2.5 shadow-[0_8px_24px_-6px_rgba(105,246,184,0.3)] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                      >
                        {sending
                          ? <Loader2 className="w-5 h-5 animate-spin" />
                          : <>{t('earn.sendMagic')}<ArrowRight className="w-4 h-4" /></>
                        }
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
