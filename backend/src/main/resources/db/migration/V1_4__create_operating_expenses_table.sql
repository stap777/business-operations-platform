-- Flyway Migration V1_4: Create operating_expenses table
CREATE TABLE operating_expenses (
    id BIGSERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    description VARCHAR(500) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT,
    created_by_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_operating_expenses_date ON operating_expenses(expense_date);
CREATE INDEX idx_operating_expenses_category ON operating_expenses(category);
