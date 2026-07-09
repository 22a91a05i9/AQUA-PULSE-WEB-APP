import logging
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Alert, EmergencyIncident, Site, SiteAgentAssignment, User
from app.services.email_service import send_emergency_email
from app.services.push_service import push_is_configured, send_emergency_push
from app.services.twilio_service import send_emergency_call, send_emergency_sms, send_emergency_studio_flow


logger = logging.getLogger(__name__)
AUTO_SENSOR_SOS_PREFIX = "[AUTO SENSOR SOS]"


def emergency_recipients(
    db: Session,
    incident: EmergencyIncident,
    triggered_by: User,
    *,
    include_triggered_by: bool = False,
) -> list[User]:
    recipients: list[User] = []
    owner: User | None = None

    if incident.site_id:
        site = db.scalar(select(Site).where(Site.id == incident.site_id))
        if site and site.owner:
            owner = site.owner

    if owner is None and triggered_by.owner_user_id:
        owner = db.scalar(select(User).where(User.id == triggered_by.owner_user_id, User.role == "owner"))

    if owner and owner.is_active:
        recipients.append(owner)

    managers = db.scalars(select(User).where(User.role == "manager", User.is_active.is_(True))).all()
    recipients.extend(managers)

    deduped: dict[int, User] = {}
    for recipient in recipients:
        if include_triggered_by or recipient.id != triggered_by.id:
            deduped[recipient.id] = recipient
    return list(deduped.values())


def notify_emergency_recipients(
    db: Session,
    incident: EmergencyIncident,
    triggered_by: User,
    *,
    include_triggered_by: bool = False,
) -> None:
    for recipient in emergency_recipients(db, incident, triggered_by, include_triggered_by=include_triggered_by):
        send_emergency_email(recipient, incident, triggered_by, db)
        if push_is_configured():
            send_emergency_push(recipient, incident, triggered_by, db)
        send_emergency_studio_flow(recipient, incident, triggered_by, db)
        send_emergency_sms(recipient, incident, triggered_by, db)
        send_emergency_call(recipient, incident, triggered_by, db)


def _auto_trigger_user(db: Session, site: Site, critical_alerts: list[Alert]) -> User | None:
    for alert in critical_alerts:
        if alert.recipient and alert.recipient.role == "agent" and alert.recipient.is_active:
            return alert.recipient

    assignment = db.scalar(
        select(SiteAgentAssignment)
        .where(
            SiteAgentAssignment.site_id == site.id,
            SiteAgentAssignment.is_active.is_(True),
        )
        .order_by(SiteAgentAssignment.assigned_at.desc(), SiteAgentAssignment.id.desc())
    )
    if assignment and assignment.agent and assignment.agent.is_active:
        return assignment.agent

    if site.owner and site.owner.is_active:
        return site.owner

    return db.scalar(select(User).where(User.role == "manager", User.is_active.is_(True)).order_by(User.id.asc()))


def _has_recent_auto_sos(db: Session, site_id: int) -> bool:
    cutoff = datetime.utcnow() - timedelta(minutes=settings.auto_critical_sos_cooldown_minutes)
    existing = db.scalar(
        select(EmergencyIncident.id).where(
            EmergencyIncident.site_id == site_id,
            EmergencyIncident.status.in_(["active", "accepted"]),
            EmergencyIncident.description.like(f"{AUTO_SENSOR_SOS_PREFIX}%"),
            EmergencyIncident.created_at >= cutoff,
        )
    )
    return existing is not None


def create_auto_sos_for_critical_alerts(db: Session, alerts: list[Alert]) -> EmergencyIncident | None:
    if not settings.auto_critical_sos_enabled:
        return None

    critical_alerts = [alert for alert in alerts if alert.severity == "critical" and alert.site]
    if not critical_alerts:
        return None

    site = critical_alerts[0].site
    if not site or _has_recent_auto_sos(db, site.id):
        return None

    triggered_by = _auto_trigger_user(db, site, critical_alerts)
    if triggered_by is None:
        logger.warning("Auto SOS skipped for site %s because no trigger user was available.", site.id)
        return None

    metrics = []
    seen_metrics: set[str] = set()
    for alert in critical_alerts:
        if alert.metric in seen_metrics:
            continue
        seen_metrics.add(alert.metric)
        metrics.append(
            f"{alert.metric}: {alert.actual_value:.2f} outside "
            f"{alert.threshold_min if alert.threshold_min is not None else '-'} to "
            f"{alert.threshold_max if alert.threshold_max is not None else '-'}"
        )

    incident = EmergencyIncident(
        site_id=site.id,
        triggered_by_user_id=triggered_by.id,
        priority="critical",
        description=(
            f"{AUTO_SENSOR_SOS_PREFIX} Critical sensor reading detected at {site.name}. "
            f"{'; '.join(metrics)}. Notifications were sent automatically."
        ),
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    notify_emergency_recipients(db, incident, triggered_by, include_triggered_by=True)
    return incident
