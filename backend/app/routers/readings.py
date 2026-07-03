from datetime import datetime

from fastapi import APIRouter, Depends, Form, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Alert, Device, Reading, Site, SiteAgentAssignment, User
from app.schemas import AlertOut, ReadingIngest, ReadingOut
from app.services.ingestion import store_device_reading


router = APIRouter(prefix="/readings", tags=["readings"])


def build_reading_payload(
    device_id: str,
    pond_id: str | None,
    temperature_c: float | None,
    ph: float | None,
    turbidity: float | None,
    turbidity_ntu: float | None,
    ammonia: float | None,
    dissolved_oxygen: float | None,
    nitrate: float | None,
    salinity: float | None,
    electric_conductivity: float | None,
    signal_dbm: int | None,
    battery_v: float | None,
    collected_at: datetime | None,
) -> ReadingIngest:
    return ReadingIngest(
        device_id=device_id,
        pond_id=pond_id,
        temperature_c=temperature_c,
        ph=ph,
        turbidity=turbidity,
        turbidity_ntu=turbidity_ntu,
        ammonia=ammonia,
        dissolved_oxygen=dissolved_oxygen,
        nitrate=nitrate,
        salinity=salinity,
        electric_conductivity=electric_conductivity,
        signal_dbm=signal_dbm,
        battery_v=battery_v,
        collected_at=collected_at,
    )


@router.post("/ingest", response_model=ReadingOut)
def ingest_reading(payload: ReadingIngest, db: Session = Depends(get_db)):
    reading = store_device_reading(db, payload, source="http")
    return ReadingOut.model_validate(reading)


@router.get("/gsm-ingest", response_model=ReadingOut)
def ingest_gsm_reading_query(
    device_id: str = Query(...),
    pond_id: str | None = Query(default=None),
    temperature_c: float | None = Query(default=None),
    ph: float | None = Query(default=None),
    turbidity: float | None = Query(default=None),
    turbidity_ntu: float | None = Query(default=None),
    ammonia: float | None = Query(default=None),
    dissolved_oxygen: float | None = Query(default=None),
    nitrate: float | None = Query(default=None),
    salinity: float | None = Query(default=None),
    electric_conductivity: float | None = Query(default=None),
    signal_dbm: int | None = Query(default=None),
    battery_v: float | None = Query(default=None),
    collected_at: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
):
    payload = build_reading_payload(
        device_id=device_id,
        pond_id=pond_id,
        temperature_c=temperature_c,
        ph=ph,
        turbidity=turbidity,
        turbidity_ntu=turbidity_ntu,
        ammonia=ammonia,
        dissolved_oxygen=dissolved_oxygen,
        nitrate=nitrate,
        salinity=salinity,
        electric_conductivity=electric_conductivity,
        signal_dbm=signal_dbm,
        battery_v=battery_v,
        collected_at=collected_at,
    )
    reading = store_device_reading(db, payload, source="gsm")
    return ReadingOut.model_validate(reading)


@router.post("/gsm-ingest-form", response_model=ReadingOut)
def ingest_gsm_reading_form(
    device_id: str = Form(...),
    pond_id: str | None = Form(default=None),
    temperature_c: float | None = Form(default=None),
    ph: float | None = Form(default=None),
    turbidity: float | None = Form(default=None),
    turbidity_ntu: float | None = Form(default=None),
    ammonia: float | None = Form(default=None),
    dissolved_oxygen: float | None = Form(default=None),
    nitrate: float | None = Form(default=None),
    salinity: float | None = Form(default=None),
    electric_conductivity: float | None = Form(default=None),
    signal_dbm: int | None = Form(default=None),
    battery_v: float | None = Form(default=None),
    collected_at: datetime | None = Form(default=None),
    db: Session = Depends(get_db),
):
    payload = build_reading_payload(
        device_id=device_id,
        pond_id=pond_id,
        temperature_c=temperature_c,
        ph=ph,
        turbidity=turbidity,
        turbidity_ntu=turbidity_ntu,
        ammonia=ammonia,
        dissolved_oxygen=dissolved_oxygen,
        nitrate=nitrate,
        salinity=salinity,
        electric_conductivity=electric_conductivity,
        signal_dbm=signal_dbm,
        battery_v=battery_v,
        collected_at=collected_at,
    )
    reading = store_device_reading(db, payload, source="gsm")
    return ReadingOut.model_validate(reading)


@router.get("/device/{device_id}", response_model=list[ReadingOut])
def list_readings_for_device(
    device_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device:
        return []

    query = select(Reading).where(Reading.device_id == device_id).order_by(Reading.collected_at.desc()).limit(50)
    if current_user.role == "owner":
        query = (
            select(Reading)
            .join(Device, Reading.device_id == Device.id)
            .outerjoin(Site, Reading.site_id == Site.id)
            .where(
                Reading.device_id == device_id,
                or_(Device.owner_user_id == current_user.id, Site.owner_user_id == current_user.id),
            )
            .order_by(Reading.collected_at.desc())
            .limit(50)
        )
    elif current_user.role == "agent":
        if not device.site_id:
            return []
        assignment = db.scalar(
            select(SiteAgentAssignment).where(
                SiteAgentAssignment.agent_user_id == current_user.id,
                SiteAgentAssignment.site_id == device.site_id,
                SiteAgentAssignment.is_active.is_(True),
            )
        )
        if not assignment:
            return []
        query = query.where(Reading.site_id == device.site_id)
    readings = db.scalars(query).all()
    return [ReadingOut.model_validate(item) for item in readings]


@router.get("/alerts/me", response_model=list[AlertOut])
def list_my_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alerts = db.scalars(
        select(Alert).where(Alert.recipient_user_id == current_user.id).order_by(Alert.created_at.desc()).limit(50)
    ).all()
    return [AlertOut.model_validate(item) for item in alerts]


@router.put("/alerts/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.scalar(select(Alert).where(Alert.id == alert_id))
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    if alert.recipient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to acknowledge this alert")

    alert.status = "acknowledged"
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)

    return AlertOut.model_validate(alert)


@router.put("/alerts/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(
    alert_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.scalar(select(Alert).where(Alert.id == alert_id))
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    if alert.recipient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to resolve this alert")

    alert.status = "resolved"
    alert.acknowledged_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)

    return AlertOut.model_validate(alert)


@router.get("/owner/all", response_model=list[ReadingOut])
def list_all_owner_readings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all sensor readings for owner's devices and sites (no limit)"""
    if current_user.role not in ["owner", "agent"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if current_user.role == "owner":
        query = (
            select(Reading)
            .join(Device, Reading.device_id == Device.id)
            .outerjoin(Site, Reading.site_id == Site.id)
            .where(or_(Device.owner_user_id == current_user.id, Site.owner_user_id == current_user.id))
            .order_by(Reading.collected_at.desc())
        )
    else:
        query = (
            select(Reading)
            .join(Device, Reading.device_id == Device.id)
            .outerjoin(Site, Reading.site_id == Site.id)
            .join(SiteAgentAssignment, Site.id == SiteAgentAssignment.site_id)
            .where(
                SiteAgentAssignment.agent_user_id == current_user.id,
                SiteAgentAssignment.is_active.is_(True),
            )
            .order_by(Reading.collected_at.desc())
        )

    readings = db.scalars(query).all()
    return [ReadingOut.model_validate(item) for item in readings]
