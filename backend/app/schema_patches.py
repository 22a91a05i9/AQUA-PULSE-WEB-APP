from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


AQUA_TABLES = {
    "agent_contacts",
    "alerts",
    "device_owner_assignments",
    "device_sensor_assignments",
    "device_site_assignments",
    "devices",
    "emergency_incidents",
    "farm_types",
    "notification_deliveries",
    "password_reset_tokens",
    "push_subscriptions",
    "report_schedules",
    "reports",
    "sensor_readings",
    "sensor_types",
    "site_agent_assignments",
    "sites",
    "species",
    "user_settings",
    "users",
}


def cleanup_non_aqua_schema(engine: Engine) -> None:
    """Remove tables/users that belong to older non-Aqua projects."""
    with engine.begin() as connection:
        inspector = inspect(connection)
        existing_tables = set(inspector.get_table_names())
        tables_to_drop = sorted(
            table
            for table in existing_tables - AQUA_TABLES
            if not table.startswith("sqlite_")
        )
        preparer = connection.dialect.identifier_preparer

        if engine.dialect.name == "sqlite":
            connection.execute(text("PRAGMA foreign_keys=OFF"))
            for table in tables_to_drop:
                connection.execute(text(f"DROP TABLE IF EXISTS {preparer.quote(table)}"))
            connection.execute(text("PRAGMA foreign_keys=ON"))
        else:
            for table in tables_to_drop:
                connection.execute(text(f"DROP TABLE IF EXISTS {preparer.quote(table)} CASCADE"))

        if "users" in existing_tables:
            connection.execute(text("DELETE FROM users WHERE LOWER(role) IN ('teacher', 'student')"))


