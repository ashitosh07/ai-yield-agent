-- AI Yield Agent Database Schema

-- Delegations table
CREATE TABLE delegations (
    id SERIAL PRIMARY KEY,
    hash VARCHAR(66) UNIQUE NOT NULL,
    delegator VARCHAR(42) NOT NULL,
    scope VARCHAR(100) NOT NULL,
    max_amount DECIMAL(18,8) NOT NULL,
    expiry BIGINT NOT NULL,
    allowed_pools JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    delegation_hash VARCHAR(66),
    action VARCHAR(50) NOT NULL,
    from_pool VARCHAR(42),
    to_pool VARCHAR(42),
    amount DECIMAL(18,8),
    confidence DECIMAL(3,2),
    rationale TEXT,
    tx_hash VARCHAR(66),
    status VARCHAR(20) DEFAULT 'pending',
    timestamp TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (delegation_hash) REFERENCES delegations(hash)
);

-- Pool events table (from Envio)
CREATE TABLE pool_events (
    id SERIAL PRIMARY KEY,
    pool_address VARCHAR(42) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    old_apy DECIMAL(5,2),
    new_apy DECIMAL(5,2),
    tvl DECIMAL(18,2),
    block_number BIGINT,
    tx_hash VARCHAR(66),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_address VARCHAR(42) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_delegations_delegator ON delegations(delegator);
CREATE INDEX idx_delegations_hash ON delegations(hash);
CREATE INDEX idx_audit_logs_delegation ON audit_logs(delegation_hash);
CREATE INDEX idx_pool_events_address ON pool_events(pool_address);
CREATE INDEX idx_notifications_user ON notifications(user_address, read);