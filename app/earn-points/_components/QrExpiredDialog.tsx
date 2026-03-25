'use client'

import { Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '@/components/language-provider'

interface Props {
  open: boolean
  onClose: () => void
}

export function QrExpiredDialog({ open, onClose }: Props) {
  const { t } = useLanguage()

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
            onClick={onClose}
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

              <div className="px-6 pt-4 pb-10 flex flex-col items-center text-center gap-5">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-[#f59e0b]" />
                </div>

                {/* Text */}
                <div>
                  <h2 className="text-xl font-black text-white mb-2">{t('earn.qrExpiredTitle')}</h2>
                  <p className="text-[#adaaaa] text-sm leading-relaxed">{t('earn.qrExpiredDesc')}</p>
                </div>

                {/* Close */}
                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#002919] font-black text-base active:scale-95 transition-all shadow-[0_8px_24px_-6px_rgba(105,246,184,0.25)]"
                >
                  {t('earn.close')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
