-- 1. Ensure Columns Exist
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS leads_count numeric DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS view_count numeric DEFAULT 0;

-- 2. Fix NULL values (CRITICAL: NULL + 1 = NULL, so we must set to 0)
UPDATE public.properties SET leads_count = 0 WHERE leads_count IS NULL;
UPDATE public.properties SET view_count = 0 WHERE view_count IS NULL;

-- 3. Create/Replace RPC Functions
CREATE OR REPLACE FUNCTION increment_view_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure we don't hit NULLs even inside the function
  UPDATE public.properties
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = row_id;
END;
$$;

CREATE OR REPLACE FUNCTION increment_leads_count(row_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET leads_count = COALESCE(leads_count, 0) + 1
  WHERE id = row_id;
END;
$$;
