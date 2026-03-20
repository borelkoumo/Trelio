'use client'

import { useRef, useEffect, useState } from 'react'
import { Camera, History, ScanLine, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion } from 'motion/react'
import { useLanguage } from '@/components/language-provider'

interface MerchantHistory {
  merchant_id: string
  merchant_name: string
  points: number
  threshold: number
  reward_description: string
  last_scan: string
  history: { id: string; date: string }[]
}

export function ScanLanding() {
  const { t } = useLanguage()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [merchants, setMerchants] = useState<MerchantHistory[]>([])

  useEffect(() => {
    fetch('/api/user/history')
      .then(r => r.json())
      .then(data => setMerchants(data.merchants ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans">
      <main className="flex-1 px-6 pt-12 pb-10 flex flex-col items-center max-w-md mx-auto w-full">

        {/* Scanner CTA card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full bg-white rounded-3xl shadow-sm border border-zinc-100 p-10 flex flex-col items-center text-center"
        >
          <div className="h-20 w-20 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
            <ScanLine className="h-10 w-10 text-white" />
          </div>

          <h1 className="text-2xl font-bold text-zinc-900 mb-2">
            {t('scan.title')}
          </h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            {t('scan.subtitle')}
          </p>

          <Button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white rounded-full h-14 text-base font-semibold shadow-md transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Camera className="h-5 w-5" />
            {t('scan.openCamera')}
          </Button>

          {/* Hidden file input — triggers native camera on mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </motion.div>

        {/* Per-merchant history */}
        {merchants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full mt-8"
          >
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="h-4 w-4" /> {t('scan.history')}
            </h3>

            <div className="space-y-4">
              {merchants.map(m => {
                const effectivePoints = Math.max(0, m.points)
                const progressPct = Math.min(100, (effectivePoints / m.threshold) * 100)

                return (
                  <div key={m.merchant_id} className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">

                    {/* Merchant header */}
                    <div className="p-4 pb-3 flex items-center gap-3">
                      <div className="h-10 w-10 bg-zinc-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-base font-bold text-zinc-900">{m.merchant_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{m.merchant_name}</p>
                        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                          <Gift className="h-3 w-3" /> {m.reward_description}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-zinc-900 shrink-0">
                        {effectivePoints}
                        <span className="text-xs font-normal text-zinc-400"> / {m.threshold}</span>
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="px-4 pb-3">
                      <Progress value={progressPct} className="h-2 bg-zinc-100" />
                    </div>

                    {/* Last 3 scans */}
                    {m.history.slice(0, 3).map(item => (
                      <div
                        key={item.id}
                        className="px-4 py-2.5 border-t border-zinc-50 flex justify-between items-center"
                      >
                        <span className="text-xs font-medium text-zinc-600">+1 point</span>
                        <span className="text-xs text-zinc-400">
                          {new Date(item.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  )
}
