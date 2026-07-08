from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db import get_db
from app.deps import require_role
from app.models import (
    Alert,
    Device,
    DeviceOwnerAssignment,
    DeviceSensorAssignment,
    DeviceSiteAssignment,
    Reading,
    Report,
    Site,
    SiteAgentAssignment,
    User,
    UserSetting,
)
from app.schemas import (
    AlertOut,
    AssignOwnerRequest,
    DeviceCreate,
    DeviceOut,
    DeviceUpdate,
    OwnerCreate,
    OwnerUpdate,
    UserOut,
)


router = APIRouter(prefix="/manager", tags=["manager"])

PHONE_PATTERN = re.compile(r"^\d{10}$")
GMAIL_PATTERN = re.compile(r"^[^\s@]+@gmail\.com$", re.IGNORECASE)
DEVICE_UID_PATTERN = re.compile(r"^\d+$")
IMEI_PATTERN = re.compile(r"^\d{1,10}$")
SIM_PATTERN = re.compile(r"^\d{10}$")
DEVICE_VERSIONS = {"1.0", "2.0", "3.0", "4.0"}


def validate_owner_contact(db: Session, email: str, phone: str | None, owner_id: int | None = None) -> None:
    normalized_email = email.strip().lower()
    normalized_phone = (phone or "").strip()
    if not GMAIL_PATTERN.fullmatch(normalized_email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter a valid @gmail.com email address.")
    if not PHONE_PATTERN.fullmatch(normalized_phone):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please enter a valid 10-digit phone number.")

    email_query = select(User).where(func.lower(User.email) == normalized_email)
    phone_query = select(User).where(User.phone == normalized_phone)
    if owner_id is not None:
        email_query = email_query.where(User.id != owner_id)
        phone_query = phone_query.where(User.id != owner_id)

    if db.scalar(email_query):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists.")
    if db.scalar(phone_query):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone number already exists.")


def validate_device_payload(db: Session, payload: DeviceCreate, device_id: int | None = None) -> None:
    required_values = [
        payload.device_uid,
        payload.firmware_version,
        payload.status,
        payload.imei,
        payload.sim_number,
    ]
    if any(not str(value or "").strip() for value in required_values):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please fill all required fields.")
    if not DEVICE_UID_PATTERN.fullmatch(payload.device_uid):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Device ID must contain numbers only.")
    if not IMEI_PATTERN.fullmatch(payload.imei or ""):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="IMEI Number must contain numbers only, up to 10 digits.")
    if not SIM_PATTERN.fullmatch(payload.sim_number or ""):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SIM Number must be exactly 10 digits.")
    if payload.firmware_version not in DEVICE_VERSIONS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Device type must be one of: 1.0, 2.0, 3.0, 4.0.")

    duplicate_queries = [
        (select(Device).where(Device.device_uid == payload.device_uid), "Device ID already exists."),
        (select(Device).where(Device.imei == payload.imei), "IMEI Number already exists."),
        (select(Device).where(Device.sim_number == payload.sim_number), "SIM Number already exists."),
    ]
    for query, detail in duplicate_queries:
        if device_id is not None:
            query = query.where(Device.id != device_id)
        if db.scalar(query):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)


def replace_device_sensors(db: Session, device: Device, sensor_type_ids: list[int]) -> None:
    db.execute(delete(DeviceSensorAssignment).where(DeviceSensorAssignment.device_id == device.id))
    db.flush()
    for sensor_type_id in sensor_type_ids:
        db.add(DeviceSensorAssignment(device_id=device.id, sensor_type_id=sensor_type_id))


def device_out(device: Device) -> DeviceOut:
    return DeviceOut.model_validate(device)


def manager_alerts_from_table(db: Session) -> list[Alert]:
    return db.scalars(
        select(Alert)
        .order_by(Alert.created_at.desc(), Alert.id.desc())
    ).all()


