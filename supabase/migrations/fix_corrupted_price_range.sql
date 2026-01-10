-- Fix Corrupted price_range data in properties table

-- 1. Update items where price_range IS NULL
UPDATE properties
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}, "maxVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb
WHERE price_range IS NULL;

-- 2. Update items where price_range exists but minVariantPrice is missing (corrupted objects)
UPDATE properties
SET price_range = '{"minVariantPrice": {"amount": "0", "currencyCode": "INR"}, "maxVariantPrice": {"amount": "0", "currencyCode": "INR"}}'::jsonb
WHERE price_range IS NOT NULL 
AND (price_range->'minVariantPrice') IS NULL;

-- 3. Optional: Ensure existing valid ones sync with price column if you want (Not explicitly asked but good for consistency)
-- For now, we strictly do what was asked: fix the null/corrupted ones.
