-- Enable PostGIS extension for spatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
-- Add a geography column to the 'properties' table if it doesn't exist
-- This allows for accurate distance calculations in meters
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS location_geo geography(POINT);
-- Create an index on the new geography column for fast querying
CREATE INDEX IF NOT EXISTS idx_properties_location_geo 
ON properties 
USING GIST (location_geo);
-- Sync existing lat/long data to the new geography column
UPDATE properties 
SET location_geo = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
-- Create a database function to find properties within a radius (e.g., 20km)
-- This avoids complex SQL in the application layer
CREATE OR REPLACE FUNCTION get_nearby_properties(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision DEFAULT 20000 -- Default 20km
) 
RETURNS SETOF properties AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM properties
  WHERE ST_DWithin(
    location_geo,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  );
END;
$$ LANGUAGE plpgsql;
-- Trigger to automatically update location_geo when lat/lng changes
CREATE OR REPLACE FUNCTION update_location_geo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_geo := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_update_location_geo ON properties;
CREATE TRIGGER trigger_update_location_geo
BEFORE INSERT OR UPDATE OF latitude, longitude ON properties
FOR EACH ROW
EXECUTE FUNCTION update_location_geo();
