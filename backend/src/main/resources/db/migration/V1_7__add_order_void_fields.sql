-- V1_7__add_order_void_fields.sql
-- Add audit and reason tracking columns for VOIDED order operations

ALTER TABLE orders ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voided_by_id BIGINT CONSTRAINT fk_orders_voided_by REFERENCES users (id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS void_reason VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS void_notes VARCHAR(500);

CREATE INDEX IF NOT EXISTS idx_orders_voided_by ON orders (voided_by_id);
