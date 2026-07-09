from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Alert, Reading, SiteAgentAssignment
from app.services.emergency_notifications import create_auto_sos_for_critical_alerts
from app.services.email_service import send_alert_summary_email


def create_alerts_for_reading(db: Session, reading: Reading) -> list[Alert]:
    if not reading.site or not reading.site.species:
        return []

    thresholds = reading.site.custom_thresholds or reading.site.species.default_thresholds or {}

    owner_user_id = reading.owner_user_id
    recipients = []
    if reading.site.owner:
        recipients.append(reading.site.owner)

    agent_assignments = db.scalars(
        select(SiteAgentAssignment).where(
            SiteAgentAssignment.site_id == reading.site_id,
            SiteAgentAssignment.is_active.is_(True),
        )
    ).all()
    recipients.extend([assignment.agent for assignment in agent_assignments if assignment.agent and assignment.agent.is_active])

    created_alerts: list[Alert] = []
    checks = [
        ("ph", "ph", reading.ph),
        ("temperature_c", "temperature_c", reading.temperature_c),
        ("turbidity_ntu", "turbidity", reading.turbidity),
        ("ammonia", "ammonia", reading.ammonia),
        ("dissolved_oxygen", "dissolved_oxygen", reading.dissolved_oxygen),
        ("nitrate", "nitrate", reading.nitrate),
        ("salinity", "salinity", reading.salinity),
        ("electric_conductivity", "electric_conductivity", reading.electric_conductivity),
    ]

    for metric, threshold_key, actual_value in checks:
        if actual_value is None:
            continue
        threshold = thresholds.get(threshold_key)
        if not threshold:
            continue

        threshold_min = threshold.get("min")
        threshold_max = threshold.get("max")
        is_low = threshold_min is not None and actual_value < threshold_min
        is_high = threshold_max is not None and actual_value > threshold_max
        if not (is_low or is_high):
            continue

        severity = "critical" if abs(actual_value - (threshold_min if is_low else threshold_max)) > 1 else "warning"
        direction = "below" if is_low else "above"

        for recipient in recipients:
            alert = Alert(
                reading_id=reading.id,
                device_id=reading.device_id,
                site_id=reading.site_id,
                owner_user_id=owner_user_id,
                agent_user_id=recipient.id if recipient.role == "agent" else None,
                recipient_user_id=recipient.id,
                recipient_role=recipient.role,
                metric=metric,
                severity=severity,
                threshold_min=threshold_min,
                threshold_max=threshold_max,
                actual_value=actual_value,
                title=f"{metric.upper()} threshold crossed",
                message=(
                    f"{metric} is {direction} the allowed range for site "
                    f"{reading.site.name}. Actual value: {actual_value:.2f}."
                ),
                sent_to_owner=recipient.role == "owner",
                sent_to_agent=recipient.role == "agent",
            )
            db.add(alert)
            created_alerts.append(alert)

    if created_alerts:
        db.flush()
        db.commit()
        recipient_alert_map: dict[int, list[Alert]] = {}
        for alert in created_alerts:
            if not alert.recipient or alert.severity not in {"warning", "critical"}:
                continue
            recipient_alert_map.setdefault(alert.recipient_user_id, []).append(alert)

        for grouped_alerts in recipient_alert_map.values():
            send_alert_summary_email(grouped_alerts[0].recipient, grouped_alerts, db)

        create_auto_sos_for_critical_alerts(db, created_alerts)

    return created_alerts


def verify_alert_as_safe(db: Session, alert: Alert) -> list[Alert]:
    related_alerts = db.scalars(
        select(Alert).where(
            Alert.reading_id == alert.reading_id,
            Alert.metric == alert.metric,
            Alert.device_id == alert.device_id,
            Alert.site_id == alert.site_id,
        )
    ).all()

    verified_at = datetime.utcnow()
    for item in related_alerts:
        item.severity = "safe"
        item.status = "safe"
        item.acknowledged_at = verified_at

    db.commit()
    for item in related_alerts:
        db.refresh(item)

    return related_alerts
