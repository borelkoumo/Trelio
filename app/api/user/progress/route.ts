import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchant_id')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const fideloAnonId = cookieStore.get('fidelo_anon_id')?.value

    const supabase = await createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || fideloAnonId

    if (!userId) {
      return NextResponse.json({ error: 'User identification missing' }, { status: 401 })
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('reward_threshold, reward_description')
      .eq('id', merchantId)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const { data: points, error: pointsError } = await supabase
      .from('points')
      .select('id, created_at')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })

    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('id, redeemed_at')
      .eq('user_id', userId)
      .eq('merchant_id', merchantId)
      .order('redeemed_at', { ascending: false })

    const pointsCount = points?.length || 0
    const rewardsCount = rewards?.length || 0

    const effectivePoints = pointsCount - (rewardsCount * merchant.reward_threshold)

    return NextResponse.json({
      points: effectivePoints,
      threshold: merchant.reward_threshold,
      rewardDescription: merchant.reward_description,
      history: points?.map(p => ({ id: p.id, date: p.created_at })) || [],
      rewardUnlocked: effectivePoints >= merchant.reward_threshold,
    })
  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
