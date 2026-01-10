-- Force Approve All Properties
-- This will make ALL current properties visible on the website immediately.

UPDATE public.properties
SET 
  status = 'approved',
  available_for_sale = true,
  is_verified = true
WHERE status IN ('pending', 'inactive', 'rejected');

-- Also ensure the admin user owns them (Optional fix if IDs got messed up)
-- Replace '32e9c839-f67c-40f6-9291-723fb5da15cd' with your actual User ID if needed.
-- UPDATE public.properties SET user_id = '32e9c839-f67c-40f6-9291-723fb5da15cd' WHERE user_id IS NULL;
