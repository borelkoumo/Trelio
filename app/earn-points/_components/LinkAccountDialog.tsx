'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'
import { createClient } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onClose: () => void
  merchantId: string
}

export function LinkAccountDialog({ open, onClose, merchantId }: Props) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [linking, setLinking] = useState(false)
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

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLinking(true)
    try {
      const res = await fetch('/api/auth/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, merchant_id: merchantId }),
      })
      if (res.ok) {
        toast(t('earn.magicSent'), { description: t('earn.magicDesc') })
        onClose()
      } else {
        toast.error(t('earn.error'), { description: t('earn.failedMagic') })
      }
    } catch {
      toast.error(t('earn.error'), { description: t('earn.unexpected') })
    } finally {
      setLinking(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl">{t('earn.protectTitle')}</DialogTitle>
          <DialogDescription>{t('earn.protectDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={oauthLoading !== null}
            onClick={() => handleOAuth('google')}
            className="w-full h-12 rounded-xl border-zinc-200 font-medium flex items-center gap-3"
          >
            {oauthLoading === 'google' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
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
            {oauthLoading === 'facebook' ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            )}
            {t('earn.saveWithFacebook')}
          </Button>
        </div>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-zinc-100" />
          <span className="text-xs font-medium text-zinc-400 uppercase">{t('earn.or')}</span>
          <div className="flex-1 h-px bg-zinc-100" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="link-email">{t('earn.email')}</Label>
            <Input
              id="link-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
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
  )
}
