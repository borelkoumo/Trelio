'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export default function MerchantLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const supabase = createClient()
  const { t } = useLanguage()

  // Pre-fill demo credentials when ?demo=1 is present in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('demo') === '1') {
      setIsDemo(true)
      setEmail(process.env.NEXT_PUBLIC_DEMO_EMAIL || '')
      setPassword(process.env.NEXT_PUBLIC_DEMO_PASSWORD || '')
    }
  }, [])

  // Listen for auth state changes and hard-redirect on session creation.
  // window.location.href (full page reload) is used instead of router.push
  // because on mobile browsers the client-side router can navigate before
  // the Supabase session cookie is fully written, causing the middleware to
  // bounce the user back to /login.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' && session) {
        window.location.href = '/merchant'
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      // Navigation is handled by the onAuthStateChange listener above
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to sign in' })
      setLoading(false)
    }
    // Note: setLoading(false) is intentionally omitted on success —
    // the spinner stays while the redirect is in flight.
  }

  return (
    <div className="min-h-dvh bg-[#000000] text-white flex items-center justify-center p-4 lg:p-6 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-[#69f6b8]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ac8aff]/10 rounded-full blur-[120px] pointer-events-none" />

      <main className="relative z-10 w-full max-w-[480px] flex flex-col items-center">

        {/* Logo + Title */}
        <header className="w-full text-center mb-5 lg:mb-12">
          <div className="text-[#69f6b8] font-black tracking-tighter text-4xl mb-3 lg:mb-6">Trelio</div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white mb-3"
            style={{ textShadow: '0 0 20px rgba(105,246,184,0.25)' }}>
            {t('login.title')}
          </h1>
          <p className="text-[#adaaaa] text-sm lg:text-base">{t('login.subtitle')}</p>
        </header>

        {/* Demo hint banner */}
        {isDemo && (
          <div className="w-full mb-4 px-4 py-3 rounded-2xl flex items-start gap-3"
            style={{ background: 'rgba(105,246,184,0.08)', border: '1px solid rgba(105,246,184,0.2)' }}>
            <Sparkles className="w-4 h-4 text-[#69f6b8] mt-0.5 shrink-0" />
            <p className="text-[#69f6b8] text-sm leading-relaxed">
              <span className="font-bold">Compte démo prêt.</span>{' '}
              Les identifiants sont déjà remplis — cliquez simplement sur &quot;Se connecter&quot; pour explorer le tableau de bord marchand.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="w-full p-5 lg:p-8 flex flex-col gap-4 lg:gap-6"
          style={{ background: 'rgba(26, 25, 25, 0.6)', backdropFilter: 'blur(40px)', borderRadius: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>

          {/* ── Social buttons
               Mobile: order-2 (below form)
               Desktop: order-1 (above form) ── */}
          <div className="order-2 lg:order-1 grid grid-cols-3 gap-3 lg:gap-4">
            {/* Google */}
            <button type="button"
              className="flex items-center justify-center h-12 lg:h-14 rounded-xl bg-[#201f1f] hover:bg-[#262626] transition-colors border border-white/5">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>
            {/* Apple */}
            <button type="button"
              className="flex items-center justify-center h-12 lg:h-14 rounded-xl bg-[#201f1f] hover:bg-[#262626] transition-colors border border-white/5">
              <svg className="w-5 h-5 fill-white/70" viewBox="0 0 24 24">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.88-3.12 1.87-2.38 5.98.67 7.13-.51 1.63-1.33 3.01-2.72 4zm-4.32-13.84c-.06-3.28 2.62-5.74 5.38-5.79.43 3.26-2.22 5.98-5.38 5.79z"/>
              </svg>
            </button>
            {/* Facebook */}
            <button type="button"
              className="flex items-center justify-center h-12 lg:h-14 rounded-xl bg-[#201f1f] hover:bg-[#262626] transition-colors border border-white/5">
              <svg className="w-5 h-5 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
              </svg>
            </button>
          </div>

          {/* ── Divider ── */}
          <div className="order-3 lg:order-2 relative flex items-center">
            <div className="flex-grow border-t border-white/5" />
            <span className="flex-shrink mx-4 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.2em] text-[#adaaaa]/60">
              Ou continuer avec
            </span>
            <div className="flex-grow border-t border-white/5" />
          </div>

          {/* ── Form
               Mobile: order-1 (above social/divider)
               Desktop: order-3 (below social/divider) ── */}
          <form onSubmit={handleLogin} className="order-1 lg:order-3 flex flex-col gap-5">

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] px-1" htmlFor="email">
                {t('login.email')}
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#adaaaa] group-focus-within:text-[#69f6b8] transition-colors pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  placeholder="nom@boutique.fr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                  className="w-full h-14 bg-[#131313] rounded-xl pl-10 lg:pl-12 pr-4 text-sm text-white placeholder:text-[#777575] border border-[#494847]/30 focus:border-[#69f6b8] focus:outline-none transition-colors [&:-webkit-autofill]:shadow-[0_0_0_1000px_#131313_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end px-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa]" htmlFor="password">
                  {t('login.password')}
                </label>
                <a className="text-[10px] font-bold text-[#ac8aff] hover:text-white transition-colors" href="#">
                  Oublié ?
                </a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-[#adaaaa] group-focus-within:text-[#69f6b8] transition-colors pointer-events-none" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="w-full h-14 bg-[#131313] rounded-xl pl-10 lg:pl-12 pr-12 text-sm text-white placeholder:text-[#777575] border border-[#494847]/30 focus:border-[#69f6b8] focus:outline-none transition-colors [&:-webkit-autofill]:shadow-[0_0_0_1000px_#131313_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#adaaaa] hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2 px-1">
              <input
                id="remember"
                type="checkbox"
                className="w-3.5 h-3.5 rounded-sm border border-[#494847]/50 bg-[#131313] accent-[#69f6b8] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#69f6b8]/40"
              />
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] cursor-pointer select-none" htmlFor="remember">
                Se souvenir de moi
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#69f6b8] to-[#06b77f] text-[#002919] font-bold text-sm lg:text-base flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-[#69f6b8]/10 disabled:opacity-60"
            >
              {loading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : t('login.submit')
              }
            </button>
          </form>

          {/* Signup link */}
          <div className="order-4 border-t border-white/5 pt-4 text-center">
            <p className="text-[#adaaaa] text-sm">
              Nouveau commerçant ?{' '}
              <a className="text-[#69f6b8] font-bold hover:underline underline-offset-4" href="#">
                Créer un compte
              </a>
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}
