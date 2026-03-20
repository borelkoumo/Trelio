import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  // Stale / invalid refresh token — clear the dead cookies and redirect to
  // login if the user was trying to access a protected route.
  if (authError?.code === 'refresh_token_not_found' || authError?.status === 400) {
    const stale = request.cookies.getAll().filter(c => c.name.startsWith('sb-'))
    const isProtected =
      request.nextUrl.pathname.startsWith('/merchant') &&
      !request.nextUrl.pathname.startsWith('/merchant/login')

    const response = isProtected
      ? NextResponse.redirect(new URL('/merchant/login', request.url))
      : NextResponse.next({ request })

    stale.forEach(c => response.cookies.delete(c.name))
    return response
  }

  // Ensure anonymous tracking cookie exists
  let fideloAnonId = request.cookies.get('fidelo_anon_id')?.value
  if (!fideloAnonId && !user) {
    fideloAnonId = uuidv4()
    supabaseResponse.cookies.set('fidelo_anon_id', fideloAnonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      path: '/',
    })
  }

  // Protect merchant routes
  if (request.nextUrl.pathname.startsWith('/merchant') && !request.nextUrl.pathname.startsWith('/merchant/login')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/merchant/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
