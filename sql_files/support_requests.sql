-- Create support_requests table for banned user appeals
CREATE TABLE IF NOT EXISTS public.support_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid, -- Optional: Link to user if available
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone_number text,
    subject text DEFAULT 'Support Appeal',
    message text NOT NULL,
    status text DEFAULT 'open', -- open, reviewed, resolved
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.support_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create a request
DROP POLICY IF EXISTS "Allow authenticated users to insert support requests" ON public.support_requests;
CREATE POLICY "Allow authenticated users to insert support requests" 
ON public.support_requests FOR INSERT 
WITH CHECK (true);

-- Allow admins to view all
DROP POLICY IF EXISTS "Allow admins to view all support requests" ON public.support_requests;
CREATE POLICY "Allow admins to view all support requests"
ON public.support_requests FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
    )
);
