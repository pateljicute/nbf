import { NextRequest, NextResponse } from 'next/server';
import {
    verifyAuth,
    generateCSRFToken
} from '@/lib/backend-utils';

export async function GET(request: NextRequest) {
    try {
        // CSRF should be available for everyone, authenticated or not
        // For unauthenticated users, we can use a session ID or anonymous identifier if needed
        // For now, we will just generate a token. In a real app, you might want to bind this to a session cookie.
        
        let userId = 'anonymous';
        try {
             const user = await verifyAuth(request.headers);
             userId = user.id;
        } catch (e) {
            // User not authenticated, proceed as anonymous
        }

        const token = generateCSRFToken(userId);
        return NextResponse.json({ csrfToken: token });
    } catch (error: any) {
        console.error('Error in GET /csrf-token:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
