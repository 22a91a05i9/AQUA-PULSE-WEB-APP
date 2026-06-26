from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import EmergencyIncident, SiteAgentAssignment, User
from app.schemas import EmergencyCreate, EmergencyOut


router = APIRouter(prefix="/emergencies", tags=["emergencies"])


@router.get("", response_model=list[EmergencyOut])
def list_emergencies(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role == "manager":
        q = select(EmergencyIncident)
    elif current_user.role == "owner":
        from app.models import Site
        owner_site_ids = select(Site.id).where(Site.owner_user_id == current_user.id)
        q = select(EmergencyIncident).where(
            (EmergencyIncident.triggered_by_user_id == current_user.id)
            | (EmergencyIncident.site_id.in_(owner_site_ids))
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


@router.post("", response_model=EmergencyOut)
def create_emergency(
    payload: EmergencyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    incident = EmergencyIncident(
        site_id=payload.site_id,
        triggered_by_user_id=current_user.id,
        priority=payload.priority,
        description=payload.description,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
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

    incident.status = "resolved"
    incident.resolved_by_user_id = current_user.id
    incident.resolved_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    return EmergencyOut.model_validate(incident)
