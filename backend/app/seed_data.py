import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.models import Device, DeviceSensorAssignment, FarmType, SensorType, Species, User


def seed_database(db: Session) -> None:
    seed_manager(db)
    seed_sensor_types(db)
    seed_master_data(db)


def seed_manager(db: Session) -> None:
    manager = db.scalar(select(User).where(User.email == settings.default_manager_email))
    if manager:
        return

    manager = User(
        role="manager",
        full_name="Default Manager",
        email=settings.default_manager_email,
        password_hash=hash_password(settings.default_manager_password),
    )
    db.add(manager)
    db.commit()


def seed_sensor_types(db: Session) -> None:
    sensor_types = [
        (1, "ph", "pH Sensor", "ph"),
        (2, "temperature", "Temperature Sensor", "temperature_c"),
        (3, "turbidity", "Turbidity Sensor", "turbidity"),
        (4, "ammonia", "Ammonia Sensor", "ammonia"),
        (5, "dissolved_oxygen", "Dissolved Oxygen Sensor", "dissolved_oxygen"),
        (6, "nitrate", "Nitrate Sensor", "nitrate"),
        (7, "salinity", "Salinity Sensor", "salinity"),
        (8, "electric_conductivity", "Electric Conductivity Sensor", "electric_conductivity"),
    ]

    changed = False
    for sensor_id, code, name, reading_field in sensor_types:
        sensor_type = db.scalar(select(SensorType).where(SensorType.id == sensor_id))
        if sensor_type:
            sensor_type.code = code
            sensor_type.name = name
            sensor_type.reading_field = reading_field
            changed = True
            continue

        db.add(SensorType(id=sensor_id, code=code, name=name, reading_field=reading_field))
        changed = True

    if changed:
        db.commit()

    devices = db.scalars(select(Device)).all()
    for device in devices:
        has_assignment = db.scalar(
            select(DeviceSensorAssignment).where(DeviceSensorAssignment.device_id == device.id).limit(1)
        )
        if has_assignment:
            continue
        for sensor_type_id in [1, 2, 3]:
            db.add(DeviceSensorAssignment(device_id=device.id, sensor_type_id=sensor_type_id))
    db.commit()


def seed_master_data(db: Session) -> None:
    data_file = Path(__file__).resolve().parent / "data" / "species_thresholds.json"
    payload = json.loads(data_file.read_text(encoding="utf-8"))

    for farm_code, farm_config in payload.items():
        farm_type = db.scalar(select(FarmType).where(FarmType.code == farm_code))
        if not farm_type:
            farm_type = FarmType(code=farm_code, name=farm_config["label"])
            db.add(farm_type)
            db.flush()

        for species_name, species_config in farm_config["species"].items():
            existing_species = db.scalar(
                select(Species).where(
                    Species.farm_type_id == farm_type.id,
                    Species.name == species_name,
                )
            )
            if existing_species:
                continue

            db.add(
                Species(
                    farm_type_id=farm_type.id,
                    name=species_name,
                    scientific_name=species_config.get("scientific_name"),
                    default_thresholds=species_config["thresholds"],
                )
            )

    db.commit()
