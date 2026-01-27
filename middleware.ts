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
                        })
                    );
                },
            },
        }
    );

    // refreshing the auth token
    const { data: { user } } = await supabase.auth.getUser();

    // Define protected routes
    const protectedPaths = ['/admin', '/account', '/banned'];
    const path = request.nextUrl.pathname;
    const isProtected = protectedPaths.some(p => path.startsWith(p));

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
