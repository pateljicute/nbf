-- Add is_banned and ban_reason columns to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- Create a policy to allow admins to update these columns (if RLS is enabled and needed)
-- Assuming we stick to service role for admin actions in Server Actions, this might be optional but good practice.
-- Ensuring RLS policies allow reading these columns by the user themselves (to know they are banned) 
-- and admins.

-- Example: Allow users to read their own ban status
CREATE POLICY "Users can read own ban status" ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Function to ban a user (can be called via RPC if preferred, or direct update)
-- Just direct update via Supabase Client is fine for now.
