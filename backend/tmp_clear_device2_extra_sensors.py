from sqlalchemy import func, select, update

from app.db import SessionLocal
from app.models import Reading


with SessionLocal() as db:
    matched = db.scalar(
        select(func.count())
        .select_from(Reading)
        .where(Reading.device_id == 2, Reading.site_id == 2)
    )

    db.execute(
        update(Reading)
        .where(Reading.device_id == 2, Reading.site_id == 2)
        .values(
            dissolved_oxygen=None,
            nitrate=None,
            salinity=None,
            electric_conductivity=None,
        )
    )
    db.commit()

    remaining = db.execute(
        select(
            func.count(Reading.dissolved_oxygen),
            func.count(Reading.nitrate),
            func.count(Reading.salinity),
            func.count(Reading.electric_conductivity),
        ).where(Reading.device_id == 2, Reading.site_id == 2)
    ).one()

    print(f"Updated device 2/site 2 readings: {matched}")
    print(
        "Remaining extra sensor values: "
        f"dissolved_oxygen={remaining[0]}, nitrate={remaining[1]}, "
        f"salinity={remaining[2]}, electric_conductivity={remaining[3]}"
    )
