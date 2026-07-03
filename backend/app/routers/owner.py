from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select, delete
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db import get_db
from app.deps import require_role
from app.models import Alert, Device, DeviceOwnerAssignment, DeviceSiteAssignment, FarmType, Reading, Site, SiteAgentAssignment, Species, User
from app.schemas import (
    AgentCreate,
    AssignAgentRequest,
    AssignSiteRequest,
    DeviceOut,
    SiteCreate,
    SiteOut,
    UserOut,
)


router = APIRouter(prefix="/owner", tags=["owner"])


@router.get("/overview")
def owner_overview(
    current_user: User = Depends(require_role("owner")),
    db: Session = Depends(get_db),
):
    devices = db.scalars(select(Device).where(Device.owner_user_id == current_user.id).order_by(Device.created_at.desc())).all()
    sites = db.scalars(select(Site).where(Site.owner_user_id == current_user.id).order_by(Site.created_at.desc())).all()
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

    return {
        "owner": UserOut.model_validate(current_user),
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
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    farm_type = db.scalar(select(FarmType).where(FarmType.id == payload.farm_type_id))
    species = db.scalar(select(Species).where(Species.id == payload.species_id))
    if not farm_type or not species or species.farm_type_id != farm_type.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid farm type or species")

    agent = User(
        role="agent",
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        owner_user_id=current_user.id,
        created_by_id=current_user.id,
        farm_type_id=farm_type.id,
        species_id=species.id,
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
    farm_type = db.scalar(select(FarmType).where(FarmType.id == payload.farm_type_id))
    species = db.scalar(select(Species).where(Species.id == payload.species_id))
    if not farm_type or not species or species.farm_type_id != farm_type.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid farm type or species")

    site = Site(
        owner_user_id=current_user.id,
        name=payload.name,
        site_type=payload.site_type,
        location_text=payload.location_text,
        farm_type_id=payload.farm_type_id,
        species_id=payload.species_id,
        custom_thresholds=payload.custom_thresholds,
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
    sites = db.scalars(select(Site).where(Site.owner_user_id == current_user.id).order_by(Site.created_at.desc())).all()
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

    if agent.farm_type_id != site.farm_type_id or agent.species_id != site.species_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent farming/species must match the site farming/species",
        )

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


from pydantic import BaseModel, EmailStr

class AgentUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    password: str | None = None

class SiteUpdate(BaseModel):
    name: str | None = None
    site_type: str | None = None
    location_text: str | None = None

class DeviceUpdatePayload(BaseModel):
    firmware_version: str | None = None
    status: str | None = None


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
    db.execute(delete(Alert).where(Alert.recipient_user_id == agent.id))
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
        agent.email = payload.email
    if payload.phone is not None:
        agent.phone = payload.phone
    if payload.password is not None:
        agent.password_hash = hash_password(payload.password)
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
    db.execute(delete(Alert).where(Alert.device_id == device.id))
    db.execute(delete(Reading).where(Reading.device_id == device.id))
    db.execute(delete(DeviceSiteAssignment).where(DeviceSiteAssignment.device_id == device.id))
    db.execute(delete(DeviceOwnerAssignment).where(DeviceOwnerAssignment.device_id == device.id))
    # Unassign owner and site
    device.owner_user_id = None
    device.site_id = None
    device.status = "inactive"
    db.commit()
    return {"message": "Device unassigned and deleted from owner successfully"}

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
