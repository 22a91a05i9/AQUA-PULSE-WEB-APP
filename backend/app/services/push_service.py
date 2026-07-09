import json
import logging
from datetime import datetime
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from sqlalchemy import select

from app.core.config import settings
from app.models import EmergencyIncident, NotificationDelivery, PushSubscription, User


logger = logging.getLogger(__name__)


def push_is_configured() -> bool:
    return bool(settings.emergency_push_enabled and settings.onesignal_app_id and settings.onesignal_rest_api_key)


def _record_push_delivery(
    db,
    *,
    recipient: User,
    subject: str,
    status: str,
    error_message: str | None = None,
    emergency_id: int | None = None,
) -> None:
    db.add(
        NotificationDelivery(
            event_type="emergency",
            channel="push",
            recipient_user_id=recipient.id,
            recipient_email=recipient.email,
            subject=subject,
            status=status,
            error_message=error_message,
            emergency_id=emergency_id,
            sent_at=datetime.utcnow() if status == "sent" else None,
        )
    )


def _post_onesignal(payload: dict) -> tuple[bool, str | None]:
    request = Request(
        "https://onesignal.com/api/v1/notifications",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Basic {settings.onesignal_rest_api_key}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            if 200 <= response.status < 300:
                return True, None
            return False, f"OneSignal returned HTTP {response.status}"
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        logger.exception("OneSignal emergency push failed with HTTP %s.", exc.code)
        return False, detail or str(exc)
    except URLError as exc:
        logger.exception("OneSignal emergency push failed.")
        return False, str(exc.reason)
    except Exception as exc:
        logger.exception("OneSignal emergency push failed.")
        return False, str(exc)


def send_emergency_push(recipient: User, incident: EmergencyIncident, triggered_by: User, db) -> bool:
    site_name = incident.site.name if incident.site else "Unspecified site"
    title = f"SOS {incident.priority.upper()}: {site_name}"
    message = f"{triggered_by.full_name} triggered an emergency. Open Aqua Pulse now."

    if not push_is_configured():
        _record_push_delivery(
            db,
            recipient=recipient,
            subject=title,
            status="skipped",
            error_message="Missing OneSignal config: ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY",
            emergency_id=incident.id,
        )
        db.commit()
        return False

    subscriptions = db.scalars(
        select(PushSubscription).where(
            PushSubscription.user_id == recipient.id,
            PushSubscription.provider == "onesignal",
            PushSubscription.is_active.is_(True),
        )
    ).all()
    subscription_ids = [item.subscription_id for item in subscriptions]

    if not subscription_ids:
        _record_push_delivery(
            db,
            recipient=recipient,
            subject=title,
            status="skipped",
            error_message="No active push subscription for this user.",
            emergency_id=incident.id,
        )
        db.commit()
        return False

    payload = {
        "app_id": settings.onesignal_app_id,
        "include_subscription_ids": subscription_ids,
        "headings": {"en": title},
        "contents": {"en": message},
        "priority": 10,
        "ttl": 3600,
        "url": f"{settings.frontend_base_url.rstrip('/')}/",
        "chrome_web_icon": f"{settings.frontend_base_url.rstrip('/')}/images/aqua-login-reference.png",
        "android_channel_id": "emergency_sos",
        "android_sound": settings.emergency_push_sound,
        "ios_sound": f"{settings.emergency_push_sound}.caf",
    }

    sent, error_message = _post_onesignal(payload)
    _record_push_delivery(
        db,
        recipient=recipient,
        subject=title,
        status="sent" if sent else "failed",
        error_message=error_message,
        emergency_id=incident.id,
    )
    db.commit()
    return sent
