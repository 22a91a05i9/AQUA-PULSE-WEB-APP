from sqlalchemy import text
from sqlalchemy.engine import Engine


def apply_schema_patches(engine: Engine) -> None:
    with engine.begin() as connection:
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
