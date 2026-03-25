import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, code, name, secret_key, reward_threshold, reward_description, validation_mode')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Run all three stat queries in parallel
    const [
      { count: totalScans },
      { data: uniqueUsersCount },
      { count: totalRewards },
    ] = await Promise.all([
      supabase
        .from('points')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id),
      supabase.rpc('count_distinct_users', { p_merchant_id: merchant.id }),
      supabase
        .from('rewards')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id),
    ])

    return NextResponse.json(
      {
        merchant,
        stats: {
          totalScans: totalScans || 0,
          uniqueUsers: (uniqueUsersCount as number) || 0,
          totalRewards: totalRewards || 0,
        },
      },
      { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } },
    )
  } catch (error) {
    console.error('Merchant stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
