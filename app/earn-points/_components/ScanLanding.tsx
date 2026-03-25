'use client'

import { useRef, useEffect, useState } from 'react'
import { Camera, ScanLine, Gift, History } from 'lucide-react'
import { motion } from 'motion/react'
import { useLanguage } from '@/components/language-provider'
import { useShortUserId, UserIdBadge } from './UserIdBadge'

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
  const shortId = useShortUserId()

  useEffect(() => {
    fetch('/api/user/history')
      .then(r => r.json())
      .then(data => setMerchants(data.merchants ?? []))
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen bg-[#0e0e0e] font-sans text-white">

      {/* Bottom fade */}
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0e0e0e] to-transparent pointer-events-none z-10" />

      <main className="pt-12 pb-16 px-6 max-w-md mx-auto">

        {/* Scanner CTA */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-10 text-center"
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1a1919] mb-6 shadow-lg border border-[#494847]/10 relative">
            <div className="absolute inset-0 rounded-2xl bg-[#69f6b8]/5 blur-xl" />
            <ScanLine className="h-10 w-10 text-[#69f6b8] relative z-10" />
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mb-2">
            {t('scan.title')}
          </h1>
          <p className="text-[#adaaaa] text-sm mb-8 leading-relaxed">
            {t('scan.subtitle')}
          </p>

          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full py-5 px-6 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-lg shadow-[0_12px_32px_-8px_rgba(105,246,184,0.3)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Camera className="h-5 w-5" />
            {t('scan.openCamera')}
          </button>

          {/* Hidden file input — triggers native camera on mobile */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          {/* User identifier */}
          <div className="mt-5 flex justify-center">
            <UserIdBadge shortId={shortId} />
          </div>
        </motion.section>

        {/* Per-merchant history */}
        {merchants.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <History className="h-5 w-5 text-[#adaaaa]" />
              <h2 className="text-xl font-bold tracking-tight">{t('scan.history')}</h2>
            </div>

            <div className="space-y-4">
              {merchants.map(m => {
                const effectivePoints = Math.max(0, m.points)
                const progressPct = Math.min(100, (effectivePoints / m.threshold) * 100)

                return (
                  <div key={m.merchant_id} className="bg-[#1a1919] rounded-2xl overflow-hidden relative">

                    {/* Subtle glow */}
                    <div className="absolute -top-8 -right-8 w-24 h-24 bg-[#69f6b8]/5 rounded-full blur-2xl pointer-events-none" />

                    {/* Merchant header */}
                    <div className="p-5 pb-4 flex items-center gap-3 relative z-10">
                      <div className="h-10 w-10 bg-[#262626] rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-base font-black text-[#69f6b8]">{m.merchant_name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{m.merchant_name}</p>
                        <p className="text-xs text-[#adaaaa] flex items-center gap-1 mt-0.5">
                          <Gift className="h-3 w-3 text-[#69f6b8]" /> {m.reward_description}
                        </p>
                      </div>
                      <span className="text-sm font-black text-white shrink-0">
                        {effectivePoints}
                        <span className="text-xs font-normal text-[#adaaaa]"> / {m.threshold}</span>
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="px-5 pb-4 relative z-10">
                      <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#69f6b8] to-[#06b77f] rounded-full transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* All scans */}
                    {m.history.map(item => (
                      <div
                        key={item.id}
                        className="px-5 py-3 border-t border-[#262626]/60 flex justify-between items-center"
                      >
                        <span className="text-xs font-semibold text-[#69f6b8]">+1pt</span>
                        <span className="text-xs text-[#adaaaa]">
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
          </motion.section>
        )}
      </main>
    </div>
  )
}
