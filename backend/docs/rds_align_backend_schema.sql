BEGIN;

-- Align users table with the current FastAPI models.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_by_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS farm_type_id BIGINT REFERENCES farm_types(id),
    ADD COLUMN IF NOT EXISTS species_id BIGINT REFERENCES species(id);

UPDATE users
SET created_by_id = created_by
WHERE created_by_id IS NULL
  AND created_by IS NOT NULL;

-- Align devices table with the current FastAPI models.
ALTER TABLE devices
    ADD COLUMN IF NOT EXISTS owner_user_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS site_id BIGINT REFERENCES sites(id);

WITH latest_owner AS (
    SELECT DISTINCT ON (device_id)
        device_id,
        owner_user_id
    FROM device_owner_assignments
    WHERE is_active = TRUE
    ORDER BY device_id, assigned_at DESC, id DESC
)
UPDATE devices AS d
SET owner_user_id = latest_owner.owner_user_id
FROM latest_owner
WHERE d.id = latest_owner.device_id
  AND d.owner_user_id IS NULL;

WITH latest_site AS (
    SELECT DISTINCT ON (device_id)
        device_id,
        site_id
    FROM device_site_assignments
    WHERE is_active = TRUE
    ORDER BY device_id, assigned_at DESC, id DESC
)
UPDATE devices AS d
SET site_id = latest_site.site_id
FROM latest_site
WHERE d.id = latest_site.device_id
  AND d.site_id IS NULL;

-- Align alerts table with the current FastAPI models.
ALTER TABLE alerts
    ADD COLUMN IF NOT EXISTS recipient_user_id BIGINT REFERENCES users(id),
    ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(20);

UPDATE alerts
SET recipient_user_id = owner_user_id,
    recipient_role = 'owner'
WHERE recipient_user_id IS NULL
  AND owner_user_id IS NOT NULL;

UPDATE alerts
SET recipient_user_id = agent_user_id,
    recipient_role = 'agent'
WHERE recipient_user_id IS NULL
  AND agent_user_id IS NOT NULL;

COMMIT;
