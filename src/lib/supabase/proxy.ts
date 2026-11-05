import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv, hasSupabaseEnv } from './env'

const PUBLIC_PATHS = ['/', '/login', '/auth', '/error', '/api']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (publicPath) =>
      pathname === publicPath ||
      (publicPath !== '/' && pathname.startsWith(`${publicPath}/`))
  )
}

function copySupabaseCookiesAndHeaders(
  source: NextResponse,
  target: NextResponse
): NextResponse {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })
  for (const header of ['cache-control', 'expires', 'pragma']) {
    const value = source.headers.get(header)
    if (value) {
      target.headers.set(header, value)
    }
  }
  return target
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!hasSupabaseEnv()) {
    if (!isPublicPath(request.nextUrl.pathname)) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  const { url, key } = getSupabaseEnv()

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
        Object.entries(headers).forEach(([headerName, headerValue]) =>
          supabaseResponse.headers.set(headerName, headerValue)
        )
      },
    },
  })

  // IMPORTANT: Always use `getClaims()` in server-side proxy code to validate
  // the JWT signature and refresh expired tokens. Never rely on `getSession()`
  // for authorization decisions on the server.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  const { pathname } = request.nextUrl

  if (!claims && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('next', pathname)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    return copySupabaseCookiesAndHeaders(supabaseResponse, redirectResponse)
  }

  if (claims && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/protected'
    redirectUrl.search = ''
    const redirectResponse = NextResponse.redirect(redirectUrl)
    return copySupabaseCookiesAndHeaders(supabaseResponse, redirectResponse)
  }

  return supabaseResponse
}