def apply_schema_patches(engine: Engine) -> None:
    cleanup_non_aqua_schema(engine)

    with engine.begin() as connection:
        if engine.dialect.name == "sqlite":
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS sensor_types (
                        id INTEGER PRIMARY KEY,
                        code VARCHAR(50) NOT NULL UNIQUE,
                        name VARCHAR(120) NOT NULL UNIQUE,
                        reading_field VARCHAR(60) NOT NULL UNIQUE
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS device_sensor_assignments (
                        id INTEGER PRIMARY KEY,
                        device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
                        sensor_type_id INTEGER NOT NULL REFERENCES sensor_types(id) ON DELETE CASCADE,
                        assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uq_device_sensor_assignment UNIQUE (device_id, sensor_type_id)
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS agent_contacts (
                        id INTEGER PRIMARY KEY,
                        agent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(120) NOT NULL,
                        email VARCHAR(150),
                        phone VARCHAR(30),
                        tag VARCHAR(60),
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS report_schedules (
                        id INTEGER PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        title VARCHAR(200) NOT NULL,
                        report_type VARCHAR(50) NOT NULL,
                        format VARCHAR(20) NOT NULL DEFAULT 'pdf',
                        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
                        time_of_day VARCHAR(5) NOT NULL DEFAULT '08:00',
                        day_of_week INTEGER,
                        day_of_month INTEGER,
                        date_from DATETIME,
                        date_to DATETIME,
                        next_run_at DATETIME,
                        last_run_at DATETIME,
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS password_reset_tokens (
                        id INTEGER PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        token_hash VARCHAR(128) NOT NULL UNIQUE,
                        expires_at DATETIME NOT NULL,
                        used_at DATETIME,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS notification_deliveries (
                        id INTEGER PRIMARY KEY,
                        event_type VARCHAR(40) NOT NULL,
                        channel VARCHAR(20) NOT NULL DEFAULT 'email',
                        recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        recipient_email VARCHAR(150) NOT NULL,
                        subject VARCHAR(255) NOT NULL,
                        status VARCHAR(20) NOT NULL DEFAULT 'pending',
                        error_message TEXT,
                        alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
                        emergency_id INTEGER REFERENCES emergency_incidents(id) ON DELETE SET NULL,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        sent_at DATETIME
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS push_subscriptions (
                        id INTEGER PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        provider VARCHAR(30) NOT NULL DEFAULT 'onesignal',
                        subscription_id VARCHAR(255) NOT NULL,
                        device_label VARCHAR(120),
                        is_active BOOLEAN NOT NULL DEFAULT 1,
                        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        CONSTRAINT uq_push_provider_subscription UNIQUE (provider, subscription_id)
                    )
                    """
                )
            )
            emergency_columns = connection.execute(text("PRAGMA table_info(emergency_incidents)")).mappings().all()
            emergency_column_names = {column["name"] for column in emergency_columns}
            if "accepted_by_user_id" not in emergency_column_names:
                connection.execute(text("ALTER TABLE emergency_incidents ADD COLUMN accepted_by_user_id INTEGER REFERENCES users(id)"))
            if "accepted_at" not in emergency_column_names:
                connection.execute(text("ALTER TABLE emergency_incidents ADD COLUMN accepted_at DATETIME"))
            if "owner_viewed_at" not in emergency_column_names:
                connection.execute(text("ALTER TABLE emergency_incidents ADD COLUMN owner_viewed_at DATETIME"))
            columns = connection.execute(text("PRAGMA table_info(sensor_readings)")).mappings().all()
            column_names = {column["name"] for column in columns}
            needs_rebuild = bool(columns) and (
                any(column["name"] in {"ph", "temperature_c", "turbidity_ntu"} and column["notnull"] for column in columns)
                or not {"ammonia", "dissolved_oxygen", "nitrate", "salinity", "electric_conductivity"}.issubset(column_names)
            )
            if needs_rebuild:
                connection.execute(text("PRAGMA foreign_keys=OFF"))
                connection.execute(
                    text(
                        """
                        CREATE TABLE sensor_readings_new (
                            id INTEGER PRIMARY KEY,
                            device_id INTEGER NOT NULL REFERENCES devices(id),
                            site_id INTEGER REFERENCES sites(id),
                            ph FLOAT,
                            temperature_c FLOAT,
                            turbidity_ntu FLOAT,
                            ammonia FLOAT,
                            dissolved_oxygen FLOAT,
                            nitrate FLOAT,
                            salinity FLOAT,
                            electric_conductivity FLOAT,
                            signal_dbm INTEGER,
                            battery_v FLOAT,
                            raw_payload JSON,
                            collected_at DATETIME NOT NULL,
                            received_at DATETIME
                        )
                        """
                    )
                )
                select_columns = [
                    "id",
                    "device_id",
                    "site_id",
                    "ph",
                    "temperature_c",
                    "turbidity_ntu",
                    "NULL AS ammonia",
                    "NULL AS dissolved_oxygen",
                    "NULL AS nitrate",
                    "NULL AS salinity",
                    "NULL AS electric_conductivity",
                    "signal_dbm",
                    "battery_v",
                    "raw_payload",
                    "collected_at",
                    "received_at",
                ]
                for field in ["ammonia", "dissolved_oxygen", "nitrate", "salinity", "electric_conductivity"]:
                    if field in column_names:
                        select_columns[select_columns.index(f"NULL AS {field}")] = field
                connection.execute(
                    text(
                        f"""
                        INSERT INTO sensor_readings_new (
                            id, device_id, site_id, ph, temperature_c, turbidity_ntu,
                            ammonia, dissolved_oxygen, nitrate, salinity, electric_conductivity,
                            signal_dbm, battery_v, raw_payload, collected_at, received_at
                        )
                        SELECT {", ".join(select_columns)}
                        FROM sensor_readings
                        """
                    )
                )
                connection.execute(text("DROP TABLE sensor_readings"))
                connection.execute(text("ALTER TABLE sensor_readings_new RENAME TO sensor_readings"))
                connection.execute(text("PRAGMA foreign_keys=ON"))
        else:
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS sensor_types (
                        id INTEGER PRIMARY KEY,
                        code VARCHAR(50) NOT NULL UNIQUE,
                        name VARCHAR(120) NOT NULL UNIQUE,
                        reading_field VARCHAR(60) NOT NULL UNIQUE
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS device_sensor_assignments (
                        id SERIAL PRIMARY KEY,
                        device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
                        sensor_type_id INTEGER NOT NULL REFERENCES sensor_types(id) ON DELETE CASCADE,
                        assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        CONSTRAINT uq_device_sensor_assignment UNIQUE (device_id, sensor_type_id)
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS agent_contacts (
                        id SERIAL PRIMARY KEY,
                        agent_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        name VARCHAR(120) NOT NULL,
                        email VARCHAR(150),
                        phone VARCHAR(30),
                        tag VARCHAR(60),
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS report_schedules (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        title VARCHAR(200) NOT NULL,
                        report_type VARCHAR(50) NOT NULL,
                        format VARCHAR(20) NOT NULL DEFAULT 'pdf',
                        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
                        time_of_day VARCHAR(5) NOT NULL DEFAULT '08:00',
                        day_of_week INTEGER,
                        day_of_month INTEGER,
                        date_from TIMESTAMP,
                        date_to TIMESTAMP,
                        next_run_at TIMESTAMP,
                        last_run_at TIMESTAMP,
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS password_reset_tokens (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        token_hash VARCHAR(128) NOT NULL UNIQUE,
                        expires_at TIMESTAMP NOT NULL,
                        used_at TIMESTAMP,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW()
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS notification_deliveries (
                        id SERIAL PRIMARY KEY,
                        event_type VARCHAR(40) NOT NULL,
                        channel VARCHAR(20) NOT NULL DEFAULT 'email',
                        recipient_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        recipient_email VARCHAR(150) NOT NULL,
                        subject VARCHAR(255) NOT NULL,
                        status VARCHAR(20) NOT NULL DEFAULT 'pending',
                        error_message TEXT,
                        alert_id INTEGER REFERENCES alerts(id) ON DELETE SET NULL,
                        emergency_id INTEGER REFERENCES emergency_incidents(id) ON DELETE SET NULL,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        sent_at TIMESTAMP
                    )
                    """
                )
            )
            connection.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS push_subscriptions (
                        id SERIAL PRIMARY KEY,
                        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        provider VARCHAR(30) NOT NULL DEFAULT 'onesignal',
                        subscription_id VARCHAR(255) NOT NULL,
                        device_label VARCHAR(120),
                        is_active BOOLEAN NOT NULL DEFAULT TRUE,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        CONSTRAINT uq_push_provider_subscription UNIQUE (provider, subscription_id)
                    )
                    """
                )
            )
            connection.execute(text("ALTER TABLE emergency_incidents ADD COLUMN IF NOT EXISTS accepted_by_user_id INTEGER REFERENCES users(id)"))
            connection.execute(text("ALTER TABLE emergency_incidents ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP"))
            connection.execute(text("ALTER TABLE emergency_incidents ADD COLUMN IF NOT EXISTS owner_viewed_at TIMESTAMP"))
            connection.execute(text("ALTER TABLE sensor_readings ALTER COLUMN ph DROP NOT NULL"))
            connection.execute(text("ALTER TABLE sensor_readings ALTER COLUMN temperature_c DROP NOT NULL"))
            connection.execute(text("ALTER TABLE sensor_readings ALTER COLUMN turbidity_ntu DROP NOT NULL"))
            connection.execute(text("ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS ammonia FLOAT"))
            connection.execute(text("ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS dissolved_oxygen FLOAT"))
            connection.execute(text("ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS nitrate FLOAT"))
            connection.execute(text("ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS salinity FLOAT"))
            connection.execute(text("ALTER TABLE sensor_readings ADD COLUMN IF NOT EXISTS electric_conductivity FLOAT"))

        if engine.dialect.name != "sqlite":
            connection.execute(text("ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_severity_check"))
            connection.execute(
                text(
                    """
                    ALTER TABLE alerts
                    ADD CONSTRAINT alerts_severity_check
                    CHECK (severity IN ('safe', 'warning', 'critical', 'info'))
                    """
                )
            )

            connection.execute(text("ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_status_check"))
            connection.execute(
                text(
                    """
                    ALTER TABLE alerts
                    ADD CONSTRAINT alerts_status_check
                    CHECK (status IN ('open', 'acknowledged', 'resolved', 'safe'))
                    """
                )
            )

            connection.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_portal_access TIMESTAMP"))

            connection.execute(text("ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_site_type_check"))
            connection.execute(
                text(
                    """
                    ALTER TABLE sites
                    ADD CONSTRAINT sites_site_type_check
                    CHECK (site_type IN ('pond', 'lake', 'tank', 'hatchery', 'raceway', 'swimming_pool', 'other'))
                    """
                )
            )
