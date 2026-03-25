'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Loader2, Settings, Menu,
  Zap, UserCheck, Store, Trophy, ShieldCheck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useLanguage } from '@/components/language-provider'
import { useMerchant } from '@/components/merchant-provider'

interface MerchantInfo {
  id: string
  name: string
  secret_key: string
  reward_threshold: number
  reward_description: string
  validation_mode: 'automatic' | 'manual'
}

type Tab = 'boutique' | 'programme' | 'validation'

const TABS: { key: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'boutique',   label: 'Boutique',   icon: Store,       color: '#69f6b8' },
  { key: 'programme',  label: 'Programme',  icon: Trophy,      color: '#ac8aff' },
  { key: 'validation', label: 'Validation', icon: ShieldCheck, color: '#77e6ff' },
]

export default function MerchantSettings() {
  const { openDrawer } = useMerchant()
  const [loading, setLoading]       = useState(true)
  const [merchant, setMerchant]     = useState<MerchantInfo | null>(null)
  const [saved, setSaved]           = useState<MerchantInfo | null>(null)
  const [saving, setSaving]         = useState(false)
  const [activeTab, setActiveTab]   = useState<Tab>('boutique')

  const router = useRouter()
  const { t }  = useLanguage()

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/merchant/stats')
      if (res.status === 401) { router.push('/merchant/login'); return }
      const data = await res.json()
      if (res.ok) {
        setMerchant(data.merchant)
        setSaved(data.merchant)
      } else {
        toast.error(t('merchant.failedLoad'), { description: data.error })
      }
    } catch {
      toast.error(t('merchant.failedLoad'))
    } finally {
      setLoading(false)
    }
  }, [router, t])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
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
        setSaved(data.merchant)
      } else {
        toast.error(t('merchant.failedConfig'), { description: data.error })
      }
    } catch {
      toast.error(t('merchant.failedConfig'))
    } finally {
      setSaving(false)
    }
  }

  const handleDiscard = () => {
    if (saved) setMerchant({ ...saved })
  }

  // ── Dirty detection ───────────────────────────────────────────────────────
  const dirtyBoutique   = !!saved && merchant?.name !== saved.name
  const dirtyProgramme  = !!saved && (
    merchant?.reward_threshold !== saved.reward_threshold ||
    merchant?.reward_description !== saved.reward_description
  )
  const dirtyValidation = !!saved && merchant?.validation_mode !== saved.validation_mode
  const isDirty = dirtyBoutique || dirtyProgramme || dirtyValidation

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center pt-14 lg:pt-0">
        <Loader2 className="h-8 w-8 animate-spin text-[#69f6b8]" />
      </div>
    )
  }

  if (!merchant) {
    return (
      <div className="flex flex-1 items-center justify-center pt-14 lg:pt-0">
        <p className="text-[#adaaaa]">{t('merchant.failedData')}</p>
      </div>
    )
  }

  const tabDirty: Record<Tab, boolean> = {
    boutique: dirtyBoutique,
    programme: dirtyProgramme,
    validation: dirtyValidation,
  }

  return (
    <>
      {/* ── Mobile top bar ────────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-5 h-14 bg-[#0e0e0e]/90 backdrop-blur-xl border-b border-[#494847]/10">
        <button onClick={openDrawer}
          className="text-[#adaaaa] hover:text-white p-2 -ml-2 rounded-full hover:bg-[#262626] transition-colors">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#69f6b8]" />
          <span className="text-sm font-bold tracking-tight">{t('merchant.settings')}</span>
        </div>
        <div className="w-9" />
      </header>

      {/* ── Desktop top bar ───────────────────────────────────────────── */}
      <header className="hidden lg:flex items-center px-8 h-16 border-b border-[#494847]/10 bg-[#0e0e0e]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/merchant" className="text-[#adaaaa] hover:text-white text-sm transition-colors">Dashboard</Link>
          <span className="text-[#494847]">/</span>
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#69f6b8]" />
            <span className="text-sm font-bold text-white">{t('merchant.settings')}</span>
          </div>
        </div>
      </header>

      {/* ── Tab bar — sticky below top bar ────────────────────────────── */}
      <div className="sticky top-14 lg:top-16 z-20 bg-[#0e0e0e]/95 backdrop-blur-xl border-b border-[#494847]/10">
        <div className="flex items-center px-5 lg:px-8 gap-1">
          {TABS.map(({ key, label, icon: Icon, color }) => {
            const isActive = activeTab === key
            const dirty    = tabDirty[key]
            return (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 px-4 py-4 text-sm font-semibold transition-all duration-200 ${
                  isActive ? 'text-white' : 'text-[#adaaaa] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: isActive ? color : undefined }} />
                <span className="hidden sm:block">{label}</span>
                {dirty && (
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                )}
                {isActive && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                    style={{ background: color }}
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Page content ──────────────────────────────────────────────── */}
      <main className="flex-1 pt-14 lg:pt-0 pb-32">
        <div className="max-w-2xl px-5 lg:px-8 py-8 mx-auto">

          {/* ── Tab: Boutique ─────────────────────────────────────── */}
          {activeTab === 'boutique' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black tracking-tight">Boutique</h2>
                <p className="text-sm text-[#adaaaa] mt-1">Informations principales de votre établissement.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] px-1">
                  {t('merchant.storeName')}
                </label>
                <input
                  id="name"
                  value={merchant.name}
                  onChange={(e) => setMerchant({ ...merchant, name: e.target.value })}
                  className="w-full h-14 bg-[#131313] rounded-xl px-4 text-sm text-white placeholder:text-[#777575] border border-[#494847]/30 focus:border-[#69f6b8] focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* ── Tab: Programme ────────────────────────────────────── */}
          {activeTab === 'programme' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black tracking-tight">Programme de fidélité</h2>
                <p className="text-sm text-[#adaaaa] mt-1">Configurez les règles d&apos;attribution des récompenses.</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="threshold" className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] px-1">
                  {t('merchant.rewardThreshold')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="threshold"
                    type="text"
                    inputMode="numeric"
                    value={merchant.reward_threshold}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      if (val === '' || Number(val) > 0) {
                        setMerchant({ ...merchant, reward_threshold: val === '' ? 0 : Number(val) })
                      }
                    }}
                    className="w-28 h-14 bg-[#131313] rounded-xl px-4 text-sm text-white placeholder:text-[#777575] border border-[#494847]/30 focus:border-[#69f6b8] focus:outline-none transition-colors tabular-nums"
                  />
                  <span className="text-sm text-[#adaaaa]">points = 1 récompense</span>
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-[#adaaaa] px-1">
                  {t('merchant.rewardDesc')}
                </label>
                <input
                  id="description"
                  value={merchant.reward_description}
                  onChange={(e) => setMerchant({ ...merchant, reward_description: e.target.value })}
                  placeholder={t('merchant.egCoffee')}
                  className="w-full h-14 bg-[#131313] rounded-xl px-4 text-sm text-white placeholder:text-[#777575] border border-[#494847]/30 focus:border-[#69f6b8] focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-[#494847] px-1">Ce texte s&apos;affiche aux clients lors de la validation de leur récompense.</p>
              </div>
            </div>
          )}

          {/* ── Tab: Validation ───────────────────────────────────── */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black tracking-tight">Mode de validation</h2>
                <p className="text-sm text-[#adaaaa] mt-1">{t('merchant.validationModeDesc')}</p>
              </div>
              <div className="space-y-3">
                {/* Automatic */}
                <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-200 ${
                  merchant.validation_mode === 'automatic'
                    ? 'bg-[#69f6b8]/8 ring-1 ring-[#69f6b8]/35'
                    : 'bg-[#1a1919] hover:bg-[#1f1f1f]'
                }`}>
                  <input type="radio" name="validation_mode" value="automatic" className="sr-only"
                    checked={merchant.validation_mode === 'automatic'}
                    onChange={() => setMerchant({ ...merchant, validation_mode: 'automatic' })}
                  />
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    merchant.validation_mode === 'automatic' ? 'bg-[#69f6b8]/20' : 'bg-[#262626]'
                  }`}>
                    <Zap className={`w-5 h-5 ${merchant.validation_mode === 'automatic' ? 'text-[#69f6b8]' : 'text-[#adaaaa]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${merchant.validation_mode === 'automatic' ? 'text-[#69f6b8]' : 'text-white'}`}>
                      {t('merchant.modeAutomatic')}
                    </p>
                    <p className="text-xs text-[#adaaaa] mt-1.5 leading-relaxed">{t('merchant.modeAutomaticDesc')}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                    merchant.validation_mode === 'automatic'
                      ? 'border-[#69f6b8] bg-[#69f6b8]'
                      : 'border-[#494847]'
                  }`}>
                    {merchant.validation_mode === 'automatic' && (
                      <div className="w-2 h-2 rounded-full bg-[#0e0e0e]" />
                    )}
                  </div>
                </label>

                {/* Manual */}
                <label className={`flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-200 ${
                  merchant.validation_mode === 'manual'
                    ? 'bg-[#ac8aff]/8 ring-1 ring-[#ac8aff]/35'
                    : 'bg-[#1a1919] hover:bg-[#1f1f1f]'
                }`}>
                  <input type="radio" name="validation_mode" value="manual" className="sr-only"
                    checked={merchant.validation_mode === 'manual'}
                    onChange={() => setMerchant({ ...merchant, validation_mode: 'manual' })}
                  />
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    merchant.validation_mode === 'manual' ? 'bg-[#ac8aff]/20' : 'bg-[#262626]'
                  }`}>
                    <UserCheck className={`w-5 h-5 ${merchant.validation_mode === 'manual' ? 'text-[#ac8aff]' : 'text-[#adaaaa]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${merchant.validation_mode === 'manual' ? 'text-[#ac8aff]' : 'text-white'}`}>
                      {t('merchant.modeManual')}
                    </p>
                    <p className="text-xs text-[#adaaaa] mt-1.5 leading-relaxed">{t('merchant.modeManualDesc')}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                    merchant.validation_mode === 'manual'
                      ? 'border-[#ac8aff] bg-[#ac8aff]'
                      : 'border-[#494847]'
                  }`}>
                    {merchant.validation_mode === 'manual' && (
                      <div className="w-2 h-2 rounded-full bg-[#0e0e0e]" />
                    )}
                  </div>
                </label>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Floating save/cancel bar — slides up when dirty ──────────── */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            key="save-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 lg:left-64 z-50 px-5 lg:px-8 py-4"
            style={{ background: 'linear-gradient(to top, rgba(14,14,14,1) 60%, transparent)' }}
          >
            <div className="max-w-2xl mx-auto flex items-center gap-3 p-4 rounded-2xl border border-[#494847]/20"
              style={{ background: 'rgba(26,25,25,0.95)', backdropFilter: 'blur(24px)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#adaaaa] truncate">Modifications non sauvegardées</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {dirtyBoutique   && <span className="text-[9px] font-bold text-[#69f6b8] bg-[#69f6b8]/10 px-2 py-0.5 rounded-full">Boutique</span>}
                  {dirtyProgramme  && <span className="text-[9px] font-bold text-[#ac8aff] bg-[#ac8aff]/10 px-2 py-0.5 rounded-full">Programme</span>}
                  {dirtyValidation && <span className="text-[9px] font-bold text-[#77e6ff] bg-[#77e6ff]/10 px-2 py-0.5 rounded-full">Validation</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={handleDiscard}
                  className="h-10 px-4 rounded-xl text-sm font-semibold text-[#adaaaa] border border-[#494847]/40 hover:border-[#494847] hover:text-white transition-all duration-200">
                  Abandonner
                </button>
                <button type="button" onClick={handleSave} disabled={saving}
                  className="h-10 px-5 rounded-xl text-sm font-bold text-[#002919] flex items-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #69f6b8, #06b77f)' }}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('merchant.saveChanges')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
