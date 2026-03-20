import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const configSchema = z.object({
  name: z.string().min(1).optional(),
  reward_threshold: z.number().min(1).optional(),
  reward_description: z.string().min(1).optional(),
  validation_mode: z.enum(['automatic', 'manual']).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates = configSchema.parse(body)

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Failed to update merchant config' }, { status: 500 })
    }

    return NextResponse.json({ success: true, merchant })
  } catch (error) {
    console.error('Merchant config error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
