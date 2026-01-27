-- 11_automation_triggers.sql
-- PURPOSE: Automate business logic (slugs, counters).
-- ORDER: 11/12

-- 1. Handle Generator Trigger
-- Automatically generates a URL-friendly handle if one is not provided.
CREATE OR REPLACE FUNCTION public.set_handle_if_null() RETURNS TRIGGER AS $$
DECLARE
  base_handle TEXT;
  new_handle TEXT;
  counter INT := 0;
BEGIN
  IF NEW.handle IS NULL OR NEW.handle = '' THEN
    base_handle := public.slugify(NEW.title);
    IF base_handle IS NULL OR base_handle = '' THEN base_handle := 'property-' || floor(random() * 10000)::text; END IF;
    new_handle := base_handle;
    -- Check for collision and loop
    WHILE EXISTS (SELECT 1 FROM public.properties WHERE handle = new_handle) LOOP
      counter := counter + 1;
      new_handle := base_handle || '-' || counter;
    END LOOP;
    NEW.handle := new_handle;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_property_handle ON public.properties;
CREATE TRIGGER ensure_property_handle 
BEFORE INSERT ON public.properties 
FOR EACH ROW EXECUTE FUNCTION public.set_handle_if_null();

-- 2. Leads Counter Trigger
-- Denormalizes lead count to properties table for fast frontend sorting.
CREATE OR REPLACE FUNCTION increment_property_leads_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment leads_count on the parent property
  UPDATE public.properties
  SET leads_count = COALESCE(leads_count, 0) + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_lead_added ON public.leads_activity;
CREATE TRIGGER on_lead_added
AFTER INSERT ON public.leads_activity
FOR EACH ROW
EXECUTE FUNCTION increment_property_leads_count();
