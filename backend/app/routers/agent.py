from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import require_role
from app.models import Alert, Device, Reading, Site, SiteAgentAssignment, User
from app.schemas import AlertOut, UserOut
from app.services.alerts import verify_alert_as_safe


router = APIRouter(prefix="/agent", tags=["agent"])


@router.get("/overview")
def agent_overview(
    current_user: User = Depends(require_role("agent")),
    db: Session = Depends(get_db),
):
    assignments = db.scalars(
        select(SiteAgentAssignment).where(
            SiteAgentAssignment.agent_user_id == current_user.id,
            SiteAgentAssignment.is_active.is_(True),
        )
    ).all()
    site_ids = [assignment.site_id for assignment in assignments]
    sites = db.scalars(select(Site).where(Site.id.in_(site_ids))).all() if site_ids else []
    devices = db.scalars(
        select(Device).where(Device.site_id.in_(site_ids)).order_by(Device.created_at.desc())
    ).all() if site_ids else []
    alerts = db.scalars(
        select(Alert).where(Alert.recipient_user_id == current_user.id).order_by(Alert.created_at.desc())
    ).all()
    readings = db.scalars(
        select(Reading).where(Reading.site_id.in_(site_ids)).order_by(Reading.collected_at.desc())
    ).all() if site_ids else []

    return {
        "agent": UserOut.model_validate(current_user),
        "assigned_sites": [
            {
                "id": site.id,
                "name": site.name,
                "site_type": site.site_type,
                "location_text": site.location_text,
            }
            for site in sites
        ],
        "devices": [
            {
                "id": device.id,
                "device_uid": device.device_uid,
                "status": device.status,
                "site_id": device.site_id,
                "created_at": device.created_at,
                "sensor_type_ids": device.sensor_type_ids,
                "sensor_types": [
                    {
                        "id": sensor_type.id,
                        "code": sensor_type.code,
                        "name": sensor_type.name,
                        "reading_field": sensor_type.reading_field,
                    }
                    for sensor_type in device.sensor_types
                ],
            }
            for device in devices
        ],
        "alerts": [
            {
                "id": item.id,
                "reading_id": item.reading_id,
                "device_id": item.device_id,
                "site_id": item.site_id,
                "recipient_user_id": item.recipient_user_id,
                "recipient_role": item.recipient_role,
                "metric": item.metric,
                "severity": item.severity,
                "actual_value": item.actual_value,
                "threshold_min": item.threshold_min,
                "threshold_max": item.threshold_max,
                "title": item.title,
                "message": item.message,
                "status": item.status,
                "created_at": item.created_at,
                "acknowledged_at": item.acknowledged_at,
            }
            for item in alerts
        ],
        "recent_readings": [
            {
                "id": item.id,
                "device_id": item.device_id,
                "site_id": item.site_id,
                "temperature_c": item.temperature_c,
                "ph": item.ph,
                "turbidity": item.turbidity,
                "ammonia": item.ammonia,
                "dissolved_oxygen": item.dissolved_oxygen,
                "nitrate": item.nitrate,
                "salinity": item.salinity,
                "electric_conductivity": item.electric_conductivity,
                "battery_v": item.battery_v,
                "signal_dbm": item.signal_dbm,
                "received_at": item.received_at,
                "collected_at": item.collected_at,
            }
            for item in readings
        ],
    }


@router.post("/alerts/{alert_id}/verify", response_model=AlertOut)
def verify_agent_alert(
    alert_id: int,
    current_user: User = Depends(require_role("agent")),
    db: Session = Depends(get_db),
):
    alert = db.scalar(select(Alert).where(Alert.id == alert_id))
    if not alert or alert.recipient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    verify_alert_as_safe(db, alert)
    refreshed = db.scalar(select(Alert).where(Alert.id == alert_id))
    return AlertOut.model_validate(refreshed)


@router.delete("/alerts/{alert_id}")
def delete_agent_alert(
    alert_id: int,
    current_user: User = Depends(require_role("agent")),
    db: Session = Depends(get_db),
):
    alert = db.scalar(select(Alert).where(Alert.id == alert_id))
    if not alert or alert.recipient_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return {"message": "Alert deleted successfully"}
