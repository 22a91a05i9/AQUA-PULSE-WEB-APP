import logging
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Device, DeviceOwnerAssignment, DeviceSiteAssignment, Reading, Site
from app.schemas import ReadingIngest
from app.services.alerts import create_alerts_for_reading

logger = logging.getLogger(__name__)


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

    reading = Reading(
        device_id=device.id,
        site_id=site_id,
        temperature_c=payload.temperature_c,
        ph=payload.ph,
        turbidity=payload.turbidity,
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
        "Reading stored: source=%s device_uid=%s reading_id=%s site_id=%s owner_user_id=%s temp=%s ph=%s turbidity=%s",
        source,
        payload.device_id,
        reading.id,
        reading.site_id,
        reading.owner_user_id,
        reading.temperature_c,
        reading.ph,
        reading.turbidity,
    )
    return reading
