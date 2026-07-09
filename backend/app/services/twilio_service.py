import base64
import json
import logging
import re
from datetime import datetime
from html import escape
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import settings
from app.models import EmergencyIncident, NotificationDelivery, User


logger = logging.getLogger(__name__)


def twilio_is_configured() -> bool:
    return bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_from_phone)


def twilio_studio_is_configured() -> bool:
    return twilio_is_configured() and bool(settings.twilio_studio_flow_sid)


def normalize_phone_number(phone: str | None) -> str | None:
    if not phone:
        return None

    trimmed = phone.strip()
    if trimmed.startswith("+"):
        digits = re.sub(r"\D", "", trimmed[1:])
        return f"+{digits}" if digits else None

    digits = re.sub(r"\D", "", trimmed)
    if not digits:
        return None
    if len(digits) == 10:
        return f"{settings.twilio_default_country_code}{digits}"
    return f"+{digits}"


def _record_delivery(
    db,
    *,
    recipient: User,
    channel: str,
    subject: str,
    status: str,
    error_message: str | None = None,
    emergency_id: int | None = None,
) -> None:
    db.add(
        NotificationDelivery(
            event_type="emergency",
            channel=channel,
            recipient_user_id=recipient.id,
            recipient_email=recipient.email,
            subject=subject,
            status=status,
            error_message=error_message,
            emergency_id=emergency_id,
            sent_at=datetime.utcnow() if status == "sent" else None,
        )
    )


