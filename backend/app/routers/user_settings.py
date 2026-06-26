from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import User, UserSetting
from app.schemas import UserSettingOut, UserSettingUpdate


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
    if payload.notification_prefs is not None:
        setting.notification_prefs = payload.notification_prefs
    if payload.alert_thresholds is not None:
        setting.alert_thresholds = payload.alert_thresholds

    db.commit()
    db.refresh(setting)
    return UserSettingOut.model_validate(setting)
