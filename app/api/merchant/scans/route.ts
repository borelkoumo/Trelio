import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const date = searchParams.get('date')
    const search = searchParams.get('search')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const adminSupabase = await createAdminClient()
    let matchedUserIds: string[] | null = null

    if (search) {
      if (search.includes('@')) {
        const { data: usersData } = await adminSupabase.auth.admin.listUsers()
        const matchedUsers = usersData?.users.filter(u => u.email?.toLowerCase().includes(search.toLowerCase())) || []
        matchedUserIds = matchedUsers.map(u => u.id)
        if (matchedUserIds.length === 0) {
          matchedUserIds = ['none'] // force empty result
        }
      }
    }

    let query = supabase
      .from('points')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setUTCHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setUTCHours(23, 59, 59, 999)
      query = query.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString())
    }

    if (search) {
      if (matchedUserIds) {
        query = query.in('user_id', matchedUserIds)
      } else {
        query = query.ilike('user_id', `%${search}%`)
      }
    }

    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: points, count, error: pointsError } = await query.range(from, to)

    if (pointsError) {
      console.error('Points error:', pointsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Map emails to the final points
    let userMap: Record<string, string> = {}
    if (points && points.length > 0) {
      const { data: allUsers } = await adminSupabase.auth.admin.listUsers()
      if (allUsers?.users) {
        allUsers.users.forEach(u => {
          if (u.email) {
            userMap[u.id] = u.email
          }
        })
      }
    }

    const enrichedPoints = points?.map(p => ({
      ...p,
      email: userMap[p.user_id] || null,
      is_anonymous: !userMap[p.user_id]
    }))

    // Calculate detailed stats for the filtered result
    let statsQuery = supabase
      .from('points')
      .select('user_id')
      .eq('merchant_id', merchant.id)

    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setUTCHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setUTCHours(23, 59, 59, 999)
      statsQuery = statsQuery.gte('created_at', startOfDay.toISOString()).lte('created_at', endOfDay.toISOString())
    }

    if (search) {
      if (matchedUserIds) {
        statsQuery = statsQuery.in('user_id', matchedUserIds)
      } else {
        statsQuery = statsQuery.ilike('user_id', `%${search}%`)
      }
    }

    const { data: statsData } = await statsQuery
    const uniqueUsers = new Set(statsData?.map(p => p.user_id)).size

    return NextResponse.json({
      scans: enrichedPoints || [],
      total: count || 0,
      page,
      limit,
      stats: {
        totalScans: statsData?.length || 0,
        uniqueUsers: uniqueUsers || 0
      }
    })
  } catch (error) {
    console.error('Scans fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
