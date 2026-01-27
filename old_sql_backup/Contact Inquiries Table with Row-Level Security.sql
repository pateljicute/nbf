-- Create Inquiries Table
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'unread' -- 'unread', 'read', 'replied'
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public contact form)
CREATE POLICY "Enable insert for everyone" ON public.inquiries
    FOR INSERT WITH CHECK (true);

-- Policy: Only Admins can view (using admin_users table for verification usually, or service role)
-- Assuming admin_users logic or just utilizing the server-side admin check in actions.
-- For direct client-side select (if used), we need a policy.
-- Reusing the logic often found: authenticated admins or specific users.
-- For simplicity and relying on our 'checkAdminStatus' server action pattern:
-- We might not need a complex SELECT policy if we only fetch via Server Actions/Service Role.
-- But if we fetch from Client using Supabase Client, user needs permission.
-- Let's allow read for specific users if 'admin_users' is the pattern, otherwise keep it restrictive 
-- and use Service Role (which the API functions might use if configured, but `lib/api` uses public usually).

-- Let's create a policy that checks against admin_users table if it exists
CREATE POLICY "Admins can view inquiries" ON public.inquiries
    FOR SELECT
    USING (
        auth.uid() IN (SELECT user_id FROM public.admin_users)
        OR 
        auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
    );

-- Grant access
GRANT ALL ON public.inquiries TO postgres;
GRANT ALL ON public.inquiries TO anon;
GRANT ALL ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
