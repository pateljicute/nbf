import { NextRequest, NextResponse } from 'next/server';
import {
    verifyAuth,
    generateCSRFToken
} from '@/lib/backend-utils';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyAuth(request.headers);
        const token = generateCSRFToken(user.id);
        return NextResponse.json({ csrfToken: token });
    } catch (error: any) {
        console.error('Error in GET /csrf-token:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
