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
    elif current_user.role == "owner":
        device_q = select(Device).where(Device.owner_user_id == current_user.id)
        alert_q = select(Alert).where(Alert.owner_user_id == current_user.id)
        site_ids_sub = select(Site.id).where(Site.owner_user_id == current_user.id)
        reading_q = select(Reading).where(Reading.site_id.in_(site_ids_sub))
        site_q = select(Site).where(Site.owner_user_id == current_user.id)
    else:  # agent
        assigned_site_ids = select(SiteAgentAssignment.site_id).where(
            SiteAgentAssignment.agent_user_id == current_user.id,
            SiteAgentAssignment.is_active.is_(True),
        )
        device_q = select(Device).where(Device.site_id.in_(assigned_site_ids))
        alert_q = select(Alert).where(Alert.recipient_user_id == current_user.id)
        reading_q = select(Reading).where(Reading.site_id.in_(assigned_site_ids))
        site_q = select(Site).where(Site.id.in_(assigned_site_ids))

    # Device status breakdown
    devices = db.scalars(device_q).all()
    device_status = {"active": 0, "inactive": 0, "maintenance": 0}
    for d in devices:
        s = (d.status or "inactive").lower()
        if s in device_status:
            device_status[s] += 1
        else:
            device_status["inactive"] += 1

    # Alert severity breakdown
    alerts = db.scalars(alert_q.order_by(Alert.created_at.desc()).limit(200)).all()
    alert_counts = {"critical": 0, "warning": 0, "info": 0, "resolved": 0}
    for a in alerts:
        if a.status == "resolved" or a.status == "verified":
            alert_counts["resolved"] += 1
        elif a.severity in alert_counts:
            alert_counts[a.severity] += 1

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
        "total_sites": site_count,
        "total_alerts": len(alerts),
        "device_status": device_status,
        "alert_counts": alert_counts,
        "water_quality": wq,
        "water_quality_trend": wq_trend,
    }
