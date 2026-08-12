-- Flyway Migration Script
-- Version: V1_3
-- Description: Creates user_sessions table for server-side session management.

CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP,
    user_id BIGINT NOT NULL CONSTRAINT fk_user_sessions_user REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP,
    revoked_at TIMESTAMP,
    user_agent VARCHAR(512),
    ip_address VARCHAR(64)
);

CREATE INDEX idx_user_sessions_token_hash ON user_sessions (token_hash);
CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions (expires_at);
