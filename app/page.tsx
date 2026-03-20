'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Store, Smartphone, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export default function Home() {
  const { t, language, setLanguage } = useLanguage()

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-zinc-900 selection:text-white">
      <header className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-white/80 backdrop-blur-xl border border-zinc-200/50 shadow-sm rounded-full px-4 h-16 flex items-center justify-between w-full max-w-5xl">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-zinc-900 rounded-full flex items-center justify-center">
              <Store className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-zinc-900">Trelio</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600">
            <a href="#how-it-works" className="hover:text-zinc-900 transition-colors">{t('how.title')}</a>
            <Link href="/merchant" className="hover:text-zinc-900 transition-colors">{t('nav.simulator')}</Link>
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 bg-zinc-100/80 p-0.5 rounded-full">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 md:px-3 text-xs font-semibold rounded-full transition-colors ${language === 'en' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 md:px-3 text-xs font-semibold rounded-full transition-colors ${language === 'fr' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}
              >
                FR
              </button>
            </div>
            <Link href="/merchant/login" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="font-medium text-zinc-600 hover:text-zinc-900 rounded-full h-9 px-4">
                {t('nav.merchantLogin')}
              </Button>
            </Link>
            <Link href="/merchant/login">
              <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800 font-medium rounded-full h-9 px-4">
                {t('nav.getStarted')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 sm:pt-32 pb-16 sm:pb-24">
        <section className="max-w-6xl mx-auto px-6 text-center mb-12 sm:mb-32">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-xs sm:text-sm font-medium mb-4 sm:mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            {t('hero.badge')}
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 mb-4 sm:mb-8 leading-[1.1]">
            {t('hero.title1')} <br className="hidden md:block" />
            <span className="text-zinc-400">{t('hero.title2')}</span>
          </h1>
          <p className="text-base sm:text-xl text-zinc-500 mb-6 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <Link href="/merchant/login" className="w-full sm:w-auto">
              <Button className="w-full h-12 sm:h-14 px-8 bg-zinc-900 text-white hover:bg-zinc-800 text-base sm:text-lg font-medium rounded-full">
                {t('hero.cta1')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/merchant" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full h-12 sm:h-14 px-8 text-base sm:text-lg font-medium border-zinc-200 text-zinc-700 hover:bg-zinc-100 rounded-full">
                {t('hero.cta2')}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>

        <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24 bg-zinc-50 rounded-[3rem]">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">{t('how.title')}</h2>
            <p className="text-lg text-zinc-500">{t('how.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{t('how.step1.title')}</h3>
              <p className="text-zinc-500 leading-relaxed">
                {t('how.step1.desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{t('how.step2.title')}</h3>
              <p className="text-zinc-500 leading-relaxed">
                {t('how.step2.desc')}
              </p>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">{t('how.step3.title')}</h3>
              <p className="text-zinc-500 leading-relaxed">
                {t('how.step3.desc')}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-900 text-zinc-400 py-12 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-6 opacity-50">
            <Store className="h-6 w-6 text-white" />
            <span className="font-bold text-xl tracking-tight text-white">Trelio</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Trelio. {t('footer.rights')}</p>
        </div>
      </footer>
    </div>
  )
}
