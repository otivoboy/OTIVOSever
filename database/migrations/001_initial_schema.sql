-- ============================================================================
-- OTIVO AI CLOUD DERIV UNIVERSAL BOT
-- PostgreSQL Production Schema Migration 001
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- 3. Deriv Accounts
CREATE TABLE IF NOT EXISTS deriv_accounts (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_number VARCHAR(32) NOT NULL,
    account_type VARCHAR(16) NOT NULL CHECK (account_type IN ('demo', 'real')),
    currency VARCHAR(8) NOT NULL DEFAULT 'USD',
    balance NUMERIC(16, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'CONNECTED',
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, account_number)
);
CREATE INDEX IF NOT EXISTS idx_deriv_accounts_user ON deriv_accounts(user_id);

-- 4. Encrypted Account Tokens
CREATE TABLE IF NOT EXISTS encrypted_account_tokens (
    id VARCHAR(64) PRIMARY KEY,
    account_id VARCHAR(64) NOT NULL REFERENCES deriv_accounts(id) ON DELETE CASCADE,
    token_masked VARCHAR(64) NOT NULL,
    ciphertext TEXT NOT NULL,
    iv VARCHAR(64) NOT NULL,
    tag VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Strategy Definitions
CREATE TABLE IF NOT EXISTS strategy_definitions (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL,
    configuration_json JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Bots
CREATE TABLE IF NOT EXISTS bots (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    deriv_account_id VARCHAR(64) NOT NULL REFERENCES deriv_accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    account_mode VARCHAR(16) NOT NULL CHECK (account_mode IN ('demo', 'real')),
    status VARCHAR(32) NOT NULL DEFAULT 'SAVED',
    execution_state VARCHAR(32) NOT NULL DEFAULT 'IDLE',
    worker_id VARCHAR(64),
    deployed_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    last_heartbeat TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bots_user_id ON bots(user_id);
CREATE INDEX IF NOT EXISTS idx_bots_status ON bots(status);

-- 7. Bot Configurations
CREATE TABLE IF NOT EXISTS bot_configurations (
    id VARCHAR(64) PRIMARY KEY,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    selected_markets JSONB NOT NULL,
    selected_contract_types JSONB NOT NULL,
    strategy_config JSONB NOT NULL,
    risk_config JSONB NOT NULL,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Bot Schedules
CREATE TABLE IF NOT EXISTS bot_schedules (
    id VARCHAR(64) PRIMARY KEY,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    schedule_type VARCHAR(32) NOT NULL,
    start_time_utc TIMESTAMPTZ,
    stop_time_utc TIMESTAMPTZ,
    run_until_stopped BOOLEAN NOT NULL DEFAULT TRUE,
    timezone VARCHAR(64) NOT NULL DEFAULT 'UTC',
    permitted_days INT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
    permitted_start_hour_utc INT NOT NULL DEFAULT 0,
    permitted_end_hour_utc INT NOT NULL DEFAULT 23,
    recurring_cron VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Worker Instances
CREATE TABLE IF NOT EXISTS worker_instances (
    instance_id VARCHAR(64) PRIMARY KEY,
    hostname VARCHAR(255) NOT NULL,
    pid INT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(32) NOT NULL DEFAULT 'HEALTHY',
    memory_usage_mb INT NOT NULL DEFAULT 0,
    active_bots_count INT NOT NULL DEFAULT 0
);

-- 10. Worker Heartbeats
CREATE TABLE IF NOT EXISTS worker_heartbeats (
    id BIGSERIAL PRIMARY KEY,
    instance_id VARCHAR(64) NOT NULL REFERENCES worker_instances(instance_id) ON DELETE CASCADE,
    heartbeat_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    active_leases JSONB,
    metrics JSONB
);
CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_time ON worker_heartbeats(heartbeat_time);

-- 11. Execution Jobs
CREATE TABLE IF NOT EXISTS execution_jobs (
    id VARCHAR(64) PRIMARY KEY,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    job_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0
);

-- 12. Strategy Events
CREATE TABLE IF NOT EXISTS strategy_events (
    id BIGSERIAL PRIMARY KEY,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    signal_data JSONB NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Market Subscriptions
CREATE TABLE IF NOT EXISTS market_subscriptions (
    id VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    worker_id VARCHAR(64) NOT NULL,
    subscribers_count INT NOT NULL DEFAULT 1,
    last_tick_time TIMESTAMPTZ,
    last_tick_quote NUMERIC(16, 5)
);

-- 14. Trade Orders
CREATE TABLE IF NOT EXISTS trade_orders (
    id VARCHAR(64) PRIMARY KEY,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    deriv_account_id VARCHAR(64) NOT NULL REFERENCES deriv_accounts(id),
    symbol VARCHAR(32) NOT NULL,
    contract_type VARCHAR(32) NOT NULL,
    stake NUMERIC(12, 2) NOT NULL,
    proposal_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Trade Contracts
CREATE TABLE IF NOT EXISTS trade_contracts (
    id VARCHAR(64) PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL REFERENCES trade_orders(id) ON DELETE CASCADE,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    deriv_contract_id VARCHAR(64) NOT NULL UNIQUE,
    symbol VARCHAR(32) NOT NULL,
    contract_type VARCHAR(32) NOT NULL,
    entry_spot NUMERIC(16, 5) NOT NULL,
    barrier VARCHAR(32),
    duration INT NOT NULL,
    duration_unit VARCHAR(8) NOT NULL,
    stake NUMERIC(12, 2) NOT NULL,
    potential_payout NUMERIC(12, 2) NOT NULL,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trade_contracts_bot ON trade_contracts(bot_id);

-- 16. Trade Settlements
CREATE TABLE IF NOT EXISTS trade_settlements (
    id VARCHAR(64) PRIMARY KEY,
    contract_id VARCHAR(64) NOT NULL REFERENCES trade_contracts(id) ON DELETE CASCADE,
    exit_spot NUMERIC(16, 5) NOT NULL,
    payout_received NUMERIC(12, 2) NOT NULL,
    realized_profit NUMERIC(12, 2) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('WON', 'LOST', 'CANCELLED')),
    settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. Risk Events
CREATE TABLE IF NOT EXISTS risk_events (
    id BIGSERIAL PRIMARY KEY,
    bot_id VARCHAR(64) NOT NULL REFERENCES bots(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    details JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    bot_id VARCHAR(64) REFERENCES bots(id) ON DELETE SET NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    level VARCHAR(16) NOT NULL,
    message TEXT NOT NULL,
    context JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- 19. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
