import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function applyDeviceFilter(q: any, device: string): any {
  switch (device) {
    case 'desktop':
      return q.or('device_type.ilike.%windows%,device_type.ilike.%mac%,device_type.ilike.%linux%,device_type.ilike.%desktop%,device_type.ilike.%chrome os%')
    case 'mobile':
      return q.or('device_type.ilike.%android%,device_type.ilike.%iphone%,device_type.ilike.%mobile%')
    case 'tablet':
      return q.or('device_type.ilike.%ipad%,device_type.ilike.%tablet%')
    default:
      return q
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page     = parseInt(searchParams.get('page')  || '1')
    const limit    = parseInt(searchParams.get('limit') || '20')
    const search   = searchParams.get('search')   || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo   = searchParams.get('dateTo')   || ''
    const device   = searchParams.get('device')   || ''
    const userType = searchParams.get('userType') || ''

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants').select('id').eq('user_id', user.id).single()
    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // ── Build paginated data query ──────────────────────────────────────────
    // user_email is now stored directly in the points row (no admin.listUsers needed)
    let query: any = supabase
      .from('points')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })

    if (dateFrom) {
      const s = new Date(dateFrom); s.setUTCHours(0, 0, 0, 0)
      query = query.gte('created_at', s.toISOString())
    }
    if (dateTo) {
      const e = new Date(dateTo); e.setUTCHours(23, 59, 59, 999)
      query = query.lte('created_at', e.toISOString())
    }
    if (search) {
      if (search.includes('@')) {
        query = query.ilike('user_email', `%${search}%`)
      } else {
        query = query.ilike('user_id', `%${search}%`)
      }
    }
    query = applyDeviceFilter(query, device)
    if (userType === 'registered') {
      query = query.not('user_email', 'is', null)
    } else if (userType === 'anonymous') {
      query = query.is('user_email', null)
    }

    const from = (page - 1) * limit
    const { data: points, count, error: pointsError } = await query.range(from, from + limit - 1)

    if (pointsError) {
      console.error('Points error:', pointsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const enrichedPoints = (points ?? []).map((p: any) => ({
      ...p,
      email: p.user_email || null,
      is_anonymous: !p.user_email,
    }))

    // ── Stats query (same filters, COUNT DISTINCT for unique users) ─────────
    let statsQuery: any = supabase
      .from('points')
      .select('user_id')
      .eq('merchant_id', merchant.id)

    if (dateFrom) {
      const s = new Date(dateFrom); s.setUTCHours(0, 0, 0, 0)
      statsQuery = statsQuery.gte('created_at', s.toISOString())
    }
    if (dateTo) {
      const e = new Date(dateTo); e.setUTCHours(23, 59, 59, 999)
      statsQuery = statsQuery.lte('created_at', e.toISOString())
    }
    if (search) {
      if (search.includes('@')) {
        statsQuery = statsQuery.ilike('user_email', `%${search}%`)
      } else {
        statsQuery = statsQuery.ilike('user_id', `%${search}%`)
      }
    }
    statsQuery = applyDeviceFilter(statsQuery, device)
    if (userType === 'registered') {
      statsQuery = statsQuery.not('user_email', 'is', null)
    } else if (userType === 'anonymous') {
      statsQuery = statsQuery.is('user_email', null)
    }

    const { data: statsData } = await statsQuery
    const uniqueUsers = new Set((statsData ?? []).map((p: any) => p.user_id)).size

    const hasFilters = !!(search || dateFrom || dateTo || device || userType)
    const cacheHeader = hasFilters
      ? 'no-store'
      : 'private, max-age=15, stale-while-revalidate=30'

    return NextResponse.json(
      {
        scans: enrichedPoints,
        total: count || 0,
        page,
        limit,
        stats: { totalScans: statsData?.length || 0, uniqueUsers },
      },
      { headers: { 'Cache-Control': cacheHeader } },
    )
  } catch (error) {
    console.error('Scans fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
