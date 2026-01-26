import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

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
                            path: '/',
                            ...(process.env.NODE_ENV === 'production' ? { partitioned: true } : {}), // FIXED: Partitioned requires Secure (HTTPS)
                        })
                    );
                },
            },
        }
    );

    // Verify auth status on ALL requests to ensure session tokens are refreshed
    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    } catch (err) {
        console.error("Middleware Auth Check Failed:", err);
    }

    // Define protected routes
    const protectedPaths = ['/admin', '/account', '/banned'];
    const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // Only run auth check on protected routes
    if (isProtected) {
        // Protect Routes from Banned Users
        if (user) {
            if (!request.nextUrl.pathname.startsWith('/banned')) {
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
        }

        // Admin Route Protection
        if (request.nextUrl.pathname.startsWith('/admin')) {
            if (!user) {
                return NextResponse.redirect(new URL('/auth', request.url));
            }
        }
    }

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
