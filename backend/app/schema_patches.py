from sqlalchemy import text
from sqlalchemy.engine import Engine


def apply_schema_patches(engine: Engine) -> None:
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
