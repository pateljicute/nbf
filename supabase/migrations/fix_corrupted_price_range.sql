-- Fix Corrupted price_range data in properties table (User Requested Command)

UPDATE properties 
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}' 
WHERE price_range IS NULL;

-- Also covering the case where it exists but is corrupted/empty
UPDATE properties 
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}' 
WHERE price_range IS NOT NULL AND (price_range->'minVariantPrice') IS NULL;
