-- Create a secure RPC function to fetch owner name by ID
-- This function runs with SECURITY DEFINER privileges (admin)
-- allowing it to bypass RLS and fetch the name for the product page.

CREATE OR REPLACE FUNCTION get_owner_name(owner_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  u_name text;
BEGIN
  SELECT 
    COALESCE(full_name, split_part(email, '@', 1)) INTO u_name
  FROM public.users
  WHERE id = owner_id;
  
  RETURN u_name;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_owner_name(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_owner_name(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_owner_name(uuid) TO service_role;
