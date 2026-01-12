import { toast } from 'sonner';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'https://nbf-x-39dd7c53.vercel.app/api');

class ApiError extends Error {
    status: number;
    constructor(message: string, status: number) {
        super(message);
        this.status = status;
        this.name = 'ApiError';
    }
}

interface FetchOptions extends RequestInit {
    params?: Record<string, string>;
    token?: string;
    silent?: boolean; // If true, suppress global error toast
}

export const apiClient = {
    async get<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    },

    async post<T>(endpoint: string, data: any, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    },

    async put<T>(endpoint: string, data: any, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(endpoint, {
            ...options,
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    },

    async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    },

    async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { params, token, silent, ...init } = options;

        let url = `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
        if (params) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    searchParams.append(key, value);
                }
            });
            url += `?${searchParams.toString()}`;
        }

        const headers: HeadersInit = {
            ...init.headers,
        };

        if (token) {
            // @ts-ignore
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, { ...init, headers });

            if (!response.ok) {
                // Try to parse error message from JSON, fallback to status text
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || errorMessage;
                } catch {
                    // Response was not JSON
                }
                throw new ApiError(errorMessage, response.status);
            }

            // Check if response has content before parsing JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            }

            // If not JSON, return empty object or text (casted to T)
            return {} as T;

        } catch (error) {
            if (!silent) {
                // Log the error but don't prevent the UI from handling it if needed
                console.error(`API Request Failed: ${endpoint}`, error);
            }
            throw error;
        }
    }
};
