import logging
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Device, DeviceOwnerAssignment, DeviceSiteAssignment, Reading, Site
from app.schemas import ReadingIngest
from app.services.alerts import create_alerts_for_reading

logger = logging.getLogger(__name__)

SENSOR_FIELD_BY_ID = {
    1: "ph",
    2: "temperature_c",
    3: "turbidity",
    4: "ammonia",
    5: "dissolved_oxygen",
    6: "nitrate",
    7: "salinity",
    8: "electric_conductivity",
}


def resolve_owner_id(db: Session, device: Device) -> int | None:
    if device.owner_user_id:
        return device.owner_user_id

    assignment = db.scalar(
        select(DeviceOwnerAssignment).where(
            DeviceOwnerAssignment.device_id == device.id,
            DeviceOwnerAssignment.is_active.is_(True),
        ).order_by(DeviceOwnerAssignment.assigned_at.desc(), DeviceOwnerAssignment.id.desc())
    )
    return assignment.owner_user_id if assignment else None


def resolve_site_id(db: Session, device: Device, payload: ReadingIngest, owner_user_id: int | None) -> int | None:
    if device.site_id:
        return device.site_id

    assignment = db.scalar(
        select(DeviceSiteAssignment).where(
            DeviceSiteAssignment.device_id == device.id,
            DeviceSiteAssignment.is_active.is_(True),
        ).order_by(DeviceSiteAssignment.assigned_at.desc(), DeviceSiteAssignment.id.desc())
    )
    if assignment:
        return assignment.site_id

    if payload.pond_id:
        site_query = select(Site).where(func.lower(func.trim(Site.name)) == payload.pond_id.strip().lower())
        if owner_user_id:
            site_query = site_query.where(Site.owner_user_id == owner_user_id)
        site = db.scalar(site_query.order_by(Site.created_at.desc()))
        if site:
            return site.id

    return None


def store_device_reading(db: Session, payload: ReadingIngest, source: str = "http") -> Reading:
    device = db.scalar(
        select(Device).where(func.lower(func.trim(Device.device_uid)) == payload.device_id.strip().lower())
    )
    if not device:
        logger.warning("Reading rejected: device '%s' is not registered", payload.device_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not registered")

    owner_user_id = resolve_owner_id(db, device)
    site_id = resolve_site_id(db, device, payload, owner_user_id)

    if owner_user_id and device.owner_user_id != owner_user_id:
        device.owner_user_id = owner_user_id
    if site_id and device.site_id != site_id:
        device.site_id = site_id

    assigned_fields = {SENSOR_FIELD_BY_ID[sensor_id] for sensor_id in device.sensor_type_ids if sensor_id in SENSOR_FIELD_BY_ID}
    reading_values = {
        "temperature_c": payload.temperature_c if "temperature_c" in assigned_fields else None,
        "ph": payload.ph if "ph" in assigned_fields else None,
        "turbidity": payload.turbidity if "turbidity" in assigned_fields else None,
        "ammonia": payload.ammonia if "ammonia" in assigned_fields else None,
        "dissolved_oxygen": payload.dissolved_oxygen if "dissolved_oxygen" in assigned_fields else None,
        "nitrate": payload.nitrate if "nitrate" in assigned_fields else None,
        "salinity": payload.salinity if "salinity" in assigned_fields else None,
        "electric_conductivity": payload.electric_conductivity if "electric_conductivity" in assigned_fields else None,
    }

    reading = Reading(
        device_id=device.id,
        site_id=site_id,
        **reading_values,
        signal_dbm=payload.signal_dbm,
        battery_v=payload.battery_v,
        raw_payload={**payload.model_dump(mode="json"), "_source": source},
        collected_at=payload.collected_at or datetime.utcnow(),
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    create_alerts_for_reading(db, reading)
    db.refresh(reading)
    logger.info(
        "Reading stored: source=%s device_uid=%s reading_id=%s site_id=%s owner_user_id=%s values=%s",
        source,
        payload.device_id,
        reading.id,
        reading.site_id,
        reading.owner_user_id,
        reading_values,
    )
    return reading
