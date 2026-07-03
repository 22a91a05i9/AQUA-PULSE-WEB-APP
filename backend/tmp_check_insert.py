from app.core.config import settings
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from app.models import Reading

engine = create_engine(settings.database_url, future=True)
Session = sessionmaker(bind=engine, future=True)
with Session() as db:
    rs = db.scalars(select(Reading).where(Reading.id >= 594).order_by(Reading.id)).all()
    for r in rs:
        print(r.id, r.device_id, r.site_id, r.ammonia, r.raw_payload)