def _twilio_post(path: str, values: dict[str, str]) -> tuple[bool, str | None]:
    auth = f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode("utf-8")
    request = Request(
        f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}/{path}",
        data=urlencode(values).encode("utf-8"),
        headers={
            "Authorization": f"Basic {base64.b64encode(auth).decode('ascii')}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            if 200 <= response.status < 300:
                return True, None
            return False, f"Twilio returned HTTP {response.status}"
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        logger.exception("Twilio request failed with HTTP %s.", exc.code)
        return False, detail or str(exc)
    except URLError as exc:
        logger.exception("Twilio request failed.")
        return False, str(exc.reason)
    except Exception as exc:
        logger.exception("Twilio request failed.")
        return False, str(exc)


def _twilio_studio_post(path: str, values: dict[str, str]) -> tuple[bool, str | None]:
    auth = f"{settings.twilio_account_sid}:{settings.twilio_auth_token}".encode("utf-8")
    request = Request(
        f"https://studio.twilio.com/v2/{path}",
        data=urlencode(values).encode("utf-8"),
        headers={
            "Authorization": f"Basic {base64.b64encode(auth).decode('ascii')}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=15) as response:
            if 200 <= response.status < 300:
                return True, None
            return False, f"Twilio Studio returned HTTP {response.status}"
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        logger.exception("Twilio Studio request failed with HTTP %s.", exc.code)
        return False, detail or str(exc)
    except URLError as exc:
        logger.exception("Twilio Studio request failed.")
        return False, str(exc.reason)
    except Exception as exc:
        logger.exception("Twilio Studio request failed.")
        return False, str(exc)


def emergency_message(incident: EmergencyIncident, triggered_by: User) -> str:
    site_name = incident.site.name if incident.site else "Unspecified site"
    return (
        f"Aqua Pulse SOS {incident.priority.upper()}: {triggered_by.full_name} triggered an emergency "
        f"at {site_name}. Open Aqua Pulse immediately. Details: {incident.description}"
    )[:1500]


def emergency_flow_parameters(incident: EmergencyIncident, triggered_by: User, recipient: User) -> str:
    site_name = incident.site.name if incident.site else "Unspecified site"
    return json.dumps(
        {
            "incident_id": incident.id,
            "priority": incident.priority,
            "description": incident.description,
            "site_name": site_name,
            "agent_name": triggered_by.full_name,
            "agent_email": triggered_by.email,
            "recipient_name": recipient.full_name,
            "recipient_role": recipient.role,
        }
    )


def send_emergency_studio_flow(recipient: User, incident: EmergencyIncident, triggered_by: User, db) -> bool:
    subject = f"SOS Studio flow to {recipient.full_name}"
    to_phone = normalize_phone_number(recipient.phone)

    if not settings.emergency_studio_flow_enabled:
        _record_delivery(db, recipient=recipient, channel="studio", subject=subject, status="skipped", error_message="Emergency Studio Flow is disabled.", emergency_id=incident.id)
        db.commit()
        return False
    if not to_phone:
        _record_delivery(db, recipient=recipient, channel="studio", subject=subject, status="skipped", error_message="Recipient has no valid phone number.", emergency_id=incident.id)
        db.commit()
        return False
    if not twilio_studio_is_configured():
        _record_delivery(db, recipient=recipient, channel="studio", subject=subject, status="skipped", error_message="Missing Twilio Studio config.", emergency_id=incident.id)
        db.commit()
        return False

    sent, error_message = _twilio_studio_post(
        f"Flows/{settings.twilio_studio_flow_sid}/Executions",
        {
            "From": settings.twilio_from_phone,
            "To": to_phone,
            "Parameters": emergency_flow_parameters(incident, triggered_by, recipient),
        },
    )
    _record_delivery(db, recipient=recipient, channel="studio", subject=subject, status="sent" if sent else "failed", error_message=error_message, emergency_id=incident.id)
    db.commit()
    return sent


def send_emergency_sms(recipient: User, incident: EmergencyIncident, triggered_by: User, db) -> bool:
    subject = f"SOS SMS to {recipient.full_name}"
    to_phone = normalize_phone_number(recipient.phone)

    if not settings.emergency_sms_enabled:
        _record_delivery(db, recipient=recipient, channel="sms", subject=subject, status="skipped", error_message="Emergency SMS is disabled.", emergency_id=incident.id)
        db.commit()
        return False
    if not to_phone:
        _record_delivery(db, recipient=recipient, channel="sms", subject=subject, status="skipped", error_message="Recipient has no valid phone number.", emergency_id=incident.id)
        db.commit()
        return False
    if not twilio_is_configured():
        _record_delivery(db, recipient=recipient, channel="sms", subject=subject, status="skipped", error_message="Missing Twilio config.", emergency_id=incident.id)
        db.commit()
        return False

    sent, error_message = _twilio_post(
        "Messages.json",
        {
            "From": settings.twilio_from_phone,
            "To": to_phone,
            "Body": emergency_message(incident, triggered_by),
        },
    )
    _record_delivery(db, recipient=recipient, channel="sms", subject=subject, status="sent" if sent else "failed", error_message=error_message, emergency_id=incident.id)
    db.commit()
    return sent


def send_emergency_call(recipient: User, incident: EmergencyIncident, triggered_by: User, db) -> bool:
    subject = f"SOS call to {recipient.full_name}"
    to_phone = normalize_phone_number(recipient.phone)
    site_name = incident.site.name if incident.site else "unspecified site"

    if not settings.emergency_call_enabled:
        _record_delivery(db, recipient=recipient, channel="call", subject=subject, status="skipped", error_message="Emergency calls are disabled.", emergency_id=incident.id)
        db.commit()
        return False
    if not to_phone:
        _record_delivery(db, recipient=recipient, channel="call", subject=subject, status="skipped", error_message="Recipient has no valid phone number.", emergency_id=incident.id)
        db.commit()
        return False
    if not twilio_is_configured():
        _record_delivery(db, recipient=recipient, channel="call", subject=subject, status="skipped", error_message="Missing Twilio config.", emergency_id=incident.id)
        db.commit()
        return False

    spoken_message = escape(
        f"Aqua Pulse emergency alert. SOS was triggered by {triggered_by.full_name} "
        f"at {site_name}. Priority {incident.priority}. Please open Aqua Pulse and respond immediately."
    )
    twiml = f"<Response><Say voice=\"alice\" language=\"en-IN\">{spoken_message}</Say><Pause length=\"1\"/><Say voice=\"alice\" language=\"en-IN\">This is an emergency SOS alert from Aqua Pulse.</Say></Response>"

    sent, error_message = _twilio_post(
        "Calls.json",
        {
            "From": settings.twilio_from_phone,
            "To": to_phone,
            "Twiml": twiml,
        },
    )
    _record_delivery(db, recipient=recipient, channel="call", subject=subject, status="sent" if sent else "failed", error_message=error_message, emergency_id=incident.id)
    db.commit()
    return sent
