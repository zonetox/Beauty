-- Migration: Add payment_proof_url to orders table
-- Date: 2025-01-12
-- Purpose: Store payment proof image URL

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_proof_url text;

COMMENT ON COLUMN orders.payment_proof_url IS 'URL to payment proof image';
