'use client'

import { useRef, useEffect, useState } from 'react'
import { Camera, History, ScanLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'motion/react'
import { useLanguage } from '@/components/language-provider'

interface ScanHistoryItem {
  id: string
  merchant_name: string
  date: string
}

export function ScanLanding() {
  const { t } = useLanguage()
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [history, setHistory] = useState<ScanHistoryItem[]>([])

  useEffect(() => {
    fetch('/api/user/history')
      .then(r => r.json())
      .then(data => setHistory(data.history ?? []))
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
            // No onChange handler: native QR scanning on the device handles the redirect
          />
        </motion.div>

        {/* Scan history */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="w-full mt-8"
          >
            <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <History className="h-4 w-4" /> {t('scan.history')}
            </h3>
            <div className="space-y-3">
              {history.map(item => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-xl border border-zinc-100 flex justify-between items-center shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{item.merchant_name}</p>
                    <p className="text-xs text-zinc-400">+1 point</p>
                  </div>
                  <span className="text-xs text-zinc-500">
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
          </motion.div>
        )}
      </main>
    </div>
  )
}
