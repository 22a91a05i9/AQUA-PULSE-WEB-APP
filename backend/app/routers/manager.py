from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db import get_db
from app.deps import require_role
from app.models import Alert, Device, DeviceOwnerAssignment, Site, User
from app.schemas import AssignOwnerRequest, DeviceCreate, DeviceOut, OwnerCreate, UserOut


router = APIRouter(prefix="/manager", tags=["manager"])


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
        "devices": [DeviceOut.model_validate(item).model_dump() for item in devices],
    }


@router.post("/owners", response_model=UserOut)
def create_owner(
    payload: OwnerCreate,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists")

    owner = User(
        role="owner",
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
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


@router.post("/devices", response_model=DeviceOut)
def create_device(
    payload: DeviceCreate,
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    existing = db.scalar(select(Device).where(Device.device_uid == payload.device_uid))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Device ID already exists")

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
    db.commit()
    db.refresh(device)
    return DeviceOut.model_validate(device)


@router.get("/devices", response_model=list[DeviceOut])
def list_devices(
    current_user: User = Depends(require_role("manager")),
    db: Session = Depends(get_db),
):
    devices = db.scalars(select(Device).order_by(Device.created_at.desc())).all()
    return [DeviceOut.model_validate(item) for item in devices]


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
    return DeviceOut.model_validate(device)
