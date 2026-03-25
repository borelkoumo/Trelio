import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MerchantProvider } from '@/components/merchant-provider'
import { MerchantNav } from '@/components/merchant-nav'

export default async function MerchantPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/merchant/login')

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id, code, name, validation_mode')
    .eq('user_id', user.id)
    .single()

  if (!merchant) redirect('/merchant/login')

  return (
    <MerchantProvider merchant={merchant as { id: string; code: string; name: string; validation_mode: 'automatic' | 'manual' }}>
      <div className="min-h-screen bg-[#0e0e0e] text-white font-sans">
        <MerchantNav />
        <div className="lg:pl-64 flex flex-col min-h-screen">
          {children}
        </div>
      </div>
    </MerchantProvider>
  )
}
