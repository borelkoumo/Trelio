import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const anonId = searchParams.get('anon_id')
  const merchantId = searchParams.get('merchant_id')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    const { error, data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && session?.user && anonId) {
      // User successfully logged in, now link points from anonId to user.id
      const adminSupabase = await import('@/lib/supabase/server').then(m => m.createAdminClient())
      const adminClient = await adminSupabase

      // Update points
      await adminClient
        .from('points')
        .update({ user_id: session.user.id })
        .eq('user_id', anonId)

      // Update rewards
      await adminClient
        .from('rewards')
        .update({ user_id: session.user.id })
        .eq('user_id', anonId)

      // Add +1 bonus point if merchant_id is provided
      if (merchantId) {
        await adminClient
          .from('points')
          .insert({
            user_id: session.user.id,
            merchant_id: merchantId,
          })
      }
    }
  }

  return NextResponse.redirect(new URL(next, request.url))
}