@router.get("/overview")
def manager_overview(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    owner_count = db.scalar(select(func.count()).select_from(User).where(User.role == "owner")) or 0
    agent_count = db.scalar(select(func.count()).select_from(User).where(User.role == "agent")) or 0
    device_count = db.scalar(select(func.count()).select_from(Device)) or 0
    site_count = db.scalar(select(func.count()).select_from(Site)) or 0
    open_alert_count = db.scalar(select(func.count()).select_from(Alert).where(Alert.status == "open")) or 0

    owners = db.scalars(select(User).where(User.role == "owner").order_by(User.created_at.desc())).all()
    devices = db.scalars(select(Device).order_by(Device.created_at.desc())).all()
    alerts = manager_alerts_from_table(db)[:10]

    return {
        "manager": UserOut.model_validate(current_user),
        "stats": {
            "owners": owner_count,
            "agents": agent_count,
            "devices": device_count,
            "sites": site_count,
            "open_alerts": open_alert_count,
        },
        "owners": [UserOut.model_validate(item).model_dump() for item in owners],
        "devices": [device_out(item).model_dump() for item in devices],
        "alerts": [AlertOut.model_validate(item).model_dump() for item in alerts],
    }


@router.get("/alerts", response_model=list[AlertOut])
def list_owner_device_alerts(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    alerts = manager_alerts_from_table(db)
    return [AlertOut.model_validate(item) for item in alerts]


@router.post("/owners", response_model=UserOut)
def create_owner(
    payload: OwnerCreate,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    validate_owner_contact(db, payload.email, payload.phone)

    owner = User(
        role="owner",
        full_name=payload.full_name,
        email=payload.email.strip().lower(),
        phone=(payload.phone or "").strip(),
        password_hash=hash_password(payload.password),
        created_by_id=current_user.id,
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return UserOut.model_validate(owner)


@router.get("/owners", response_model=list[UserOut])
def list_owners(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    owners = db.scalars(select(User).where(User.role == "owner").order_by(User.created_at.desc())).all()
    return [UserOut.model_validate(item) for item in owners]


@router.put("/owners/{owner_id}", response_model=UserOut)
def update_owner(
    owner_id: int,
    payload: OwnerUpdate,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    owner = db.scalar(select(User).where(User.id == owner_id, User.role == "owner"))
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")

    validate_owner_contact(db, payload.email, payload.phone, owner_id)

    owner.full_name = payload.full_name
    owner.email = payload.email.strip().lower()
    owner.phone = (payload.phone or "").strip()
    if payload.password:
        owner.password_hash = hash_password(payload.password)
    db.commit()
    db.refresh(owner)
    return UserOut.model_validate(owner)


@router.delete("/owners/{owner_id}")
def delete_owner(
    owner_id: int,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    owner = db.scalar(select(User).where(User.id == owner_id, User.role == "owner"))
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")

    agent_ids = db.scalars(select(User.id).where(User.owner_user_id == owner_id, User.role == "agent")).all()
    site_ids = db.scalars(select(Site.id).where(Site.owner_user_id == owner_id)).all()
    device_ids = db.scalars(select(Device.id).where(Device.owner_user_id == owner_id)).all()
    user_ids = [owner_id, *agent_ids]

    db.execute(delete(Alert).where(or_(Alert.owner_user_id == owner_id, Alert.recipient_user_id.in_(user_ids), Alert.agent_user_id.in_(agent_ids), Alert.device_id.in_(device_ids), Alert.site_id.in_(site_ids))))
    db.execute(delete(Reading).where(or_(Reading.device_id.in_(device_ids), Reading.site_id.in_(site_ids))))
    db.execute(delete(DeviceSiteAssignment).where(or_(DeviceSiteAssignment.device_id.in_(device_ids), DeviceSiteAssignment.site_id.in_(site_ids))))
    db.execute(delete(DeviceOwnerAssignment).where(or_(DeviceOwnerAssignment.device_id.in_(device_ids), DeviceOwnerAssignment.owner_user_id == owner_id)))
    db.execute(delete(SiteAgentAssignment).where(or_(SiteAgentAssignment.site_id.in_(site_ids), SiteAgentAssignment.agent_user_id.in_(agent_ids))))
    db.execute(delete(Device).where(Device.id.in_(device_ids)))
    db.execute(delete(Site).where(Site.id.in_(site_ids)))
    db.execute(delete(Report).where(Report.user_id.in_(user_ids)))
    db.execute(delete(UserSetting).where(UserSetting.user_id.in_(user_ids)))
    db.execute(delete(User).where(User.id.in_(agent_ids)))
    db.delete(owner)
    db.commit()
    return {"message": "Owner deleted successfully"}


@router.post("/devices", response_model=DeviceOut)
def create_device(
    payload: DeviceCreate,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    validate_device_payload(db, payload)

    device = Device(
        device_uid=payload.device_uid,
        imei=payload.imei,
        sim_number=payload.sim_number,
        gsm_number=payload.gsm_number,
        firmware_version=payload.firmware_version,
        status=payload.status,
        created_by_manager_id=current_user.id,
    )
    db.add(device)
    db.flush()
    replace_device_sensors(db, device, payload.sensor_type_ids)
    db.commit()
    db.refresh(device)
    return device_out(device)


@router.get("/devices", response_model=list[DeviceOut])
def list_devices(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    devices = db.scalars(select(Device).order_by(Device.created_at.desc())).all()
    return [device_out(item) for item in devices]


@router.put("/devices/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: int,
    payload: DeviceUpdate,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    validate_device_payload(db, payload, device_id)

    device.device_uid = payload.device_uid
    device.imei = payload.imei
    device.sim_number = payload.sim_number
    device.gsm_number = payload.gsm_number
    device.firmware_version = payload.firmware_version
    device.status = payload.status
    replace_device_sensors(db, device, payload.sensor_type_ids)
    db.commit()
    db.refresh(device)
    return device_out(device)


@router.delete("/devices/{device_id}")
def delete_device(
    device_id: int,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    db.execute(delete(DeviceSensorAssignment).where(DeviceSensorAssignment.device_id == device_id))
    db.execute(delete(DeviceSiteAssignment).where(DeviceSiteAssignment.device_id == device_id))
    db.execute(delete(DeviceOwnerAssignment).where(DeviceOwnerAssignment.device_id == device_id))
    # Preserve historical readings and alerts. The delete action retires the device
    # from active use instead of hard-deleting records referenced by history.
    device.owner_user_id = None
    device.site_id = None
    device.status = "inactive"
    db.commit()
    return {"message": "Device deactivated successfully. Historical readings were preserved."}


@router.post("/devices/{device_id}/assign-owner", response_model=DeviceOut)
def assign_device_to_owner(
    device_id: int,
    payload: AssignOwnerRequest,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    device = db.scalar(select(Device).where(Device.id == device_id))
    if not device:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")

    owner = db.scalar(select(User).where(User.id == payload.owner_user_id, User.role == "owner"))
    if not owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Owner not found")
    if device.owner_user_id is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Device already assigned to an owner")

    active_assignments = db.scalars(
        select(DeviceOwnerAssignment).where(
            DeviceOwnerAssignment.device_id == device.id,
            DeviceOwnerAssignment.is_active.is_(True),
        )
    ).all()
    for assignment in active_assignments:
        assignment.is_active = False
        assignment.unassigned_at = datetime.utcnow()

    device.owner_user_id = owner.id
    device.status = "active"
    db.add(
        DeviceOwnerAssignment(
            device_id=device.id,
            owner_user_id=owner.id,
            assigned_by_manager_id=current_user.id,
        )
    )
    db.commit()
    db.refresh(device)
    return device_out(device)
