from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models import PushSubscription, User
from app.schemas import PushConfigOut, PushSubscriptionOut, PushSubscriptionUpsert
from app.services.push_service import push_is_configured


router = APIRouter(prefix="/push", tags=["push"])


@router.get("/config", response_model=PushConfigOut)
def push_config(current_user: User = Depends(get_current_user)):
    return PushConfigOut(
        enabled=push_is_configured(),
        provider="onesignal",
        app_id=settings.onesignal_app_id or None,
    )


@router.post("/subscriptions", response_model=PushSubscriptionOut)
def upsert_push_subscription(
    payload: PushSubscriptionUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subscription = db.scalar(
        select(PushSubscription).where(
            PushSubscription.provider == payload.provider,
            PushSubscription.subscription_id == payload.subscription_id,
        )
    )

    if subscription is None:
        subscription = PushSubscription(
            user_id=current_user.id,
            provider=payload.provider,
            subscription_id=payload.subscription_id,
            device_label=payload.device_label,
            is_active=True,
        )
        db.add(subscription)
    else:
        subscription.user_id = current_user.id
        subscription.device_label = payload.device_label
        subscription.is_active = True
        subscription.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(subscription)
    return PushSubscriptionOut.model_validate(subscription)


@router.delete("/subscriptions/{subscription_id}")
def deactivate_push_subscription(
    subscription_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    subscription = db.scalar(
        select(PushSubscription).where(
            PushSubscription.user_id == current_user.id,
            PushSubscription.subscription_id == subscription_id,
        )
    )
    if subscription:
        subscription.is_active = False
        subscription.updated_at = datetime.utcnow()
        db.commit()
    return {"message": "Push subscription removed."}
