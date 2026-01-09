-- Add all potential missing columns in camelCase to match frontend formData
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "location" text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "address" text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "type" text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "tenantPreference" text DEFAULT 'Any';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "securityDeposit" text;

-- Ensure previous columns are also present (idempotent check)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "contactNumber" text;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "bathroomType" text DEFAULT 'Common';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "electricityStatus" text DEFAULT 'Separate';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS "googleMapsLink" text;
