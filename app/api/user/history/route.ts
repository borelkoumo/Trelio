import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const fideloAnonId = cookieStore.get('fidelo_anon_id')?.value

    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    const userId = fideloAnonId || user?.id

    if (!userId) {
      return NextResponse.json({ history: [] })
    }

    const supabase = await createAdminClient()
    const { data: points } = await supabase
      .from('points')
      .select('id, created_at, merchants(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      history: points?.map(p => ({
        id: p.id,
        merchant_name: (p.merchants as unknown as { name: string } | null)?.name ?? 'Unknown',
        date: p.created_at,
      })) ?? [],
    })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ history: [] })
  }
}
