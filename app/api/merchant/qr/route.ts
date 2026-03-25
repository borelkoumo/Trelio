import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQRData } from '@/lib/qr'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, secret_key')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const qrData = generateQRData(merchant.id, merchant.secret_key)

    return NextResponse.json(
      { qrData },
      { headers: { 'Cache-Control': 'private, max-age=55, stale-while-revalidate=10' } },
    )
  } catch (error) {
    console.error('QR generation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
