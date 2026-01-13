-- FIX MISSING COLUMN: profession
-- Run this in Supabase SQL Editor to resolve the "column users.profession does not exist" error.

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS contact_number text; -- Assuming this might also be missing if onboarding fails

-- Allow users to update their own profession
CREATE POLICY "Users can update own profession" ON public.users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant access to public (if needed for profile views) or just keep standard policies
