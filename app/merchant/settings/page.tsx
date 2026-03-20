'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { MerchantHeader } from '@/components/merchant-header'

interface MerchantInfo {
  id: string
  name: string
  secret_key: string
  reward_threshold: number
  reward_description: string
  validation_mode: 'automatic' | 'manual'
}

export default function MerchantSettings() {
  const [loading, setLoading] = useState(true)
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null)
  const [saving, setSaving] = useState(false)
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

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant) return

    setSaving(true)
    try {
      const res = await fetch('/api/merchant/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: merchant.name,
          reward_threshold: Number(merchant.reward_threshold),
          reward_description: merchant.reward_description,
          validation_mode: merchant.validation_mode,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast(t('merchant.configSaved'))
        setMerchant(data.merchant)
      } else {
        toast.error(t('merchant.failedConfig'), { description: data.error })
      }
    } catch (error) {
      toast.error(t('merchant.failedConfig'))
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">{t('merchant.settings')}</h1>
          <p className="text-zinc-500">{t('merchant.programConfig')}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm">
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('merchant.storeName')}</Label>
              <Input
                id="name"
                value={merchant.name}
                onChange={(e) => setMerchant({ ...merchant, name: e.target.value })}
                className="h-12 rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="threshold">{t('merchant.rewardThreshold')}</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                value={merchant.reward_threshold}
                onChange={(e) => setMerchant({ ...merchant, reward_threshold: Number(e.target.value) })}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('merchant.rewardDesc')}</Label>
              <Input
                id="description"
                value={merchant.reward_description}
                onChange={(e) => setMerchant({ ...merchant, reward_description: e.target.value })}
                placeholder={t('merchant.egCoffee')}
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div>
                <Label className="text-base">{t('merchant.validationMode')}</Label>
                <p className="text-sm text-zinc-500">{t('merchant.validationModeDesc')}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none ${
                    merchant.validation_mode === 'automatic'
                      ? 'border-zinc-900 ring-1 ring-zinc-900'
                      : 'border-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="validation_mode"
                    value="automatic"
                    className="sr-only"
                    checked={merchant.validation_mode === 'automatic'}
                    onChange={(e) => setMerchant({ ...merchant, validation_mode: e.target.value as 'automatic' | 'manual' })}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-zinc-900">{t('merchant.modeAutomatic')}</span>
                      <span className="mt-1 flex items-center text-sm text-zinc-500">{t('merchant.modeAutomaticDesc')}</span>
                    </span>
                  </span>
                  <svg
                    className={`h-5 w-5 ${merchant.validation_mode === 'automatic' ? 'text-zinc-900' : 'invisible'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>

                <label
                  className={`relative flex cursor-pointer rounded-xl border p-4 shadow-sm focus:outline-none ${
                    merchant.validation_mode === 'manual'
                      ? 'border-zinc-900 ring-1 ring-zinc-900'
                      : 'border-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="validation_mode"
                    value="manual"
                    className="sr-only"
                    checked={merchant.validation_mode === 'manual'}
                    onChange={(e) => setMerchant({ ...merchant, validation_mode: e.target.value as 'automatic' | 'manual' })}
                  />
                  <span className="flex flex-1">
                    <span className="flex flex-col">
                      <span className="block text-sm font-medium text-zinc-900">{t('merchant.modeManual')}</span>
                      <span className="mt-1 flex items-center text-sm text-zinc-500">{t('merchant.modeManualDesc')}</span>
                    </span>
                  </span>
                  <svg
                    className={`h-5 w-5 ${merchant.validation_mode === 'manual' ? 'text-zinc-900' : 'invisible'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="h-12 px-8 rounded-full bg-zinc-900 text-white hover:bg-zinc-800">
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {t('merchant.saveChanges')}
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}
