-- Add provider_type column with default for existing shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'square';

-- Rename square-specific columns to generic provider columns
ALTER TABLE shops RENAME COLUMN square_token TO provider_token;
ALTER TABLE shops RENAME COLUMN square_location TO provider_location_id;

-- Rename in bookings table
ALTER TABLE bookings RENAME COLUMN square_booking_id TO provider_booking_id;
