'use client'

import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useLanguage } from '@/components/language-provider'

interface Props {
  open: boolean
  onClose: () => void
}

export function QrExpiredDialog({ open, onClose }: Props) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-3xl p-6 text-center">
        <DialogHeader className="items-center mb-2">
          <div className="h-14 w-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <ShieldAlert className="h-7 w-7 text-amber-500" />
          </div>
          <DialogTitle className="text-xl">{t('earn.qrExpiredTitle')}</DialogTitle>
          <DialogDescription className="mt-1">{t('earn.qrExpiredDesc')}</DialogDescription>
        </DialogHeader>
        <Button
          className="w-full mt-2 rounded-full h-12 bg-zinc-900 text-white hover:bg-zinc-800"
          onClick={onClose}
        >
          {t('earn.close')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
