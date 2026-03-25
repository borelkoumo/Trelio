import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const fideloAnonId = cookieStore.get('fidelo_anon_id')?.value
  const serverClient = await createClient()
  const { data: { user } } = await serverClient.auth.getUser()
  const userId = fideloAnonId || user?.id || null
  return NextResponse.json({ userId })
}
