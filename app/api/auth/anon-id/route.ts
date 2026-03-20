import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Returns the anonymous tracking ID so the client can embed it in OAuth
// redirect URLs. The cookie is httpOnly and cannot be read from JS directly.
export async function GET() {
  const cookieStore = await cookies()
  const anonId = cookieStore.get('fidelo_anon_id')?.value ?? null
  return NextResponse.json({ anonId })
}
