from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import AgentContact, Site, SiteAgentAssignment, User, UserSetting
from app.schemas import AgentContactCreate, AgentContactOut, AgentContactUpdate, UserSettingOut, UserSettingUpdate


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=UserSettingOut)
def get_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = db.scalar(select(UserSetting).where(UserSetting.user_id == current_user.id))
    if not setting:
        setting = UserSetting(
            user_id=current_user.id,
            profile_json={"full_name": current_user.full_name, "email": current_user.email, "phone": current_user.phone, "role": current_user.role},
            notification_prefs={"email_alerts": True, "sms_alerts": False, "push_alerts": True, "weekly_report": True},
            alert_thresholds={"ph_min": 6.5, "ph_max": 8.5, "temp_min": 20.0, "temp_max": 35.0, "turbidity_max": 50.0},
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return UserSettingOut.model_validate(setting)


@router.put("", response_model=UserSettingOut)
def update_settings(
    payload: UserSettingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    setting = db.scalar(select(UserSetting).where(UserSetting.user_id == current_user.id))
    if not setting:
        setting = UserSetting(user_id=current_user.id)
        db.add(setting)

    if payload.profile_json is not None:
        setting.profile_json = payload.profile_json
        if "full_name" in payload.profile_json and payload.profile_json["full_name"]:
            current_user.full_name = payload.profile_json["full_name"]
        if "email" in payload.profile_json and payload.profile_json["email"]:
            current_user.email = payload.profile_json["email"]
        if "phone" in payload.profile_json:
            current_user.phone = payload.profile_json["phone"]
    if payload.notification_prefs is not None:
        setting.notification_prefs = payload.notification_prefs
    if payload.alert_thresholds is not None:
        setting.alert_thresholds = payload.alert_thresholds

    db.commit()
    db.refresh(setting)
    return UserSettingOut.model_validate(setting)


@router.get("/contacts", response_model=list[AgentContactOut])
def list_contacts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contacts: list[dict] = []
    owner = current_user.owner
    if current_user.role == "agent" and not owner:
        owner = db.scalar(
            select(User)
            .join(Site, Site.owner_user_id == User.id)
            .join(SiteAgentAssignment, SiteAgentAssignment.site_id == Site.id)
            .where(
                SiteAgentAssignment.agent_user_id == current_user.id,
                SiteAgentAssignment.is_active.is_(True),
            )
        )

    if current_user.role == "agent" and owner:
        contacts.append(
            {
                "id": 0,
                "name": owner.full_name,
                "email": owner.email,
                "phone": owner.phone,
                "tag": "Owner Contact",
                "readonly": True,
            }
        )

    rows = db.scalars(
        select(AgentContact)
        .where(AgentContact.agent_user_id == current_user.id)
        .order_by(AgentContact.created_at.desc())
    ).all()
    contacts.extend(
        {
            "id": contact.id,
            "name": contact.name,
            "email": contact.email,
            "phone": contact.phone,
            "tag": contact.tag,
            "readonly": False,
        }
        for contact in rows
    )
    return contacts


@router.post("/contacts", response_model=AgentContactOut)
def create_contact(
    payload: AgentContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = AgentContact(
        agent_user_id=current_user.id,
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        tag=payload.tag or "Added Contact",
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return AgentContactOut(id=contact.id, name=contact.name, email=contact.email, phone=contact.phone, tag=contact.tag, readonly=False)


@router.put("/contacts/{contact_id}", response_model=AgentContactOut)
def update_contact(
    contact_id: int,
    payload: AgentContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.scalar(select(AgentContact).where(AgentContact.id == contact_id, AgentContact.agent_user_id == current_user.id))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    if payload.name is not None:
        contact.name = payload.name
    if payload.email is not None:
        contact.email = payload.email
    if payload.phone is not None:
        contact.phone = payload.phone
    if payload.tag is not None:
        contact.tag = payload.tag
    db.commit()
    db.refresh(contact)
    return AgentContactOut(id=contact.id, name=contact.name, email=contact.email, phone=contact.phone, tag=contact.tag, readonly=False)


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    contact = db.scalar(select(AgentContact).where(AgentContact.id == contact_id, AgentContact.agent_user_id == current_user.id))
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted successfully"}
