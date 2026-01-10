-- Fix Corrupted price_range data in properties table

-- 1. Update items where price_range IS NULL
UPDATE properties
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb
WHERE price_range IS NULL;

-- 2. Update items where price_range exists but minVariantPrice is missing (corrupted objects)
UPDATE properties
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb
WHERE price_range IS NOT NULL 
AND (price_range->'minVariantPrice') IS NULL;
