-- Migration to ensure ON DELETE CASCADE with Type Fixes

-- 1. property_views table
-- Fix Type Mismatch: Cast property_id to UUID if it's text
ALTER TABLE property_views
ALTER COLUMN property_id TYPE uuid USING property_id::uuid;

ALTER TABLE property_views
DROP CONSTRAINT IF EXISTS property_views_property_id_fkey;

ALTER TABLE property_views
ADD CONSTRAINT property_views_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE CASCADE;

-- 2. leads_activity table
-- Fix Type Mismatch
ALTER TABLE leads_activity
ALTER COLUMN property_id TYPE uuid USING property_id::uuid;

ALTER TABLE leads_activity
DROP CONSTRAINT IF EXISTS leads_activity_property_id_fkey;

ALTER TABLE leads_activity
ADD CONSTRAINT leads_activity_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE CASCADE;

-- 3. inquiries table
-- Fix Type Mismatch
ALTER TABLE inquiries
ALTER COLUMN property_id TYPE uuid USING property_id::uuid;

ALTER TABLE inquiries
DROP CONSTRAINT IF EXISTS inquiries_property_id_fkey;

ALTER TABLE inquiries
ADD CONSTRAINT inquiries_property_id_fkey
FOREIGN KEY (property_id)
REFERENCES properties(id)
ON DELETE CASCADE;

-- 4. favorites table (Conditional / Optional)
-- Attempting to fix if exists, ignoring if not is hard in pure SQL without PL/pgSQL
-- We will include it but if it fails on "relation does not exist", the user can ignore or we can remove it.
-- Assuming 'favorites' is a valid table based on typical schema, but grep was weak.
-- If this errors, user can remove this block.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites') THEN
        ALTER TABLE favorites ALTER COLUMN property_id TYPE uuid USING property_id::uuid;
        ALTER TABLE favorites DROP CONSTRAINT IF EXISTS favorites_property_id_fkey;
        ALTER TABLE favorites ADD CONSTRAINT favorites_property_id_fkey 
            FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE;
    END IF;
END $$;
