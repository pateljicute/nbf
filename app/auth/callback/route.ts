import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, {
                                    ...options,
                                    sameSite: 'lax',
                                    secure: process.env.NODE_ENV === 'production',
                                    path: '/',
                                    ...(process.env.NODE_ENV === 'production' ? { partitioned: true } : {}), // FIXED: Partitioned requires Secure (HTTPS)
                                })
                            )
                        } catch {
                            // Ignored
                        }
                    },
                },
            }
        )
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'

            // Clean URL construction
            let cleanNext = next;
            if (cleanNext.includes('code=')) {
                cleanNext = '/';
            }

            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${cleanNext}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${cleanNext}`)
            } else {
                return NextResponse.redirect(`${origin}${cleanNext}`)
            }
        }
    }

    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
