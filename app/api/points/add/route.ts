import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

const addPointSchema = z.object({
  merchant_id: z.string().uuid(),
  qr_data: z.string(),
  device_type: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { merchant_id, qr_data, device_type } = addPointSchema.parse(body)

    const cookieStore = await cookies()
    const fideloAnonId = cookieStore.get('fidelo_anon_id')?.value

    const supabase = await createAdminClient()

    // Use regular server client (reads session cookies) to identify the user
    const serverClient = await createClient()
    const { data: { user } } = await serverClient.auth.getUser()
    // Prefer fideloAnonId (anonymous customer); don't leak merchant email in demo mode
    const userId = fideloAnonId || user?.id
    const userEmail = fideloAnonId ? null : user?.email ?? null

    if (!userId) {
      return NextResponse.json({ error: 'User identification missing' }, { status: 401 })
    }

    // Fetch merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('secret_key, reward_threshold, validation_mode')
      .eq('id', merchant_id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Re-validate QR code
    const { validateQRData } = await import('@/lib/qr')
    const validation = validateQRData(qr_data, merchant.secret_key)
    if (!validation.valid || validation.merchantId !== merchant_id) {
      return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 400 })
    }

    // Check cooldown (e.g., 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const { data: recentPoints, error: pointsError } = await supabase
      .from('points')
      .select('id')
      .eq('user_id', userId)
      .eq('merchant_id', merchant_id)
      .gte('created_at', tenMinutesAgo)
      .limit(1)

    if (pointsError) {
      console.error('Points error:', pointsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (recentPoints && recentPoints.length > 0) {
      return NextResponse.json({ error: 'Cooldown active. Please wait before scanning again.' }, { status: 429 })
    }

    if (merchant.validation_mode === 'manual') {
      // Create a validation request
      const { data: requestData, error: requestError } = await supabase
        .from('validation_requests')
        .insert({
          user_id: userId,
          merchant_id: merchant_id,
          status: 'pending',
          device_type: device_type || null,
          user_email: userEmail,
        })
        .select()
        .single()

      if (requestError) {
        console.error('Validation request insert error:', requestError)
        return NextResponse.json({ error: 'Failed to request validation' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        status: 'pending_validation',
        requestId: requestData.id,
      })
    }

    // Add point (Automatic mode)
    const { error: insertError } = await supabase
      .from('points')
      .insert({
        user_id: userId,
        merchant_id: merchant_id,
        device_type: device_type || null,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to add point' }, { status: 500 })
    }

    // Check if reward threshold is reached
    const { count: totalPoints } = await supabase
      .from('points')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('merchant_id', merchant_id)

    const { count: totalRewards } = await supabase
      .from('rewards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('merchant_id', merchant_id)

    const pointsCount = totalPoints || 0
    const rewardsCount = totalRewards || 0

    // Calculate effective points towards next reward
    const effectivePoints = pointsCount - (rewardsCount * merchant.reward_threshold)
    
    let rewardUnlocked = false
    if (effectivePoints >= merchant.reward_threshold) {
      rewardUnlocked = true
    }

    return NextResponse.json({
      success: true,
      points: effectivePoints,
      threshold: merchant.reward_threshold,
      rewardUnlocked,
    })
  } catch (error) {
    console.error('Add point error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
