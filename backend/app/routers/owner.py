from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, or_, select, update
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db import get_db
from app.deps import require_role
from app.models import (
    AgentContact,
    Alert,
    Device,
    DeviceOwnerAssignment,
    DeviceSiteAssignment,
    EmergencyIncident,
    FarmType,
    NotificationDelivery,
    PasswordResetToken,
    PushSubscription,
    Reading,
    Report,
    ReportSchedule,
    Site,
    SiteAgentAssignment,
    Species,
    User,
    UserSetting,
)
from app.schemas import (
    AgentCreate,
    AssignAgentRequest,
    AssignSiteRequest,
    DeviceOut,
    SiteCreate,
    SiteOut,
    UserOut,
    validate_password_policy,
)


router = APIRouter(prefix="/owner", tags=["owner"])


@router.get("/overview")
def owner_overview(
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    devices = db.scalars(select(Device).where(Device.owner_user_id == current_user.id).order_by(Device.created_at.desc())).all()
    sites = db.scalars(select(Site).where(Site.owner_user_id == current_user.id).order_by(Site.id.asc())).all()
    agents = db.scalars(select(User).where(User.owner_user_id == current_user.id, User.role == "agent")).all()
    agent_assignments = db.scalars(
        select(SiteAgentAssignment)
        .where(SiteAgentAssignment.assigned_by_owner_id == current_user.id, SiteAgentAssignment.is_active.is_(True))
    ).all()
    alerts = db.scalars(
        select(Alert).where(Alert.recipient_user_id == current_user.id).order_by(Alert.created_at.desc()).limit(10)
    ).all()
    readings = db.scalars(
        select(Reading)
        .join(Device, Reading.device_id == Device.id)
        .outerjoin(Site, Reading.site_id == Site.id)
        .where(or_(Device.owner_user_id == current_user.id, Site.owner_user_id == current_user.id))
        .order_by(Reading.collected_at.desc())
        .limit(10)
    ).all()

    devices_data = []
    for d in devices:
        latest_reading = db.scalar(
            select(Reading)
            .where(Reading.device_id == d.id)
            .order_by(Reading.collected_at.desc())
            .limit(1)
        )
        d_dict = DeviceOut.model_validate(d).model_dump()
        if latest_reading:
            d_dict["latest_reading"] = {
                "temperature_c": latest_reading.temperature_c,
                "ph": latest_reading.ph,
                "turbidity": latest_reading.turbidity,
                "ammonia": latest_reading.ammonia,
                "dissolved_oxygen": latest_reading.dissolved_oxygen,
                "nitrate": latest_reading.nitrate,
                "salinity": latest_reading.salinity,
                "electric_conductivity": latest_reading.electric_conductivity,
                "collected_at": latest_reading.collected_at.isoformat(),
                "battery_v": latest_reading.battery_v,
                "signal_dbm": latest_reading.signal_dbm,
            }
        else:
            d_dict["latest_reading"] = None
        devices_data.append(d_dict)

    owner_dict = UserOut.model_validate(current_user).model_dump()
    owner_setting = db.scalar(select(UserSetting).where(UserSetting.user_id == current_user.id))
    owner_dict["profile_json"] = owner_setting.profile_json if owner_setting else None

    return {
        "owner": owner_dict,
        "stats": {
            "devices": len(devices),
            "sites": len(sites),
            "agents": len(agents),
            "open_alerts": db.scalar(
                select(func.count()).select_from(Alert).where(
                    Alert.recipient_user_id == current_user.id,
                    Alert.status == "open",
                )
            )
            or 0,
        },
        "devices": devices_data,
        "sites": [SiteOut.model_validate(item).model_dump() for item in sites],
        "agents": [UserOut.model_validate(item).model_dump() for item in agents],
        "alerts": [
            {
                "id": item.id,
                "site_id": item.site_id,
                "metric": item.metric,
                "severity": item.severity,
                "title": item.title,
                "message": item.message,
                "status": item.status,
                "created_at": item.created_at,
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
                "collected_at": item.collected_at,
            }
            for item in readings
        ],
        "agent_assignments": [
            {
                "id": item.id,
                "site_id": item.site_id,
                "agent_user_id": item.agent_user_id,
            }
            for item in agent_assignments
        ],
    }


@router.post("/agents", response_model=UserOut)
def create_agent(
    payload: AgentCreate,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    normalized_email = payload.email.strip().lower()
    existing = db.scalar(select(User).where(func.lower(func.trim(User.email)) == normalized_email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
    phone = validate_agent_phone(db, payload.phone)

    agent = User(
        role="agent",
        full_name=payload.full_name,
        email=normalized_email,
        phone=phone,
        password_hash=hash_password(payload.password),
        owner_user_id=current_user.id,
        created_by_id=current_user.id,
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    return UserOut.model_validate(agent)


@router.get("/agents", response_model=list[UserOut])
def list_agents(
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    agents = db.scalars(select(User).where(User.owner_user_id == current_user.id, User.role == "agent")).all()
    return [UserOut.model_validate(item) for item in agents]


@router.post("/sites", response_model=SiteOut)
def create_site(
    payload: SiteCreate,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    existing_site = db.scalar(
        select(Site).where(
            Site.owner_user_id == current_user.id,
            func.lower(func.trim(Site.name)) == payload.name.strip().lower(),
            func.lower(func.trim(func.coalesce(Site.location_text, ""))) == (payload.location_text or "").strip().lower(),
        )
    )
    if existing_site:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Site already created.")

    site_type = normalize_create_site_type(payload.site_type)
    if site_type == "swimming_pool":
        farm_type = db.scalar(select(FarmType).where(FarmType.code == "general"))
        if not farm_type:
            farm_type = FarmType(code="general", name="General")
            db.add(farm_type)
            db.flush()
        species = db.scalar(
            select(Species).where(
                Species.farm_type_id == farm_type.id,
                Species.name == "Swimming Pool",
            )
        )
        if not species:
            species = Species(
                farm_type_id=farm_type.id,
                name="Swimming Pool",
                scientific_name=None,
                default_thresholds={
                    "ph": {"min": 7.2, "max": 7.8},
                    "temperature_c": {"min": 20.0, "max": 32.0},
                    "turbidity": {"min": 0.0, "max": 10.0},
                },
            )
            db.add(species)
            db.flush()
    if site_type == "pond":
        if payload.farm_type_id is None or payload.species_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Select farm type and species for pond sites",
            )
        farm_type = db.scalar(select(FarmType).where(FarmType.id == payload.farm_type_id))
        species = db.scalar(select(Species).where(Species.id == payload.species_id))
        if not farm_type or not species or species.farm_type_id != farm_type.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid farm type or species")

    site = Site(
        owner_user_id=current_user.id,
        name=payload.name,
        site_type=site_type,
        location_text=payload.location_text,
        farm_type_id=farm_type.id,
        species_id=species.id,
        custom_thresholds=normalize_site_area(payload.custom_thresholds),
    )
    db.add(site)
    db.commit()
    db.refresh(site)
    return SiteOut.model_validate(site)


@router.get("/sites", response_model=list[SiteOut])
def list_sites(
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    sites = db.scalars(select(Site).where(Site.owner_user_id == current_user.id).order_by(Site.id.asc())).all()
    return [SiteOut.model_validate(item) for item in sites]


@router.post("/devices/{device_id}/assign-site", response_model=DeviceOut)
def assign_device_to_site(
    device_id: int,
    payload: AssignSiteRequest,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    device = db.scalar(select(Device).where(Device.id == device_id, Device.owner_user_id == current_user.id))
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found for this owner")

    site = db.scalar(select(Site).where(Site.id == payload.site_id, Site.owner_user_id == current_user.id))
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    active_assignments = db.scalars(
        select(DeviceSiteAssignment).where(
            DeviceSiteAssignment.device_id == device.id,
            DeviceSiteAssignment.is_active.is_(True),
        )
    ).all()
    for assignment in active_assignments:
        assignment.is_active = False
        assignment.unassigned_at = datetime.utcnow()

    device.site_id = site.id
    db.add(DeviceSiteAssignment(device_id=device.id, site_id=site.id))
    db.commit()
    db.refresh(device)
    return DeviceOut.model_validate(device)


@router.post("/sites/{site_id}/assign-agent")
def assign_agent_to_site(
    site_id: int,
    payload: AssignAgentRequest,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    site = db.scalar(select(Site).where(Site.id == site_id, Site.owner_user_id == current_user.id))
    if not site:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found")

    agent = db.scalar(
        select(User).where(
            User.id == payload.agent_user_id,
            User.owner_user_id == current_user.id,
            User.role == "agent",
        )
    )
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")

    existing = db.scalar(
        select(SiteAgentAssignment).where(
            SiteAgentAssignment.site_id == site.id,
            SiteAgentAssignment.agent_user_id == agent.id,
            SiteAgentAssignment.is_active.is_(True),
        )
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Agent already assigned to this site")

    assignment = SiteAgentAssignment(
        site_id=site.id,
        agent_user_id=agent.id,
        assigned_by_owner_id=current_user.id,
    )
    db.add(assignment)
    db.commit()
    return {"message": "Agent assigned successfully"}


from pydantic import BaseModel, EmailStr, field_validator

PHONE_PATTERN = re.compile(r"^\d{10}$")
AREA_PATTERN = re.compile(r"^(\d+(?:\.\d+)?)\s*acres?$", re.IGNORECASE)
SITE_TYPE_ALIASES = {
    "pond": "pond",
    "swimming_pool": "swimming_pool",
    "swimming pool": "swimming_pool",
    "pool": "swimming_pool",
}


def validate_agent_phone(db: Session, phone: str | None, exclude_user_id: int | None = None) -> str:
    normalized = (phone or "").strip()
    if not PHONE_PATTERN.fullmatch(normalized):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter a valid 10-digit phone number.")
    duplicate_query = select(User).where(User.phone == normalized)
    if exclude_user_id is not None:
        duplicate_query = duplicate_query.where(User.id != exclude_user_id)
    if db.scalar(duplicate_query):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already exists.")
    return normalized


def normalize_site_area(custom_thresholds: dict | None) -> dict | None:
    if not custom_thresholds or "area" not in custom_thresholds:
        return custom_thresholds
    area_text = str(custom_thresholds.get("area") or "").strip()
    match = AREA_PATTERN.fullmatch(area_text)
    if not match:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter farming area in acres, for example 4.0 acres or 40 acres.",
        )
    acres = float(match.group(1))
    if acres <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Farming area must be greater than 0 acres.",
        )
    return {**custom_thresholds, "area": f"{acres:.1f} acres"}


def normalize_create_site_type(site_type: str) -> str:
    normalized = site_type.strip().lower().replace("-", "_")
    resolved = SITE_TYPE_ALIASES.get(normalized)
    if not resolved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Site type must be Pond or Swimming Pool.",
        )
    return resolved

class AgentUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def validate_lowercase_email(cls, value: str | None) -> str | None:
        if value is None:
            return value
        email = str(value).strip()
        if email != email.lower():
            raise ValueError("Email must be lowercase")
        return email


class OwnerProfileUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    profile_json: dict | None = None

class SiteUpdate(BaseModel):
    name: str | None = None
    site_type: str | None = None
    location_text: str | None = None

class DeviceUpdatePayload(BaseModel):
    firmware_version: str | None = None
    status: str | None = None


@router.put("/profile")
def update_owner_profile(
    payload: OwnerProfileUpdate,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    if payload.email is not None and payload.email != current_user.email:
        existing_email = db.scalar(select(User).where(User.email == payload.email, User.id != current_user.id))
        if existing_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
        current_user.email = payload.email
    if payload.full_name is not None:
        current_user.full_name = payload.full_name
    if payload.phone is not None:
        current_user.phone = validate_agent_phone(db, payload.phone, exclude_user_id=current_user.id)
    if payload.profile_json is not None:
        setting = db.scalar(select(UserSetting).where(UserSetting.user_id == current_user.id))
        if not setting:
            setting = UserSetting(user_id=current_user.id)
            db.add(setting)
        setting.profile_json = {
            **(setting.profile_json or {}),
            **payload.profile_json,
        }
    db.commit()
    db.refresh(current_user)
    result = UserOut.model_validate(current_user).model_dump()
    if payload.profile_json is not None:
        result["profile_json"] = payload.profile_json
    return result


@router.delete("/agents/{agent_id}")
def delete_agent(
    agent_id: int,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    agent = db.scalar(
        select(User).where(
            User.id == agent_id,
            User.owner_user_id == current_user.id,
            User.role == "agent",
        )
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    agent_alert_ids = select(Alert.id).where(or_(Alert.recipient_user_id == agent.id, Alert.agent_user_id == agent.id))
    agent_emergency_ids = select(EmergencyIncident.id).where(
        or_(
            EmergencyIncident.triggered_by_user_id == agent.id,
            EmergencyIncident.accepted_by_user_id == agent.id,
            EmergencyIncident.resolved_by_user_id == agent.id,
        )
    )

    db.execute(
        delete(NotificationDelivery).where(
            or_(
                NotificationDelivery.recipient_user_id == agent.id,
                NotificationDelivery.alert_id.in_(agent_alert_ids),
                NotificationDelivery.emergency_id.in_(agent_emergency_ids),
            )
        )
    )
    db.execute(delete(Alert).where(or_(Alert.recipient_user_id == agent.id, Alert.agent_user_id == agent.id)))
    db.execute(
        update(EmergencyIncident)
        .where(EmergencyIncident.accepted_by_user_id == agent.id)
        .values(accepted_by_user_id=None, accepted_at=None)
    )
    db.execute(
        update(EmergencyIncident)
        .where(EmergencyIncident.resolved_by_user_id == agent.id)
        .values(resolved_by_user_id=None)
    )
    db.execute(delete(EmergencyIncident).where(EmergencyIncident.triggered_by_user_id == agent.id))
    db.execute(delete(AgentContact).where(AgentContact.agent_user_id == agent.id))
    db.execute(delete(PushSubscription).where(PushSubscription.user_id == agent.id))
    db.execute(delete(ReportSchedule).where(ReportSchedule.user_id == agent.id))
    db.execute(delete(Report).where(Report.user_id == agent.id))
    db.execute(delete(PasswordResetToken).where(PasswordResetToken.user_id == agent.id))
    db.execute(delete(UserSetting).where(UserSetting.user_id == agent.id))
    db.execute(delete(SiteAgentAssignment).where(SiteAgentAssignment.agent_user_id == agent.id))
    db.delete(agent)
    db.commit()
    return {"message": "Agent deleted successfully"}

@router.put("/agents/{agent_id}")
def update_agent(
    agent_id: int,
    payload: AgentUpdate,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    agent = db.scalar(
        select(User).where(
            User.id == agent_id,
            User.owner_user_id == current_user.id,
            User.role == "agent",
        )
    )
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if payload.full_name is not None:
        agent.full_name = payload.full_name
    if payload.email is not None:
        normalized_email = payload.email.strip().lower()
        duplicate_email = db.scalar(
            select(User).where(
                func.lower(func.trim(User.email)) == normalized_email,
                User.id != agent.id,
            )
        )
        if duplicate_email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")
        agent.email = normalized_email
    if payload.phone is not None:
        agent.phone = validate_agent_phone(db, payload.phone, exclude_user_id=agent.id)
    if payload.password is not None:
        try:
            validated_password = validate_password_policy(payload.password)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
        agent.password_hash = hash_password(validated_password or payload.password)
    db.commit()
    db.refresh(agent)
    return UserOut.model_validate(agent)

@router.delete("/sites/{site_id}")
def delete_site(
    site_id: int,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    site = db.scalar(
        select(Site).where(
            Site.id == site_id,
            Site.owner_user_id == current_user.id,
        )
    )
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    db.execute(delete(Alert).where(Alert.site_id == site.id))
    db.execute(delete(Reading).where(Reading.site_id == site.id))
    db.execute(delete(DeviceSiteAssignment).where(DeviceSiteAssignment.site_id == site.id))
    db.execute(delete(SiteAgentAssignment).where(SiteAgentAssignment.site_id == site.id))
    db.delete(site)
    db.commit()
    return {"message": "Site deleted successfully"}

@router.put("/sites/{site_id}")
def update_site(
    site_id: int,
    payload: SiteUpdate,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    site = db.scalar(
        select(Site).where(
            Site.id == site_id,
            Site.owner_user_id == current_user.id,
        )
    )
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    if payload.name is not None:
        site.name = payload.name
    if payload.site_type is not None:
        site.site_type = payload.site_type
    if payload.location_text is not None:
        site.location_text = payload.location_text
    db.commit()
    db.refresh(site)
    return SiteOut.model_validate(site)

@router.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    device = db.scalar(
        select(Device).where(
            Device.id == device_id,
            Device.owner_user_id == current_user.id,
        )
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    db.execute(delete(DeviceSiteAssignment).where(DeviceSiteAssignment.device_id == device.id))
    db.execute(delete(DeviceOwnerAssignment).where(DeviceOwnerAssignment.device_id == device.id))
    # Keep readings and alerts as historical data; only remove active ownership/site links.
    device.owner_user_id = None
    device.site_id = None
    device.status = "inactive"
    db.commit()
    return {"message": "Device unassigned successfully. Historical readings were preserved."}

@router.put("/devices/{device_id}")
def update_device(
    device_id: int,
    payload: DeviceUpdatePayload,
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    device = db.scalar(
        select(Device).where(
            Device.id == device_id,
            Device.owner_user_id == current_user.id,
        )
    )
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    if payload.firmware_version is not None:
        device.firmware_version = payload.firmware_version
    if payload.status is not None:
        device.status = payload.status
    db.commit()
    db.refresh(device)
    return DeviceOut.model_validate(device)
