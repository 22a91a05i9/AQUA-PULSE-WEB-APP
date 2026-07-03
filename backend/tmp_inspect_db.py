from app.core.config import settings
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.models import Device, Site, Reading

engine = create_engine(settings.database_url, future=True)
Session = sessionmaker(bind=engine, future=True)
print('DB URL:', settings.database_url)
with Session() as db:
    print('Devices:')
    for d in db.scalars(select(Device).order_by(Device.id)).all():
        print(d.id, d.device_uid, d.owner_user_id, d.site_id, d.status, [a.sensor_type_id for a in d.sensor_assignments])
    print('Sites:')
    for s in db.scalars(select(Site).order_by(Site.id)).all():
        print(s.id, s.name, s.owner_user_id, s.farm_type_id, s.species_id)
    print('Recent readings:')
    for r in db.scalars(select(Reading).order_by(Reading.id.desc()).limit(20)).all():
        print(r.id, r.device_id, r.site_id, r.ph, r.temperature_c, r.turbidity, r.ammonia, r.nitrate, r.raw_payload)
