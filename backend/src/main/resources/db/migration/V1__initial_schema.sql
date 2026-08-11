-- Flyway Initial Schema Migration Script
-- Version: V1
-- Description: Creates initial PostgreSQL database schema for AVEN platform entities.

-- 1. users
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    first_login BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_users_username ON users (username);
CREATE INDEX idx_users_phone_number ON users (phone_number);

-- 2. business_settings
CREATE TABLE business_settings (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    business_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address VARCHAR(500) NOT NULL,
    invoice_prefix VARCHAR(15) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    logo_url VARCHAR(500),
    default_payment_terms VARCHAR(500),
    invoice_footer VARCHAR(500)
);

-- 3. categories
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_categories_name ON categories (name);

-- 4. customers
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    customer_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    alternate_phone_number VARCHAR(15),
    address VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_customers_code ON customers (customer_code);
CREATE INDEX idx_customers_phone ON customers (phone_number);
CREATE INDEX idx_customers_name ON customers (full_name);

-- 5. coupons
CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    code VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(500),
    discount_type VARCHAR(20) NOT NULL,
    discount_value NUMERIC(12, 2) NOT NULL,
    minimum_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    maximum_discount NUMERIC(12, 2),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    usage_limit INTEGER NOT NULL,
    used_count INTEGER NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_coupons_active ON coupons (active);
CREATE INDEX idx_coupons_dates ON coupons (start_date, end_date);

-- 6. products
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    name VARCHAR(100) NOT NULL,
    category_id BIGINT NOT NULL CONSTRAINT fk_products_category REFERENCES categories (id),
    purchase_price NUMERIC(12, 2) NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL,
    available_stock INTEGER NOT NULL,
    minimum_stock INTEGER NOT NULL,
    unit VARCHAR(20) NOT NULL,
    track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);

CREATE INDEX idx_products_name ON products (name);
CREATE INDEX idx_products_category_id ON products (category_id);
CREATE INDEX idx_products_status ON products (status);

-- 7. orders
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    order_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL CONSTRAINT fk_orders_customer REFERENCES customers (id),
    manager_id BIGINT NOT NULL CONSTRAINT fk_orders_manager REFERENCES users (id),
    delivery_person_id BIGINT CONSTRAINT fk_orders_delivery_person REFERENCES users (id),
    order_status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL,
    amount_received NUMERIC(12, 2) DEFAULT 0.00,
    payment_method VARCHAR(20),
    delivery_instructions VARCHAR(500),
    notes VARCHAR(500),
    coupon_id BIGINT CONSTRAINT fk_orders_coupon REFERENCES coupons (id)
);

CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_manager_id ON orders (manager_id);
CREATE INDEX idx_orders_delivery_person_id ON orders (delivery_person_id);
CREATE INDEX idx_orders_order_status ON orders (order_status);
CREATE INDEX idx_orders_created_at ON orders (created_at);

-- 8. order_items
-- Note: purchase_price column is added in V1_1__add_order_item_purchase_price.sql
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    order_id BIGINT NOT NULL CONSTRAINT fk_order_items_order REFERENCES orders (id),
    product_id BIGINT NOT NULL CONSTRAINT fk_order_items_product REFERENCES products (id),
    quantity INTEGER NOT NULL,
    selling_price NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_order_items_order_id ON order_items (order_id);
CREATE INDEX idx_order_items_product_id ON order_items (product_id);

-- 9. invoices
CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    order_id BIGINT NOT NULL UNIQUE CONSTRAINT fk_invoices_order REFERENCES orders (id),
    invoice_date TIMESTAMP NOT NULL,
    customer_name_snapshot VARCHAR(100) NOT NULL,
    customer_phone_snapshot VARCHAR(20) NOT NULL,
    customer_address_snapshot VARCHAR(500) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL,
    payment_received_at_generation NUMERIC(12, 2) NOT NULL,
    generated_by_id BIGINT NOT NULL CONSTRAINT fk_invoices_generated_by REFERENCES users (id)
);

CREATE INDEX idx_invoices_date ON invoices (invoice_date);
CREATE INDEX idx_invoices_created_at ON invoices (created_at);

-- 10. invoice_items
CREATE TABLE invoice_items (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    invoice_id BIGINT NOT NULL CONSTRAINT fk_invoice_items_invoice REFERENCES invoices (id),
    product_name_snapshot VARCHAR(150) NOT NULL,
    quantity INTEGER NOT NULL,
    selling_price_snapshot NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items (invoice_id);

-- 11. payments
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    payment_number VARCHAR(30) NOT NULL UNIQUE,
    customer_id BIGINT NOT NULL CONSTRAINT fk_payments_customer REFERENCES customers (id),
    received_by_id BIGINT NOT NULL CONSTRAINT fk_payments_received_by REFERENCES users (id),
    payment_date TIMESTAMP NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    remarks VARCHAR(500)
);

CREATE INDEX idx_payments_customer_id ON payments (customer_id);
CREATE INDEX idx_payments_received_by_id ON payments (received_by_id);
CREATE INDEX idx_payments_payment_date ON payments (payment_date);

-- 12. payment_allocations
CREATE TABLE payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    payment_id BIGINT NOT NULL CONSTRAINT fk_payment_allocations_payment REFERENCES payments (id),
    order_id BIGINT NOT NULL CONSTRAINT fk_payment_allocations_order REFERENCES orders (id),
    allocated_amount NUMERIC(12, 2) NOT NULL
);

CREATE INDEX idx_pay_alloc_payment_id ON payment_allocations (payment_id);
CREATE INDEX idx_pay_alloc_order_id ON payment_allocations (order_id);

-- 13. stock_adjustments
CREATE TABLE stock_adjustments (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    product_id BIGINT NOT NULL CONSTRAINT fk_stock_adjustments_product REFERENCES products (id),
    adjustment_type VARCHAR(20) NOT NULL,
    quantity INTEGER NOT NULL,
    reason VARCHAR(500) NOT NULL,
    reference_number VARCHAR(50),
    adjusted_by_id BIGINT NOT NULL CONSTRAINT fk_stock_adjustments_adjusted_by REFERENCES users (id),
    adjustment_date TIMESTAMP NOT NULL
);

CREATE INDEX idx_stock_adj_product_id ON stock_adjustments (product_id);
CREATE INDEX idx_stock_adj_type ON stock_adjustments (adjustment_type);
CREATE INDEX idx_stock_adj_date ON stock_adjustments (adjustment_date);

-- 14. audit_logs
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by_id BIGINT NOT NULL CONSTRAINT fk_audit_logs_performed_by REFERENCES users (id),
    performed_at TIMESTAMP NOT NULL,
    remarks VARCHAR(500)
);

CREATE INDEX idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs (action);
CREATE INDEX idx_audit_logs_performed_by ON audit_logs (performed_by_id);
CREATE INDEX idx_audit_logs_performed_at ON audit_logs (performed_at);
