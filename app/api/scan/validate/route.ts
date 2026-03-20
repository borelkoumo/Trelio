import { NextResponse } from 'next/server'
import { validateQRData } from '@/lib/qr'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const validateSchema = z.object({
  data: z.string(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { data } = validateSchema.parse(body)

    // We need the merchant's secret key to validate the QR code.
    // However, the QR code contains the merchant_id.
    // We can extract the merchant_id first without validating, then fetch the secret key, then validate.
    
    let merchantId: string | undefined
    try {
      const jsonString = Buffer.from(data, 'base64').toString('utf-8')
      const payload = JSON.parse(jsonString)
      merchantId = payload.merchant_id
    } catch (e) {
      return NextResponse.json({ valid: false, error: 'Invalid QR format' }, { status: 400 })
    }

    if (!merchantId) {
      return NextResponse.json({ valid: false, error: 'Missing merchant ID' }, { status: 400 })
    }

    const supabase = await createAdminClient()
    const { data: merchant, error } = await supabase
      .from('merchants')
      .select('id, name, secret_key, reward_threshold, reward_description')
      .eq('id', merchantId)
      .single()

    if (error || !merchant) {
      return NextResponse.json({ valid: false, error: 'Merchant not found' }, { status: 404 })
    }

    const validation = validateQRData(data, merchant.secret_key)

    if (!validation.valid) {
      return NextResponse.json({ valid: false, error: validation.error }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        reward_threshold: merchant.reward_threshold,
        reward_description: merchant.reward_description,
      },
    })
  } catch (error) {
    console.error('Validation error:', error)
    return NextResponse.json({ valid: false, error: 'Internal server error' }, { status: 500 })
  }
}
