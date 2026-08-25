-- Flyway Migration: Add logo_data and logo_content_type to business_settings table
-- Version: V1_5

ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS logo_data BYTEA;
ALTER TABLE business_settings ADD COLUMN IF NOT EXISTS logo_content_type VARCHAR(100);
