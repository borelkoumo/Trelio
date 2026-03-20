import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
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

    // Get stats
    const { count: totalScans } = await supabase
      .from('points')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)

    const { data: uniqueUsersData } = await supabase
      .from('points')
      .select('user_id')
      .eq('merchant_id', merchant.id)

    const uniqueUsers = new Set(uniqueUsersData?.map(p => p.user_id)).size

    const { count: totalRewards } = await supabase
      .from('rewards')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)

    return NextResponse.json({
      merchant,
      stats: {
        totalScans: totalScans || 0,
        uniqueUsers,
        totalRewards: totalRewards || 0,
      },
    })
  } catch (error) {
    console.error('Merchant stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
