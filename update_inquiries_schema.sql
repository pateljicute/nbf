-- Add property_id column to inquiries table
ALTER TABLE inquiries 
ADD COLUMN IF NOT EXISTS property_id text;

-- Optional: Add foreign key constraint if you want strict enforcement
-- ALTER TABLE inquiries 
-- ADD CONSTRAINT fk_property 
-- FOREIGN KEY (property_id) 
-- REFERENCES properties(id) 
-- ON DELETE SET NULL;
