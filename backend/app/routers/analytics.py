from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Alert, Device, Reading, Site, SiteAgentAssignment, User


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def analytics_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregated analytics scoped by role."""

    # Scope queries by role
    if current_user.role == "manager":
        device_q = select(Device)
        alert_q = select(Alert)
        reading_q = select(Reading)
        site_q = select(Site)
        owner_count = db.scalar(select(func.count()).select_from(User).where(User.role == "owner")) or 0
        agent_count = db.scalar(select(func.count()).select_from(User).where(User.role == "agent")) or 0
    elif current_user.role == "owner":
        device_q = select(Device).where(Device.owner_user_id == current_user.id)
        alert_q = select(Alert).where(Alert.owner_user_id == current_user.id)
        site_ids_sub = select(Site.id).where(Site.owner_user_id == current_user.id)
        reading_q = select(Reading).where(Reading.site_id.in_(site_ids_sub))
        site_q = select(Site).where(Site.owner_user_id == current_user.id)
        owner_count = 1
        agent_count = db.scalar(
            select(func.count()).select_from(User).where(
                User.role == "agent",
                User.owner_user_id == current_user.id,
            )
        ) or 0
    else:  # agent
        assigned_site_ids = select(SiteAgentAssignment.site_id).where(
            SiteAgentAssignment.agent_user_id == current_user.id,
            SiteAgentAssignment.is_active.is_(True),
        )
        device_q = select(Device).where(Device.site_id.in_(assigned_site_ids))
        alert_q = select(Alert).where(Alert.recipient_user_id == current_user.id)
        reading_q = select(Reading).where(Reading.site_id.in_(assigned_site_ids))
        site_q = select(Site).where(Site.id.in_(assigned_site_ids))
        owner_count = 1 if current_user.owner_user_id else 0
        agent_count = 1

    # Device status breakdown
    devices = db.scalars(device_q).all()
    device_status = {"active": 0, "inactive": 0, "maintenance": 0}
    for d in devices:
        s = (d.status or "inactive").lower()
        if s in device_status:
            device_status[s] += 1
        else:
            device_status["inactive"] += 1

    assigned_devices = sum(1 for device in devices if device.owner_user_id is not None)
    unassigned_devices = len(devices) - assigned_devices

    # Alert severity breakdown
    alerts = db.scalars(alert_q.order_by(Alert.created_at.desc())).all()
    alert_counts = {"critical": 0, "warning": 0, "info": 0, "resolved": 0}
    for a in alerts:
        status_value = (a.status or "").strip().lower()
        severity_value = (a.severity or "").strip().lower()

        if status_value in {"resolved", "verified", "safe"} or severity_value == "safe":
            alert_counts["resolved"] += 1
        elif severity_value in {"critical", "high"}:
            alert_counts["critical"] += 1
        elif severity_value in {"warning", "medium"}:
            alert_counts["warning"] += 1
        elif severity_value in alert_counts:
            alert_counts[severity_value] += 1

    reading_scope = reading_q.subquery()
    total_readings = db.scalar(select(func.count()).select_from(reading_scope)) or 0

    top_reading_rows = db.execute(
        select(reading_scope.c.device_id, func.count().label("reading_count"))
        .group_by(reading_scope.c.device_id)
        .order_by(func.count().desc())
        .limit(5)
    ).all()
    top_device_ids = [row.device_id for row in top_reading_rows]
    top_devices = db.scalars(select(Device).where(Device.id.in_(top_device_ids))).all() if top_device_ids else []
    devices_by_id = {device.id: device for device in top_devices}

    top_devices_by_readings = []
    for row in top_reading_rows:
        device = devices_by_id.get(row.device_id)
        if not device:
            continue
        top_devices_by_readings.append(
            {
                "id": device.id,
                "device_uid": device.device_uid,
                "owner": device.owner.full_name if device.owner else "Unassigned",
                "status": device.status,
                "readings": row.reading_count,
            }
        )

    # Water quality averages from recent readings
    from sqlalchemy import desc
    recent_readings = db.scalars(reading_q.order_by(desc(Reading.received_at)).limit(50)).all()
    wq = {"avg_ph": 0, "avg_temp": 0, "avg_turbidity": 0, "reading_count": len(recent_readings)}
    if recent_readings:
        wq["avg_ph"] = round(sum(r.ph for r in recent_readings) / len(recent_readings), 2)
        wq["avg_temp"] = round(sum(r.temperature_c for r in recent_readings) / len(recent_readings), 2)
        wq["avg_turbidity"] = round(sum(r.turbidity for r in recent_readings) / len(recent_readings), 2)

    # Water quality trend (last 7 days grouped)
    wq_trend = []
    from datetime import datetime, timedelta
    for i in range(6, -1, -1):
        day = datetime.utcnow() - timedelta(days=i)
        day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_readings = [r for r in recent_readings if day_start <= r.received_at < day_end]
        if day_readings:
            wq_trend.append({
                "date": day_start.strftime("%b %d"),
                "ph": round(sum(r.ph for r in day_readings) / len(day_readings), 2),
                "temp": round(sum(r.temperature_c for r in day_readings) / len(day_readings), 2),
                "turbidity": round(sum(r.turbidity for r in day_readings) / len(day_readings), 2),
            })
        else:
            wq_trend.append({"date": day_start.strftime("%b %d"), "ph": 0, "temp": 0, "turbidity": 0})

    site_count = db.scalar(select(func.count()).select_from(site_q.subquery())) or 0

    return {
        "total_devices": len(devices),
        "total_owners": owner_count,
        "total_agents": agent_count,
        "total_sites": site_count,
        "total_alerts": len(alerts),
        "total_readings": total_readings,
        "assigned_devices": assigned_devices,
        "unassigned_devices": unassigned_devices,
        "device_status": device_status,
        "alert_counts": alert_counts,
        "water_quality": wq,
        "water_quality_trend": wq_trend,
        "top_devices_by_readings": top_devices_by_readings,
    }
