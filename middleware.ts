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
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // 1. Get User
    // 1. Get User with Error Handling
    let user = null;
    try {
        const { data } = await supabase.auth.getUser();
        user = data.user;
    } catch (err) {
        // Log error but allow request to proceed (treat as unauthenticated)
        // This prevents the entire site from going down if Supabase Auth is slow/unreachable
        console.error("Middleware Auth Check Failed:", err);
    }

    // 2. Protect Routes from Banned Users
    if (user) {
        // Optimization: Only check DB if on a protected route or periodically.
        // However, user requested "Strict" enforcement.

        // Check if path is NOT already the banned page to avoid infinite loop
        if (!request.nextUrl.pathname.startsWith('/banned')) {

            // Fetch ban status from public.users
            // Optimization: Select ONLY is_banned column.
            const { data: userData } = await supabase
                .from('users')
                .select('is_banned')
                .eq('id', user.id)
                .single();

            if (userData?.is_banned) {
                // Force Sign Out logic can be tricky in middleware, better to redirect to a "Banned" page
                // which can handle the signout or just show the message.
                const url = request.nextUrl.clone();
                url.pathname = '/banned';
                return NextResponse.redirect(url);
            }
        }
    }

    // 3. Admin Route Protection (Optional but recommended)
    if (request.nextUrl.pathname.startsWith('/admin')) {
        if (!user) {
            return NextResponse.redirect(new URL('/auth', request.url));
        }
        // Note: We leave strict admin check to the page/layout to avoid double DB hit if possible,
        // but if we already fetched user, we are good.
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
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
