from datetime import datetime, timedelta
from app.core.config import settings
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.models import Reading, Device

engine = create_engine(settings.database_url, future=True)
Session = sessionmaker(bind=engine, future=True)
values = [32, 45, 65, 74, 32]
now = datetime.utcnow()
with Session() as db:
    device = db.scalar(select(Device).where(Device.id == 2))
    if not device:
        raise SystemExit('Device 2 not found')
    readings = []
    for idx, value in enumerate(values):
        reading = Reading(
            device_id=device.id,
            site_id=2,
            ph=None,
            temperature_c=None,
            turbidity=None,
            ammonia=value,
            dissolved_oxygen=None,
            nitrate=None,
            salinity=None,
            electric_conductivity=None,
            signal_dbm=None,
            battery_v=None,
            raw_payload={
                'device_id': device.device_uid,
                '_source': 'manual',
                'ammonia': value,
                'pond_id': 'ponds',
            },
            collected_at=now - timedelta(minutes=len(values) - idx),
        )
        db.add(reading)
        readings.append(reading)
    db.commit()
    for reading in readings:
        db.refresh(reading)
    print('Inserted readings:', [r.id for r in readings])
