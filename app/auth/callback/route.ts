import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const nextParam = searchParams.get('next') ?? '/';
    // Validate next is a relative path to prevent open redirect
    const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/';

    if (code) {
        const cookieStore = request.cookies;

        // We need a slightly different setup for the route handler to properly set cookies on the response
        // Let's use the recommended approach from Supabase docs for Next.js App Router

        const response = NextResponse.redirect(`${origin}${next}`);

        const supabaseResponse = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value;
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        });
                    },
                    remove(name: string, options: CookieOptions) {
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        });
                    },
                },
            }
        );

        const { error } = await supabaseResponse.auth.exchangeCodeForSession(code);
        if (!error) {
            return response;
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
