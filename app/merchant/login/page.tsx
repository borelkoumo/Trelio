'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Store, Sparkles } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { AnimatePresence, motion } from 'motion/react'

const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? ''
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? ''
const hasDemo = !!(DEMO_EMAIL && DEMO_PASSWORD)

export default function MerchantLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showDemo, setShowDemo] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/merchant')
    })
  }, [supabase.auth, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      console.log('Login successful')
      router.push('/merchant')
    } catch (error: any) {
      toast.error('Error', { description: error.message || 'Failed to sign in' })
    } finally {
      setLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    setShowDemo(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm flex flex-col gap-3">
        {/* Demo panel — sits above the form, disappears smoothly */}
        <AnimatePresence>
          {hasDemo && showDemo && (
            <motion.div
              key="demo-panel"
              initial={{ opacity: 1, y: 0, height: "auto" }}
              exit={{
                opacity: 0,
                y: -6,
                height: 0,
                transition: { duration: 0.22, ease: "easeInOut" },
              }}
              className="overflow-hidden"
            >
              <div className="bg-zinc-900 text-white rounded-3xl p-6 flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-sm font-semibold">
                    {t("login.demoTitle")}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  {t("login.demoDesc")}
                </p>
                <div className="bg-zinc-800 rounded-xl p-3 mb-4 space-y-1.5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-zinc-500 shrink-0">
                      Email
                    </span>
                    <span className="text-xs font-mono text-zinc-200 truncate">
                      {DEMO_EMAIL}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs text-zinc-500 shrink-0">
                      Password
                    </span>
                    <span className="text-xs font-mono text-zinc-200">
                      {DEMO_PASSWORD}
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="w-full h-9 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
                >
                  {t("login.demoFill")}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login form */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100">
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 bg-zinc-900 rounded-2xl flex items-center justify-center">
              <Store className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-zinc-900 mb-2">
            {t("login.title")}
          </h1>
          <p className="text-center text-zinc-500 mb-8">
            {t("login.subtitle")}
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("login.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="merchant@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-full bg-zinc-900 text-white hover:bg-zinc-800"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                t("login.submit")
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
