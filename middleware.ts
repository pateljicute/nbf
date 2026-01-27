import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    // PWA & Auth Callback Optimization: Bypass heavy checks for instant login
    if (request.nextUrl.pathname.startsWith('/auth/callback')) {
        return NextResponse.next();
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, {
                            ...options,
                            sameSite: 'lax',
                            secure: process.env.NODE_ENV === 'production',
                        })
                    );
                },
            },
        }
    );

    // OPTIMIZATION: Check for Supabase session cookie before querying Auth server
    // This bypassed the "1155ms" delay for Guests (Non-logged in users)
    const allCookies = request.cookies.getAll();
    const hasSupabaseCookie = allCookies.some(c => c.name.includes('sb-') && c.name.includes('-auth-token'));

    let user = null;

    // Only call getUser() if we suspect a session exists OR if we are on a protected route (safety net)
    // For protected routes, we MUST check to ensure security.
    const protectedPaths = ['/admin', '/account', '/banned', '/post-property'];
    const path = request.nextUrl.pathname;
    const isProtected = protectedPaths.some(p => path.startsWith(p));

    if (hasSupabaseCookie || isProtected) {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    }

    if (user) {
        // Protect Routes from Banned Users
        if (!path.startsWith('/banned')) {
            const { data: userData } = await supabase
                .from('users')
                .select('is_banned')
                .eq('id', user.id)
                .single();

            if (userData?.is_banned) {
                const url = request.nextUrl.clone();
                url.pathname = '/banned';
                return NextResponse.redirect(url);
            }
        }
    } else if (isProtected) {
        // Redirect unauthenticated users trying to access protected routes
        const url = request.nextUrl.clone();
        url.pathname = '/auth'; // Redirect to login
        url.searchParams.set('next', path); // Preserve the intended destination
        return NextResponse.redirect(url);
    }

    // If accessing /banned but not banned (or not logged in), maybe redirect? 
    // Leaving purely as is for now to avoid over-engineering.

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
