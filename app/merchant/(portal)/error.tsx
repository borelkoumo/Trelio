'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function MerchantError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-6 pt-14 lg:pt-0">
      <div className="w-14 h-14 rounded-2xl bg-[#1a1919] flex items-center justify-center">
        <AlertCircle className="w-7 h-7 text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-white mb-2">Une erreur s&apos;est produite</h2>
        <p className="text-[#adaaaa] text-sm mb-6">
          {error.message || 'Échec du chargement des données'}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-full text-[#002919] font-bold text-sm hover:opacity-90 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg, #69f6b8, #06b77f)' }}
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
