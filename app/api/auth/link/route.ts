import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { cookies } from 'next/headers'

const linkSchema = z.object({
  email: z.string().email(),
  merchant_id: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, merchant_id } = linkSchema.parse(body)

    const cookieStore = await cookies()
    const fideloAnonId = cookieStore.get('fidelo_anon_id')?.value

    const supabase = await createAdminClient()

    // Send magic link
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.APP_URL}/auth/callback?anon_id=${fideloAnonId}&merchant_id=${merchant_id || ''}`,
      },
    })

    if (error) {
      console.error('Magic link error:', error)
      return NextResponse.json({ error: 'Failed to send magic link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Auth link error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
