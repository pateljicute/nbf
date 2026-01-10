-- SQL Upgrade: Auto-generate Handles (Slugs) for Properties
-- This fixes the "null value in column handle" error.

-- 1. Create a Slugify Function
CREATE OR REPLACE FUNCTION public.slugify(value TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Lowercase, remove special chars, replace spaces with -
  RETURN lower(regexp_replace(regexp_replace(value, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- 2. Create a Trigger Function
CREATE OR REPLACE FUNCTION public.set_handle_if_null()
RETURNS TRIGGER AS $$
DECLARE
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  -- Only run if handle is missing
  IF NEW.handle IS NULL OR NEW.handle = '' THEN
    base_handle := public.slugify(NEW.title);
    
    -- Fallback if title is empty or weird
    IF base_handle IS NULL OR base_handle = '' THEN
        base_handle := 'property-' || floor(random() * 10000)::text;
    END IF;

    new_handle := base_handle;
    
    -- Ensure Uniqueness: Append -1, -2, etc. if it exists
    WHILE EXISTS (SELECT 1 FROM public.properties WHERE handle = new_handle) LOOP
      counter := counter + 1;
      new_handle := base_handle || '-' || counter;
    END LOOP;
    
    NEW.handle := new_handle;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach Trigger to Properties Table
DROP TRIGGER IF EXISTS ensure_property_handle ON public.properties;
CREATE TRIGGER ensure_property_handle
BEFORE INSERT ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_handle_if_null();
