from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import EmergencyIncident, NotificationDelivery, Site, SiteAgentAssignment, User
from app.schemas import EmergencyCreate, EmergencyDetailOut, EmergencyOut, NotificationDeliveryOut
from app.services.emergency_notifications import notify_emergency_recipients


router = APIRouter(prefix="/emergencies", tags=["emergencies"])


@router.get("", response_model=list[EmergencyOut])
def list_emergencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "manager":
        q = select(EmergencyIncident)
    elif current_user.role == "owner":
        owner_site_ids = select(Site.id).where(Site.owner_user_id == current_user.id)
        owner_agent_ids = select(User.id).where(User.owner_user_id == current_user.id, User.role == "agent")
        q = select(EmergencyIncident).where(
            (EmergencyIncident.triggered_by_user_id == current_user.id)
            | (EmergencyIncident.site_id.in_(owner_site_ids))
            | (EmergencyIncident.triggered_by_user_id.in_(owner_agent_ids))
        )
    else:  # agent
        assigned_site_ids = select(SiteAgentAssignment.site_id).where(
            SiteAgentAssignment.agent_user_id == current_user.id,
            SiteAgentAssignment.is_active.is_(True),
        )
        q = select(EmergencyIncident).where(
            (EmergencyIncident.triggered_by_user_id == current_user.id)
            | (EmergencyIncident.site_id.in_(assigned_site_ids))
        )

    incidents = db.scalars(q.order_by(EmergencyIncident.created_at.desc()).limit(50)).all()
    return [EmergencyOut.model_validate(i) for i in incidents]


def emergency_query_for_user(current_user: User):
    if current_user.role == "manager":
        return select(EmergencyIncident)
    if current_user.role == "owner":
        owner_site_ids = select(Site.id).where(Site.owner_user_id == current_user.id)
        owner_agent_ids = select(User.id).where(User.owner_user_id == current_user.id, User.role == "agent")
        return select(EmergencyIncident).where(
            (EmergencyIncident.site_id.in_(owner_site_ids))
            | (EmergencyIncident.triggered_by_user_id.in_(owner_agent_ids))
        )

    assigned_site_ids = select(SiteAgentAssignment.site_id).where(
        SiteAgentAssignment.agent_user_id == current_user.id,
        SiteAgentAssignment.is_active.is_(True),
    )
    return select(EmergencyIncident).where(
        (EmergencyIncident.triggered_by_user_id == current_user.id)
        | (EmergencyIncident.site_id.in_(assigned_site_ids))
    )


def emergency_detail(db: Session, incident: EmergencyIncident) -> EmergencyDetailOut:
    payload = EmergencyOut.model_validate(incident).model_dump()
    deliveries = db.scalars(
        select(NotificationDelivery)
        .where(NotificationDelivery.emergency_id == incident.id)
        .order_by(NotificationDelivery.created_at.asc(), NotificationDelivery.id.asc())
    ).all()

    payload.update(
        {
            "triggered_by_name": incident.triggered_by.full_name if incident.triggered_by else None,
            "triggered_by_email": incident.triggered_by.email if incident.triggered_by else None,
            "triggered_by_role": incident.triggered_by.role if incident.triggered_by else None,
            "site_name": incident.site.name if incident.site else None,
            "owner_name": incident.site.owner.full_name if incident.site and incident.site.owner else None,
            "owner_email": incident.site.owner.email if incident.site and incident.site.owner else None,
            "accepted_by_name": incident.accepted_by.full_name if incident.accepted_by else None,
            "accepted_by_email": incident.accepted_by.email if incident.accepted_by else None,
            "deliveries": [NotificationDeliveryOut.model_validate(item) for item in deliveries],
        }
    )
    return EmergencyDetailOut(**payload)


def ensure_can_respond(current_user: User, incident: EmergencyIncident) -> None:
    if current_user.role == "manager":
        return
    if current_user.role == "owner" and incident.site and incident.site.owner_user_id == current_user.id:
        return
    if current_user.role == "owner" and incident.triggered_by and incident.triggered_by.owner_user_id == current_user.id:
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner or manager can respond to this SOS.")


@router.get("/details", response_model=list[EmergencyDetailOut])
def list_emergency_details(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incidents = db.scalars(
        emergency_query_for_user(current_user).order_by(EmergencyIncident.created_at.desc()).limit(100)
    ).all()
    if current_user.role == "owner":
        viewed_at = datetime.utcnow()
        changed = False
        for incident in incidents:
            belongs_to_owner = (
                (incident.site and incident.site.owner_user_id == current_user.id)
                or (incident.triggered_by and incident.triggered_by.owner_user_id == current_user.id)
            )
            if belongs_to_owner and incident.owner_viewed_at is None:
                incident.owner_viewed_at = viewed_at
                changed = True
        if changed:
            db.commit()
            for incident in incidents:
                db.refresh(incident)
    return [emergency_detail(db, incident) for incident in incidents]


@router.post("", response_model=EmergencyOut)
def create_emergency(
    payload: EmergencyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "agent":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only agents can trigger SOS emergencies.")

    if payload.site_id is not None:
        site = db.scalar(select(Site).where(Site.id == payload.site_id))
        if not site:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

        if current_user.role == "agent":
            assignment = db.scalar(
                select(SiteAgentAssignment).where(
                    SiteAgentAssignment.site_id == payload.site_id,
                    SiteAgentAssignment.agent_user_id == current_user.id,
                    SiteAgentAssignment.is_active.is_(True),
                )
            )
            if not assignment:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only trigger SOS for assigned sites.")
        elif current_user.role == "owner" and site.owner_user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only trigger SOS for your own sites.")

    incident = EmergencyIncident(
        site_id=payload.site_id,
        triggered_by_user_id=current_user.id,
        priority=payload.priority,
        description=payload.description,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    notify_emergency_recipients(db, incident, current_user)

    return EmergencyOut.model_validate(incident)


@router.put("/{incident_id}/resolve", response_model=EmergencyOut)
def resolve_emergency(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incident = db.scalar(select(EmergencyIncident).where(EmergencyIncident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    ensure_can_respond(current_user, incident)

    incident.status = "resolved"
    incident.resolved_by_user_id = current_user.id
    incident.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    return EmergencyOut.model_validate(incident)


@router.put("/{incident_id}/accept", response_model=EmergencyDetailOut)
def accept_emergency(
    incident_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incident = db.scalar(select(EmergencyIncident).where(EmergencyIncident.id == incident_id))
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incident not found")
    ensure_can_respond(current_user, incident)

    incident.status = "accepted"
    incident.accepted_by_user_id = current_user.id
    incident.accepted_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    return emergency_detail(db, incident)
