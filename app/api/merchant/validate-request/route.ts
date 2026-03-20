import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const validateSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requestId, action } = validateSchema.parse(body)

    // Verify merchant owns this request
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const { data: validationRequest, error: reqError } = await supabase
      .from('validation_requests')
      .select('*')
      .eq('id', requestId)
      .eq('merchant_id', merchant.id)
      .eq('status', 'pending')
      .single()

    if (reqError || !validationRequest) {
      return NextResponse.json({ error: 'Request not found or already processed' }, { status: 404 })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    // Update request status
    const { error: updateError } = await supabase
      .from('validation_requests')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (updateError) {
      throw updateError
    }

    // If approved, add a point
    if (action === 'approve') {
      const { error: pointError } = await supabase
        .from('points')
        .insert({
          user_id: validationRequest.user_id,
          merchant_id: merchant.id,
        })

      if (pointError) {
        throw pointError
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Validation request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
