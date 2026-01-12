-- ==============================================================================
-- STORAGE SETUP SCRIPT FOR NBF HOMES
-- ==============================================================================
-- Run this in Supabase SQL Editor to enable Image Uploads.

-- 1. Create the 'properties' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('properties', 'properties', true)
ON CONFLICT (id) DO NOTHING;

-- 2. ENABLE RLS on Objects (It's usually on by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. POLICIES

-- Policy A: Public Read (View Images)
-- Everyone can view images in the 'properties' bucket
DROP POLICY IF EXISTS "Public Select" ON storage.objects;
CREATE POLICY "Public Select"
ON storage.objects FOR SELECT
USING ( bucket_id = 'properties' );

-- Policy B: Authenticated Upload
-- Any logged-in user (including Admins) can upload images
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'properties' );

-- Policy C: Owner/Admin Update
-- Users can update their own files, Admins can update any
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'properties' AND (auth.uid() = owner OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())) );

-- Policy D: Owner/Admin Delete
-- Users can delete their own files, Admins can delete any
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'properties' AND (auth.uid() = owner OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())) );

-- Verification
SELECT * FROM storage.buckets WHERE id = 'properties';
