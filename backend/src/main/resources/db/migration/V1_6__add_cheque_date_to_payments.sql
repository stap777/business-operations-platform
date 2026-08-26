-- Flyway Migration: Add cheque_date column to payments table
-- Version: V1_6

ALTER TABLE payments ADD COLUMN IF NOT EXISTS cheque_date DATE;
