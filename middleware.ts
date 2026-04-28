import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that REQUIRE an authenticated user
const PROTECTED_ROUTES = ['/dashboard', '/admin', '/sell', '/profile']

// Routes that DON'T need a Supabase network call at all
// (public pages - skip getUser() to avoid fetch spam)
const ALWAYS_PUBLIC_ROUTES = [
    '/auth/callback',
    '/login',
    '/register',
    '/forgot-password',
]

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 0. Skip entirely for auth callback
    if (pathname.startsWith('/auth/callback')) {
        return NextResponse.next()
    }

    // 1. Determine if this route needs auth checking
    const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r))
    const isLoginPage = pathname.startsWith('/login')

    // If it's neither protected nor the login page, skip Supabase call entirely
    // This stops the fetch-failed spam for every public page visit
    if (!isProtectedRoute && !isLoginPage) {
        return NextResponse.next()
    }

    // 2. Setup Response
    let response = NextResponse.next({
        request: { headers: request.headers },
    })

    // 3. Clear known bad cookies
    const hasBadCookie = request.cookies.getAll().some(
        c => c.name.includes('nbf_v5_final') && c.value === 'undefined'
    )
    if (hasBadCookie) {
        request.cookies.getAll().forEach(c => {
            if (c.name.includes('nbf_v5_final')) {
                request.cookies.delete(c.name)
                response.cookies.delete(c.name)
            }
        })
    }

    // 4. Create Supabase Client (only for protected/login routes)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookieOptions: {
                name: 'nbf_v5_final',
                domain: process.env.NODE_ENV === 'production' ? '.nbfhomes.in' : undefined,
                path: '/',
                sameSite: 'lax',
                secure: request.nextUrl.protocol === 'https:',
            },
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set({ name, value, ...options })
                    })
                    response = NextResponse.next({
                        request: { headers: request.headers },
                    })
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, {
                            ...options,
                            domain: process.env.NODE_ENV === 'production' ? '.nbfhomes.in' : undefined,
                            path: '/',
                            secure: request.nextUrl.protocol === 'https:',
                            sameSite: 'lax' as const,
                        })
                    })
                },
            },
        }
    )

    // 5. Check Session
    let user = null
    try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()
        if (error) throw error
        user = supabaseUser
    } catch (error: any) {
        const isRefreshError =
            error?.code === 'refresh_token_not_found' ||
            error?.code === 'refresh_token_already_used' ||
            error?.message?.includes('Already Used') ||
            error?.message?.includes('Refresh Token Not Found')

        const isSessionMissing =
            error?.message === 'Auth session missing!' ||
            error?.message?.includes('Auth session missing')

        const isFetchError =
            error?.message === 'fetch failed' ||
            error?.name === 'AuthRetryableFetchError'

        if (!isSessionMissing && !isFetchError) {
            if (error?.code === 'UND_ERR_CONNECT_TIMEOUT') {
                console.warn('Proxy Auth: Supabase Connection Timed Out')
            } else if (isRefreshError) {
                console.log('Session Expired - Resetting')
            } else if (error?.status === 429 || error?.code === 'over_request_rate_limit') {
                console.warn('Proxy Auth: Rate limit reached. Backing off.')
            } else {
                console.error(`Proxy Auth Error: ${error?.message || 'Unknown'}`)
            }
        }

        // Wipe cookies only if refresh token is explicitly invalid
        if (isRefreshError) {
            request.cookies.getAll().forEach(({ name }) => {
                if (name.startsWith('sb-') || name.includes('auth') || name.includes('nbf_v5_final')) {
                    response.cookies.set(name, '', { maxAge: 0, domain: '.nbfhomes.in' })
                }
            })
            await supabase.auth.signOut()
        }

        user = null

        if (isRefreshError && pathname !== '/') {
            return NextResponse.redirect(new URL('/', request.url))
        }

        // If fetch failed (network issue), don't block the user — just pass through
        if (isFetchError) {
            return response
        }
    }

    // 6. Redirect Logic
    if (!user && isProtectedRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        // Run on all routes except static files
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
