-- Make security_deposit column nullable
ALTER TABLE properties ALTER COLUMN security_deposit DROP NOT NULL;

-- Optional: Set a default value of 0 only for future inserts if not provided (though API handles this)
-- ALTER TABLE properties ALTER COLUMN security_deposit SET DEFAULT '0';
