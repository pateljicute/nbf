import { google } from 'googleapis';
import path from 'path';

// Load Service Account from Root Directory
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'service-account.json');

export async function notifyGoogleIndexing(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
    try {
        // Check if Credentials Exist (Basic File Check or ENV check could be added)
        // We assume the file is present as per instructions.

        // Auth Client
        const auth = new google.auth.GoogleAuth({
            keyFile: SERVICE_ACCOUNT_PATH,
            scopes: ['https://www.googleapis.com/auth/indexing'],
        });

        const indexing = google.indexing({
            version: 'v3',
            auth: auth,
        });

        console.log(`[GoogleIndexing] Sending ${type} for ${url}`);

        const res = await indexing.urlNotifications.publish({
            requestBody: {
                url: url,
                type: type,
            },
        });

        console.log(`[GoogleIndexing] Success: ${res.status} ${res.statusText}`);
        return { success: true, data: res.data };

    } catch (error: any) {
        console.error(`[GoogleIndexing] Failed:`, error.message);
        // Do not throw, finding is optional enhancement
        return { success: false, error: error.message };
    }
}
