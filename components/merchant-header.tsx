'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Store, LogOut, Settings, Code, Globe, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/language-provider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function MerchantHeader() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/merchant/login')
  }

  return (
    <header className="bg-white border-b border-zinc-200 sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/merchant" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Store className="h-5 w-5 text-zinc-900" />
            <span className="font-bold text-lg text-zinc-900">Trelio</span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="rounded-full md:hidden h-10 w-10" />}>
              <Menu className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-2xl p-1">
              <DropdownMenuItem render={<Link href="/merchant/settings" />} className="rounded-xl cursor-pointer flex items-center py-3 px-3 text-sm font-medium">
                <Settings className="h-4 w-4 mr-3 shrink-0" />
                {t('merchant.settings')}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href="/merchant/integration" />} className="rounded-xl cursor-pointer flex items-center py-3 px-3 text-sm font-medium">
                <Code className="h-4 w-4 mr-3 shrink-0" />
                {t('merchant.integration')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 rounded-xl cursor-pointer focus:text-red-600 focus:bg-red-50 flex items-center py-3 px-3 text-sm font-medium">
                <LogOut className="h-4 w-4 mr-3 shrink-0" />
                {t('merchant.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden md:flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="rounded-full h-9" />}>
                <Settings className="h-4 w-4 mr-2" />
                {t('merchant.settings')}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl">
                <DropdownMenuItem render={<Link href="/merchant/settings" />} className="rounded-xl cursor-pointer flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  {t('merchant.settings')}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/merchant/integration" />} className="rounded-xl cursor-pointer flex items-center">
                  <Code className="h-4 w-4 mr-2" />
                  {t('merchant.integration')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500 rounded-full h-9">
              <LogOut className="h-4 w-4 mr-2" />
              {t('merchant.logout')}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
