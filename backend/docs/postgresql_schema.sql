CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS farm_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS species (
    id BIGSERIAL PRIMARY KEY,
    farm_type_id INT NOT NULL REFERENCES farm_types(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    scientific_name VARCHAR(160),
    default_thresholds JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (farm_type_id, name)
);

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('manager', 'owner', 'agent')),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    password_hash TEXT NOT NULL,
    owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_by_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    farm_type_id BIGINT REFERENCES farm_types(id) ON DELETE SET NULL,
    species_id BIGINT REFERENCES species(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sites (
    id BIGSERIAL PRIMARY KEY,
    owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    site_type VARCHAR(30) NOT NULL,
    location_text VARCHAR(255),
    farm_type_id BIGINT NOT NULL REFERENCES farm_types(id),
    species_id BIGINT NOT NULL REFERENCES species(id),
    custom_thresholds JSONB,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS site_agent_assignments (
    id BIGSERIAL PRIMARY KEY,
    site_id BIGINT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    agent_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS devices (
    id BIGSERIAL PRIMARY KEY,
    device_uid VARCHAR(100) NOT NULL UNIQUE,
    imei VARCHAR(32),
    sim_number VARCHAR(30),
    gsm_number VARCHAR(30),
    firmware_version VARCHAR(40),
    status VARCHAR(20) NOT NULL DEFAULT 'inactive',
    owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    site_id BIGINT REFERENCES sites(id) ON DELETE SET NULL,
    created_by_manager_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS readings (
    id BIGSERIAL PRIMARY KEY,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    site_id BIGINT REFERENCES sites(id) ON DELETE SET NULL,
    temperature_c NUMERIC(6,2) NOT NULL,
    ph NUMERIC(4,2) NOT NULL,
    turbidity NUMERIC(8,2) NOT NULL,
    source VARCHAR(30) NOT NULL DEFAULT 'http',
    raw_payload JSONB,
    collected_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id BIGSERIAL PRIMARY KEY,
    reading_id BIGINT NOT NULL REFERENCES readings(id) ON DELETE CASCADE,
    device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    site_id BIGINT REFERENCES sites(id) ON DELETE SET NULL,
    recipient_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) NOT NULL,
    metric VARCHAR(30) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    threshold_min NUMERIC(8,2),
    threshold_max NUMERIC(8,2),
    actual_value NUMERIC(8,2) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ
);

INSERT INTO users (role, full_name, email, password_hash)
VALUES (
    'manager',
    'Default Manager',
    'manager@gmail.com',
    crypt('12345678', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;
