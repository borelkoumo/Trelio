'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Gem, Menu, X, QrCode, Globe, Mail,
  ArrowRight, Zap, Gift, Sparkles, HelpCircle,
  Users, Leaf, BarChart2
} from 'lucide-react'
import { useLanguage } from '@/components/language-provider'

export default function Home() {
  const { t, language, setLanguage } = useLanguage()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white font-sans selection:bg-[#69f6b8] selection:text-[#00452d]">

      {/* ── Mobile Drawer Overlay ─────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[55] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ─────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 w-80 z-[60] bg-black rounded-r-2xl shadow-[0_0_48px_rgba(172,138,255,0.04)] overflow-y-auto transition-transform duration-300 lg:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col p-6 gap-6 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gem className="text-[#69f6b8] w-5 h-5" />
              <span className="text-xl font-black text-[#69f6b8]">Trelio</span>
            </div>
            <button className="p-2 text-zinc-400 hover:text-white active:scale-95 transition-transform" onClick={() => setDrawerOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-[#adaaaa] text-xs font-bold uppercase tracking-[0.2em] mb-4 px-4">Menu</p>
            <nav className="flex flex-col gap-2">
              <a className="text-[#69f6b8] font-bold bg-[#1a1919] rounded-xl px-4 py-3 flex items-center gap-4 transition-all active:scale-[0.98]" href="#what-is" onClick={() => setDrawerOpen(false)}>
                <Sparkles className="w-5 h-5" /> Comment ça marche?
              </a>
              <a className="text-[#adaaaa] hover:text-white hover:bg-[#262626] rounded-xl px-4 py-3 flex items-center gap-4 transition-all active:scale-[0.98]" href="#how-it-works" onClick={() => setDrawerOpen(false)}>
                <Zap className="w-5 h-5" /> {t('how.title')}
              </a>
              <a className="text-[#adaaaa] hover:text-white hover:bg-[#262626] rounded-xl px-4 py-3 flex items-center gap-4 transition-all active:scale-[0.98]" href="/merchant/login" onClick={() => setDrawerOpen(false)}>
                <ArrowRight className="w-5 h-5" /> {t('nav.getStarted')}
              </a>
              <a className="text-[#adaaaa] hover:text-white hover:bg-[#262626] rounded-xl px-4 py-3 flex items-center gap-4 transition-all active:scale-[0.98]" href="#" onClick={() => setDrawerOpen(false)}>
                <HelpCircle className="w-5 h-5" /> Aide / FAQ
              </a>
            </nav>
          </div>
          <div className="mt-auto pt-10 border-t border-zinc-800/50">
            <Link href="/merchant/login" onClick={() => setDrawerOpen(false)}>
              <button className="w-full px-6 py-4 bg-[#69f6b8] text-[#00452d] font-black rounded-xl active:scale-95 transition-transform uppercase tracking-tighter">
                {t('nav.merchantLogin')}
              </button>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-[#0e0e0e]/80 backdrop-blur-xl h-16 flex items-center shadow-[0_8px_32px_0_rgba(172,138,255,0.04)]">
        <nav className="flex items-center justify-between px-6 lg:px-8 w-full max-w-7xl mx-auto">

          {/* Left: hamburger (mobile) + logo */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden flex items-center justify-center p-2 text-[#69f6b8] hover:bg-zinc-800/50 rounded-full transition-all active:scale-95"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Gem className="text-[#69f6b8] w-5 h-5" />
              <span className="text-2xl font-black tracking-tighter text-[#69f6b8]">Trelio</span>
            </div>
          </div>

          {/* Center: desktop nav */}
          <div className="hidden lg:flex items-center gap-1 bg-[#1a1919]/60 border border-[#494847]/20 rounded-full px-2 py-1.5 backdrop-blur-sm">
            <a href="#what-is" className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-[#adaaaa] hover:text-white hover:bg-[#262626] transition-all">
              <Sparkles className="w-3.5 h-3.5 text-[#69f6b8]" /> Pourquoi Trelio?
            </a>
            <a href="#how-it-works" className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-[#adaaaa] hover:text-white hover:bg-[#262626] transition-all">
              <Zap className="w-3.5 h-3.5 text-[#69f6b8]" /> {t('how.title')}
            </a>
            <a href="#" className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold text-[#adaaaa] hover:text-white hover:bg-[#262626] transition-all">
              <HelpCircle className="w-3.5 h-3.5 text-[#69f6b8]" /> Aide / FAQ
            </a>
          </div>

          {/* Right: language switcher + CTA */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5 bg-zinc-800/60 p-0.5 rounded-full">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 md:px-3 text-xs font-semibold rounded-full transition-colors ${language === 'en' ? 'bg-[#69f6b8] text-[#00452d]' : 'text-zinc-400 hover:text-white'}`}
              >EN</button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2 py-1 md:px-3 text-xs font-semibold rounded-full transition-colors ${language === 'fr' ? 'bg-[#69f6b8] text-[#00452d]' : 'text-zinc-400 hover:text-white'}`}
              >FR</button>
            </div>
            <Link href="/merchant/login">
              <button className="px-5 py-2 bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#00452d] font-bold rounded-full hover:scale-105 active:scale-95 transition-transform text-sm whitespace-nowrap">
                {t('nav.getStarted')}
              </button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-16">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative h-[calc(100vh-4rem)] flex items-center overflow-hidden">
          {/* Background glows */}
          <div className="absolute top-[-10%] left-[-10%] w-1/2 h-1/2 rounded-full bg-[#ac8aff]/5 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-1/2 h-1/2 rounded-full bg-[#69f6b8]/5 blur-[120px]" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

              {/* Text */}
              <div className="text-center lg:text-left space-y-6 lg:space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1919] border border-[#494847]/15">
                  <span className="w-2 h-2 rounded-full bg-[#69f6b8] animate-pulse" />
                  <span className="text-xs font-medium text-[#adaaaa]">{t('hero.badge')}</span>
                </div>

                {/* Mobile title */}
                <h1 className="lg:hidden text-5xl sm:text-6xl font-black tracking-tighter leading-[0.95] text-white">
                  {t('hero.title1')} <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-500 to-emerald-400">
                    {t('hero.title2')}
                  </span>
                </h1>
                {/* Desktop title */}
                <h1 className="hidden lg:block text-[5rem] leading-[1.1] font-black tracking-tighter" style={{ textShadow: '0 0 20px rgba(105,246,184,0.3)' }}>
                  {t('hero.title1')} <br />
                  <span className="text-[#69f6b8]">{t('hero.title2')}</span>
                </h1>

                <p className="text-lg lg:text-xl text-[#adaaaa] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  {t('hero.subtitle')}
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                  <Link href="/merchant/login" className="w-full sm:w-auto">
                    <button className="w-full px-10 py-5 bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#00452d] font-black rounded-full text-lg hover:scale-105 active:scale-95 transition-all hover:shadow-[0_0_40px_rgba(105,246,184,0.3)]">
                      {t('hero.cta1')}
                    </button>
                  </Link>
                  <Link href="/merchant" className="w-full sm:w-auto">
                    <button className="w-full px-10 py-5 bg-transparent text-white border border-[#494847]/30 font-bold rounded-full text-lg hover:bg-[#1a1919] transition-all active:scale-95">
                      {t('hero.cta2')}
                    </button>
                  </Link>
                </div>
              </div>

              {/* Hero image — desktop only */}
              <div className="hidden lg:block relative">
                <div className="absolute -inset-4 bg-[#69f6b8]/10 blur-3xl rounded-full" />
                <div className="relative rounded-3xl overflow-hidden border border-[#494847]/20 bg-[#201f1f] aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuB6P8B3O1RK-mIle7etfaLY5AC0ll5ctCh1OUTnXuC2yDDB6vAkeM4-OKASIGPIAw-rdc_7y3EiAmkzSQkp6aC3Y6XjMsDQr3diZ5C6hcRaIqiDsJQOo1FHXIzIldLlAtEM5LvGcH77f7eoDjFZn2DGp1RoaqwUVQpim0YPz4t8r3lGk5ip8DDRct-U4SUu7CBoUZ4ZqR_0s8HyljTQkv-wM3zRRN3VxnvooOFjDo1UvVQ-O4uauo5Y4AF9jrdUr_7ZKZZE26kz8A5j"
                    alt="Trelio loyalty app on smartphone"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── What is Trelio ────────────────────────────────────────────── */}
        <section className="py-24 lg:py-32 bg-[#0a0a0a]" id="what-is">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

            {/* Image */}
            <div className="order-2 lg:order-1 relative rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
              <div className="lg:hidden bg-[#1a1919] aspect-square flex flex-col items-center justify-center">
                <QrCode className="w-32 h-32 text-[#69f6b8]/20 mb-4" />
                <p className="text-[#adaaaa] text-sm font-medium tracking-widest uppercase">Scan. Earn. Reward.</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjolk1dKKh3EV8KJDLn504cJkWE4GyrZBMUFvNt1wxdYHoMZGscKCjqITs7xlqH-lNM9pd-jLiySc8eOsBrIKLIQ-SoGVQcanlgPtaRkhJdcCimS4uIHGPwo8Z25o06CxAEgyKx7TbCTrKsoi4g7_C8rR2e4l7qtJGo1FzEQJARK6LCpetbYG50CdreK-m_bFoGMk9R2f3-ezi-F5n3Pt6faY-jAHGawX1TbGO_05DO089pcnYgtlVJGKmDjaSKkmMnKFz8gfW0adx"
                alt="Trelio in a boutique"
                className="hidden lg:block w-full h-[600px] object-cover"
              />
            </div>

            {/* Text */}
            <div className="order-1 lg:order-2 space-y-8 lg:space-y-12">
              <div>
                <span className="text-[#69f6b8] font-black text-sm uppercase tracking-widest mb-4 block">Notre Mission</span>
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                  C&apos;est quoi <span className="text-[#ac8aff]">Trelio?</span>
                </h2>
                <p className="text-lg text-[#adaaaa] leading-relaxed">
                  Trelio est la première plateforme de fidélisation qui ne nécessite ni téléchargement d&apos;application pour vos clients, ni matériel coûteux pour vous.
                </p>
              </div>

              <div className="grid gap-6 lg:gap-8">
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-[#69f6b8]/10 flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6 text-[#69f6b8]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Identification Instantanée</h3>
                    <p className="text-[#adaaaa]">Le client scanne un QR code ou utilise son portefeuille mobile. Pas de formulaires interminables.</p>
                  </div>
                </div>
                <div className="flex gap-5 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-[#ac8aff]/10 flex items-center justify-center shrink-0">
                    <BarChart2 className="w-6 h-6 text-[#ac8aff]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Données Actionnables</h3>
                    <p className="text-[#adaaaa]">Comprenez les habitudes d&apos;achat de vos clients et automatisez vos campagnes avec précision.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Benefits ──────────────────────────────────────────────────── */}
        <section className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-20 space-y-4">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter">Pourquoi passer au digital ?</h2>
              <p className="text-[#adaaaa] text-lg lg:text-xl max-w-2xl mx-auto">Maximisez vos revenus tout en simplifiant la vie de vos clients.</p>
            </div>

            {/* Mobile: 4-card grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
              {[
                { icon: Zap, color: '#69f6b8', bg: 'bg-[#69f6b8]/10', title: 'Zéro Friction', desc: "Réduisez le temps d'attente en caisse de 40%. Vos clients sont identifiés et récompensés avant même de payer." },
                { icon: Leaf, color: '#ac8aff', bg: 'bg-[#ac8aff]/10', title: 'Écolo & Éco', desc: "Économisez des milliers d'euros en impressions de cartes tout en réduisant votre empreinte carbone." },
                { icon: Users, color: '#77e6ff', bg: 'bg-[#77e6ff]/10', title: 'Rétention Client', desc: "Augmentez le panier moyen de 15% grâce à des offres personnalisées directement sur mobile." },
                { icon: BarChart2, color: '#69f6b8', bg: 'bg-[#69f6b8]/10', title: 'Powerful Analytics', desc: "Suivez vos performances en temps réel : scans, clients récurrents, récompenses." },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="p-8 rounded-3xl bg-zinc-900/50 border border-white/5 hover:border-[#69f6b8]/20 transition-all group">
                  <div className={`w-12 h-12 rounded-full ${bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" style={{ color }} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
                  <p className="text-[#adaaaa] text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Desktop: Bento grid inside unified container */}
            <div className="hidden lg:block bg-[#131313]/50 rounded-[2.5rem] p-6 lg:p-12 border border-[#494847]/10">
              <div className="grid grid-cols-3 gap-6">
                {/* Zéro Friction — wide */}
                <div className="col-span-2 bg-[#1a1919] rounded-3xl p-10 flex flex-col justify-between border border-[#494847]/10 group hover:bg-[#201f1f] transition-colors">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-[#69f6b8]/20 flex items-center justify-center mb-8">
                      <Zap className="w-7 h-7 text-[#69f6b8]" />
                    </div>
                    <h3 className="text-3xl font-black mb-4">Zéro Friction</h3>
                    <p className="text-[#adaaaa] text-lg max-w-md">Réduisez le temps d&apos;attente en caisse de 40%. Vos clients sont identifiés et récompensés avant même de payer.</p>
                  </div>
                  <div className="mt-8 rounded-2xl overflow-hidden h-48 bg-[#262626] flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9T6bNTiY9Hj0KQ_EN9zM5wIG_39itGvkxpPzFsqNoCTxUTJ6Svaq8jhmVDFAoc-wgzR_Rrg1gDAkwsVYGqBv1eVLsrXleTzsdtT6f_Vxe_C_lY6cfyI6_0MhlQ9JWvmxxXgupNGe10AXhomEsogS8IL_f2FPV2ZgBBrCl8O6z0-Mwn444wzRlLqhZmPBZmHyU0ksLv1deyqSzBb_HtpTHAhEOUjqnckYr7ocsuolCYbsIE-D5lwtmkhBH-GhopqKlcRm55ga_rAOK"
                      alt="Zero friction"
                      className="w-full h-full object-cover mix-blend-overlay opacity-50"
                    />
                  </div>
                </div>

                {/* Écolo & Éco */}
                <div className="bg-[#201f1f] rounded-3xl p-10 border border-[#494847]/10 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div>
                    <div className="w-14 h-14 rounded-full bg-[#ac8aff]/20 flex items-center justify-center mb-8">
                      <Leaf className="w-7 h-7 text-[#ac8aff]" />
                    </div>
                    <h3 className="text-3xl font-black mb-4">Écolo &amp; Éco</h3>
                    <p className="text-[#adaaaa] text-lg">Économisez des milliers d&apos;euros en impressions et réduisez votre empreinte carbone.</p>
                  </div>
                  <div className="h-32 rounded-full bg-gradient-to-r from-[#69f6b8]/10 to-[#ac8aff]/10 blur-xl" />
                </div>

                {/* Rétention Client */}
                <div className="bg-[#201f1f] rounded-3xl p-10 border border-[#494847]/10 flex flex-col justify-between hover:scale-[1.02] transition-transform">
                  <div className="w-14 h-14 rounded-full bg-[#77e6ff]/20 flex items-center justify-center mb-8">
                    <Users className="w-7 h-7 text-[#77e6ff]" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black mb-4">Rétention Client</h3>
                    <p className="text-[#adaaaa] text-lg">Augmentez le panier moyen de 15% grâce à des offres personnalisées sur mobile.</p>
                  </div>
                </div>

                {/* Social proof — wide */}
                <div className="col-span-2 bg-[#0e0e0e] rounded-3xl p-10 flex flex-col justify-center items-center text-center border border-[#69f6b8]/20 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#69f6b8]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-4xl font-black text-[#69f6b8] mb-4 relative z-10">Rejoignez +500 commerçants</h3>
                  <p className="text-[#adaaaa] text-lg relative z-10">Trelio équipe déjà des centaines de boutiques, restaurants et services de proximité.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────────── */}
        <section className="py-24 lg:py-32 bg-[#050505] overflow-hidden border-t border-[#494847]/10" id="how-it-works">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-12 lg:mb-20 space-y-4">
              <span className="text-[#69f6b8] font-black text-sm uppercase tracking-widest block">Simplicité Absolue</span>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter">
                {t('how.title')} <span className="text-[#69f6b8]">?</span>
              </h2>
              <p className="text-[#adaaaa] text-lg lg:text-xl max-w-2xl mx-auto">Trois étapes simples pour transformer votre commerce.</p>
            </div>

            {/* Mobile: horizontal scroll carousel */}
            <div className="flex gap-6 overflow-x-auto pb-8 snap-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden">
              {[
                { num: '01', icon: QrCode, title: t('how.step1.title'), desc: t('how.step1.desc') },
                { num: '02', icon: Zap, title: t('how.step2.title'), desc: t('how.step2.desc') },
                { num: '03', icon: Gift, title: t('how.step3.title'), desc: t('how.step3.desc') },
              ].map(({ num, icon: Icon, title, desc }) => (
                <div key={num} className="min-w-[300px] snap-center p-10 rounded-[2.5rem] bg-zinc-900 border border-white/5 relative group overflow-hidden transition-colors">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity select-none">
                    <span className="text-9xl font-black text-white">{num}</span>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-[#69f6b8] mb-8">
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4">{title}</h3>
                  <p className="text-[#adaaaa] leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* Desktop: 3-column grid with images */}
            <div className="hidden lg:grid grid-cols-3 gap-8">
              {[
                {
                  num: '01', title: t('how.step1.title'), desc: t('how.step1.desc'),
                  accent: 'hover:border-[#69f6b8]/30',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzjb4lX6TWY7pR5KiJsuOeRL6MbDMKrTCxWNhAjqbCW6SY1gSF7k9tWdUp9S30DR4ygnMtmAtWJC723xMN_nn9--7LynPJkXLbJISvtd_dTpSooAugCcPUnYKdgoXvtCgv_7nd5bB5cBX2A9TNjB42EfvJXjmQvTTJEbRnPws1jnbxoMi4u1Rpt7rz18dSCYpo4POUipB3YDjmTcFE_nTHeh84eR0ryKZWnxuHKyv_7Z_h-AqPmoZKOYiUrdlkr5qRHhdTppvafj5u'
                },
                {
                  num: '02', title: t('how.step2.title'), desc: t('how.step2.desc'),
                  accent: 'hover:border-[#ac8aff]/30',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC339CcsYTJpjOCEFENe0rf-JfXPaJuEy50r20NqMUVF82Ny8aWlG_HIGdA5NfLUcoQ4_KZSyllCOcEdmwli2u7zHxdkuek1PlBPIUhMRmUuE-PHmeKHDrDGIvFRq4lnitXuHyqhlSYA30ITvIlO4FjGOyvtQoVUE7qLGFCyH0GJcODSJ6UUwtY1nS_9fwImXm5ZfgEr61048VmNKwSj6cz0KuDN4X4rMAH03W92FjIf0IKXvOnhQ5imoeaHkdefnE2dpo_Sas90295'
                },
                {
                  num: '03', title: t('how.step3.title'), desc: t('how.step3.desc'),
                  accent: 'hover:border-[#77e6ff]/30',
                  img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDqOH3X1fO6gagIgV8GSdn2tIZG9ha4sFKGUrLux-w7v74vNhicTjSk5cb_eAP1tQvWv_r0P-Q0AJjNMGR1qE1gsfxSmbmLQm3jlWggjEBTngQAkxW9SPE2RUxU5m8yJZIV-0vgY0BCdSFxwhtPBaAxgU4rOnp4Z6i1efgqu-BofWdiPpyWpigs9_YGSP4CViFe3JuUedNxkctB3FXBpgBLYBkbFguqnvd6_z1XW4HKvpahHN27vM8Sn9gkgpQTXGeJ2Z-Sbmrw4ipa'
                },
              ].map(({ num, title, desc, accent, img }) => (
                <div key={num} className={`bg-[#201f1f] rounded-[2.5rem] p-8 border border-[#494847]/10 ${accent} transition-colors flex flex-col h-full space-y-8`}>
                  <div className="text-6xl font-black text-[#494847]/20 italic">{num}</div>
                  <div className="aspect-video rounded-2xl overflow-hidden bg-[#1a1919] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Step ${num}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-2xl font-bold mb-4">{title}</h3>
                    <p className="text-[#adaaaa] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <section className="py-24 lg:py-32 px-6 lg:px-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#69f6b8]/5 pointer-events-none" />
          <div className="max-w-5xl mx-auto relative">
            {/* Mobile */}
            <div className="lg:hidden rounded-[3.5rem] bg-gradient-to-br from-[#1a1919] to-[#0e0e0e] p-10 border border-white/5 text-center">
              <h2 className="text-4xl font-black tracking-tighter mb-6">Prêt à transformer <br />votre commerce ?</h2>
              <p className="text-xl text-[#adaaaa] mb-10">Rejoignez des milliers de commerçants qui ont déjà franchi le pas avec Trelio.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/merchant/login">
                  <button className="px-12 py-6 bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#00452d] font-black rounded-full text-lg hover:scale-105 transition-transform shadow-[0_0_40px_rgba(105,246,184,0.2)]">
                    {t('hero.cta1')}
                  </button>
                </Link>
                <span className="text-zinc-500 font-medium italic">Sans carte bancaire</span>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden lg:block text-center space-y-10">
              <h2 className="text-6xl lg:text-7xl font-black tracking-tighter">Prêt à transformer votre commerce ?</h2>
              <p className="text-xl text-[#adaaaa] leading-relaxed max-w-2xl mx-auto">
                Rejoignez la révolution de la fidélité digitale dès aujourd&apos;hui. <br />
                Installation gratuite, sans engagement, plaisir garanti.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/merchant/login">
                  <button className="px-14 py-6 rounded-full bg-gradient-to-br from-[#69f6b8] to-[#06b77f] text-[#00452d] font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(105,246,184,0.3)]">
                    Essayer gratuitement
                  </button>
                </Link>
                <Link href="/merchant">
                  <button className="px-14 py-6 rounded-full bg-[#1a1919] border border-[#494847] text-white font-bold text-xl hover:bg-[#201f1f] transition-all">
                    Voir la démo
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="w-full bg-black pt-16 lg:pt-20 pb-10 border-t border-[#494847]/15">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 lg:gap-12">

          <div className="col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <Gem className="text-[#69f6b8] w-5 h-5" />
              <span className="text-xl font-bold text-[#69f6b8]">Trelio</span>
            </div>
            <p className="text-sm text-[#adaaaa] leading-relaxed max-w-xs">
              Redéfinir la relation entre commerçants et clients grâce à une technologie invisible et durable.
            </p>
            <div className="flex gap-4">
              <a className="w-10 h-10 rounded-full bg-[#201f1f] border border-[#494847]/10 flex items-center justify-center text-[#adaaaa] hover:text-[#ac8aff] opacity-80 hover:opacity-100 transition-all" href="#">
                <Globe className="w-4 h-4" />
              </a>
              <a className="w-10 h-10 rounded-full bg-[#201f1f] border border-[#494847]/10 flex items-center justify-center text-[#adaaaa] hover:text-[#ac8aff] opacity-80 hover:opacity-100 transition-all" href="#">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Produit</h4>
            <ul className="space-y-3 text-sm text-[#adaaaa]">
              {['Fonctionnalités', 'Tarifs', 'Portefeuille Mobile', 'Intégrations POS'].map(item => (
                <li key={item}><a className="hover:text-[#ac8aff] transition-colors" href="#">{item}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Entreprise</h4>
            <ul className="space-y-3 text-sm text-[#adaaaa]">
              {['À propos', 'Blog', 'Carrières', 'Contact'].map(item => (
                <li key={item}><a className="hover:text-[#ac8aff] transition-colors" href="#">{item}</a></li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white mb-6 text-sm uppercase tracking-widest">Support</h4>
            <ul className="space-y-3 text-sm text-[#adaaaa]">
              {["Centre d'aide", 'Documentation API', 'Statut', 'Sécurité'].map(item => (
                <li key={item}><a className="hover:text-[#ac8aff] transition-colors" href="#">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 pt-8 border-t border-[#494847]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#adaaaa]">© {new Date().getFullYear()} Trelio. {t('footer.rights')}</p>
          <div className="flex gap-8 text-sm text-[#adaaaa]">
            <a className="hover:text-white transition-colors" href="#">Mentions Légales</a>
            <a className="hover:text-white transition-colors" href="#">Confidentialité</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
