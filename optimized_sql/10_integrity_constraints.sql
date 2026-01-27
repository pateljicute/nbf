-- 10_integrity_constraints.sql
-- PURPOSE: Enforce stronger data integrity and clean up potential orphans.
-- ORDER: 10/12

-- 1. Enforce Foreign Keys (if not already set in creation)
-- This is a safety step to ensure strict mode.

-- Properties -> Users
-- ALTER TABLE public.properties 
-- DROP CONSTRAINT IF EXISTS properties_user_id_fkey,
-- ADD CONSTRAINT properties_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Ads -> No FK needed usually

-- Leads -> Properties
-- Ensure leads are deleted if property is deleted (Clean Orphan Data)
-- This was defined in table creation, but enabling constraint explicitly here:
-- ALTER TABLE public.leads_activity
-- DROP CONSTRAINT IF EXISTS leads_activity_property_id_fkey,
-- ADD CONSTRAINT leads_activity_property_id_fkey
-- FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- 2. Clean Orphan Data (Cleanup Phase)
-- Delete leads pointing to non-existent properties
DELETE FROM public.leads_activity 
WHERE property_id IS NOT NULL 
AND property_id NOT IN (SELECT id FROM public.properties);

-- Delete properties pointing to non-existent users
DELETE FROM public.properties 
WHERE user_id IS NOT NULL 
AND user_id NOT IN (SELECT id FROM public.users);

-- 3. Validation
-- Verify no orphans exist (should return 0)
DO $$
DECLARE
    orphan_leads_count INT;
BEGIN
    SELECT count(*) INTO orphan_leads_count 
    FROM public.leads_activity 
    WHERE property_id NOT IN (SELECT id FROM public.properties);
    
    IF orphan_leads_count > 0 THEN
        RAISE NOTICE 'Orphan leads found: %', orphan_leads_count;
    END IF;
END $$;
