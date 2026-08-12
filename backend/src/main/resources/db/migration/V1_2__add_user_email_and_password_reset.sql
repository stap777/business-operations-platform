-- Flyway Migration Script
-- Version: V1_2
-- Description: Adds email field to users table and creates password_reset_tokens table.

-- 1. Add email column to users
ALTER TABLE users ADD COLUMN email VARCHAR(100);
CREATE UNIQUE INDEX idx_users_email_unique ON users (email);

-- 2. Create password_reset_tokens table
CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    user_id BIGINT NOT NULL CONSTRAINT fk_password_reset_tokens_user REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP
);

CREATE INDEX idx_pwd_reset_token_hash ON password_reset_tokens (token_hash);
CREATE INDEX idx_pwd_reset_user_id ON password_reset_tokens (user_id);

