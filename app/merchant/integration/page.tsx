'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Copy, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { MerchantHeader } from '@/components/merchant-header'

interface MerchantInfo {
  id: string
  name: string
  secret_key: string
}

export default function MerchantIntegration() {
  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const fetchData = useCallback(async () => {
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
        toast.error(t('merchant.failedLoad'), { description: data.error })
      }
    } catch (error) {
      toast.error(t('merchant.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [router, t])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const copyToClipboard = (text: string, type: 'id' | 'key') => {
    navigator.clipboard.writeText(text)
    if (type === 'id') {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    } else {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
    toast(t('merchant.copied'))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-zinc-500">{t('merchant.failedData')}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 pb-12">
      <MerchantHeader />

      <main className="max-w-3xl mx-auto px-6 mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t('merchant.integration')}</h1>
          <p className="text-zinc-500">{t('merchant.apiCreds')}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
          <p className="text-zinc-500 mb-8">{t('merchant.useCreds')}</p>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label>{t('merchant.merchantId')}</Label>
              <div className="relative">
                <Input readOnly value={merchant.id} className="h-12 rounded-xl font-mono text-sm bg-zinc-50 pr-14" />
                <button
                  type="button"
                  onClick={() => copyToClipboard(merchant.id, 'id')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-zinc-900 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors"
                >
                  {copiedId ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-red-600 flex items-center gap-2">
                {t('merchant.secretKey')}
                <span className="text-xs font-normal bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{t('merchant.keepSecret')}</span>
              </Label>
              <div className="relative">
                <Input
                  readOnly
                  type="password"
                  value={merchant.secret_key}
                  className="h-12 rounded-xl font-mono text-sm bg-zinc-50 pr-14"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(merchant.secret_key, 'key')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-9 w-9 rounded-lg bg-zinc-900 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors"
                >
                  {copiedKey ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-sm text-zinc-500 mt-2">
                {t('merchant.doNotShare')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
