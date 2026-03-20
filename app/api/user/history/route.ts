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
      return NextResponse.json({ merchants: [] })
    }

    const supabase = await createAdminClient()

    // All points for this user, newest first, with merchant info
    const { data: points } = await supabase
      .from('points')
      .select('id, created_at, merchant_id, merchants(id, name, reward_threshold, reward_description)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Rewards per merchant to compute effective points
    const { data: rewards } = await supabase
      .from('rewards')
      .select('merchant_id')
      .eq('user_id', userId)

    if (!points || points.length === 0) {
      return NextResponse.json({ merchants: [] })
    }

    type MerchantRow = {
      id: string
      name: string
      reward_threshold: number
      reward_description: string
    }

    type MerchantEntry = {
      merchant_id: string
      merchant_name: string
      threshold: number
      reward_description: string
      last_scan: string
      history: { id: string; date: string }[]
    }

    // Group scans by merchant; map preserves insertion order (newest first per merchant)
    const merchantMap = new Map<string, MerchantEntry>()

    for (const point of points) {
      const m = point.merchants as unknown as MerchantRow | null
      if (!m) continue
      if (!merchantMap.has(point.merchant_id)) {
        merchantMap.set(point.merchant_id, {
          merchant_id: point.merchant_id,
          merchant_name: m.name,
          threshold: m.reward_threshold,
          reward_description: m.reward_description,
          last_scan: point.created_at,
          history: [],
        })
      }
      merchantMap.get(point.merchant_id)!.history.push({ id: point.id, date: point.created_at })
    }

    // Count redemptions per merchant
    const rewardCount = new Map<string, number>()
    for (const r of (rewards ?? [])) {
      rewardCount.set(r.merchant_id, (rewardCount.get(r.merchant_id) ?? 0) + 1)
    }

    const result = Array.from(merchantMap.values()).map(m => ({
      ...m,
      points: m.history.length - (rewardCount.get(m.merchant_id) ?? 0) * m.threshold,
    }))

    return NextResponse.json({ merchants: result })
  } catch (error) {
    console.error('History error:', error)
    return NextResponse.json({ merchants: [] })
  }
}
