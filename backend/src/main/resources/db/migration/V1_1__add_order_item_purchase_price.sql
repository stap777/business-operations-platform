-- PostgreSQL Production Database Migration Script
-- Version: V1.1
-- Feature: Historical COGS Point-in-Time Cost Snapshot
-- Description: Adds purchase_price snapshot column to order_items table.

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12, 2);
