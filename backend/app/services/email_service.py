import logging
import smtplib
from datetime import datetime
from email.message import EmailMessage
from html import escape

from app.core.config import settings
from app.models import Alert, EmergencyIncident, NotificationDelivery, User
from app.services.localization import label, user_language


logger = logging.getLogger(__name__)


def missing_smtp_fields() -> list[str]:
    missing: list[str] = []
    if not settings.smtp_host:
        missing.append("SMTP_HOST")
    if not settings.smtp_from_email:
        missing.append("SMTP_FROM_EMAIL")
    return missing


def smtp_is_configured() -> bool:
    return not missing_smtp_fields()


def _sender() -> str:
    if settings.smtp_from_name:
        return f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    return settings.smtp_from_email


def _send_message(message: EmailMessage) -> tuple[bool, str | None]:
    try:
        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
                server.ehlo()
                if settings.smtp_use_tls:
                    server.starttls()
                    server.ehlo()
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.send_message(message)
    except Exception as exc:
        logger.exception("Failed to send notification email.")
        return False, str(exc)

    return True, None


def _record_delivery(
    db,
    *,
    event_type: str,
    channel: str = "email",
    recipient: User,
    subject: str,
    status: str,
    error_message: str | None = None,
    alert_id: int | None = None,
    emergency_id: int | None = None,
) -> None:
    delivery = NotificationDelivery(
        event_type=event_type,
        channel=channel,
        recipient_user_id=recipient.id,
        recipient_email=recipient.email,
        subject=subject,
        status=status,
        error_message=error_message,
        alert_id=alert_id,
        emergency_id=emergency_id,
        sent_at=datetime.utcnow() if status == "sent" else None,
    )
    db.add(delivery)


def _metric_label(metric: str) -> str:
    mapping = {
        "temperature_c": "Temperature",
        "ph": "pH",
        "turbidity_ntu": "Turbidity",
    }
    return mapping.get(metric, metric.replace("_", " ").title())


def _metric_label_for_user(metric: str, recipient: User) -> str:
    lang = user_language(recipient)
    localized = label(metric, lang)
    return localized if localized != metric else _metric_label(metric)


def _alert_direction(alert: Alert) -> str:
    if alert.threshold_min is not None and alert.actual_value < alert.threshold_min:
        return "low"
    if alert.threshold_max is not None and alert.actual_value > alert.threshold_max:
        return "high"
    return "normal"


def _precautions_for_alert(alert: Alert) -> list[str]:
    direction = _alert_direction(alert)

    precautions: dict[tuple[str, str], list[str]] = {
        ("temperature_c", "high"): [
            "Start aeration immediately and reduce heat stress on stock.",
            "Increase water exchange or cooling if your farm setup supports it.",
            "Reduce feeding until temperature returns to a safe range.",
        ],
        ("temperature_c", "low"): [
            "Check cold-water inflow or sudden weather-related temperature drops.",
            "Reduce handling and movement of stock to avoid stress.",
            "Inspect sensor placement and confirm the reading with a manual check.",
        ],
        ("ph", "high"): [
            "Inspect for algal bloom or chemical imbalance in the pond.",
            "Recheck alkalinity and buffering before making corrections.",
            "Apply pH correction only according to farm protocol and in small steps.",
        ],
        ("ph", "low"): [
            "Check for acidic runoff, decomposition, or chemical contamination.",
            "Review liming or buffering plan before adjusting the pond.",
            "Retest pH after any correction to avoid overshooting the safe range.",
        ],
        ("turbidity_ntu", "high"): [
            "Inspect the pond for suspended solids, algae bloom, or feed waste buildup.",
            "Reduce disturbance and feeding until the water begins to stabilize.",
            "Check filtration, settling, or water exchange options if available.",
        ],
        ("turbidity_ntu", "low"): [
            "Confirm the sensor reading and inspect for calibration drift.",
            "Review recent water exchange or filtration activity.",
            "Continue monitoring to ensure the change is stable and expected.",
        ],
    }

    return precautions.get(
        (alert.metric, direction),
        [
            "Inspect the pond condition and verify the sensor reading on site.",
            "Take corrective action according to your farm protocol.",
            "Recheck readings after intervention to confirm recovery.",
        ],
    )


def send_alert_summary_email(recipient: User, alerts: list[Alert], db=None) -> bool:
    if not recipient.email or not alerts:
        return False

    actionable_alerts = [alert for alert in alerts if alert.severity in {"warning", "critical"}]
    if not actionable_alerts:
        return False

    highest_severity = "critical" if any(alert.severity == "critical" for alert in actionable_alerts) else "warning"
    primary_alert = actionable_alerts[0]
    lang = user_language(recipient)
    site_name = primary_alert.site.name if primary_alert.site else "-"
    device_name = primary_alert.device.device_uid if primary_alert.device else str(primary_alert.device_id)
    subject = f"[{highest_severity.upper()}] {len(actionable_alerts)} {label('alerts', lang) if lang != 'en' else 'alert(s)'} - {site_name}"

    for setting in getattr(recipient, "settings", []) or []:
        prefs = setting.notification_prefs
        if isinstance(prefs, dict) and prefs.get("email_alerts") is False:
            if db is not None:
                _record_delivery(
                    db,
                    event_type="alert",
                    recipient=recipient,
                    subject=subject,
                    status="skipped",
                    error_message="Email notifications are disabled for this user.",
                    alert_id=primary_alert.id,
                )
                db.commit()
            return False

    if not smtp_is_configured():
        logger.info(
            "SMTP is not configured. Missing %s. Skipping email for alert %s.",
            ", ".join(missing_smtp_fields()),
            ", ".join(str(alert.id) for alert in alerts),
        )
        if db is not None:
            _record_delivery(
                db,
                event_type="alert",
                recipient=recipient,
                subject=subject,
                status="skipped",
                error_message=f"Missing SMTP config: {', '.join(missing_smtp_fields())}",
                alert_id=primary_alert.id,
            )
            db.commit()
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _sender()
    message["To"] = recipient.email

    text_lines = [
        f"Hello {recipient.full_name},",
        "",
        "The Aqua Monitoring System detected alert(s) that require attention." if lang == "en" else "Aqua Pulseలో మీ దృష్టి అవసరమైన హెచ్చరికలు గుర్తించబడ్డాయి." if lang == "te" else "Aqua Pulse ने ध्यान देने योग्य अलर्ट पहचाने हैं।",
        "",
        f"{label('site', lang)}: {site_name}",
        f"Device: {device_name}",
        f"{label('priority', lang)}: {highest_severity}",
        "",
        "Alert Summary:",
    ]

    html_cards: list[str] = []
    for index, alert in enumerate(actionable_alerts, start=1):
        precautions = _precautions_for_alert(alert)
        text_lines.extend(
            [
                f"{index}. {_metric_label_for_user(alert.metric, recipient)} [{alert.severity.upper()}]",
                f"   Actual Value: {alert.actual_value:.2f}",
                f"   Allowed Range: {alert.threshold_min if alert.threshold_min is not None else '-'} to {alert.threshold_max if alert.threshold_max is not None else '-'}",
                f"   {label('description', lang)}: {alert.message}",
                "   Precautions:",
                *[f"   - {item}" for item in precautions],
                "",
            ]
        )

        severity_color = "#b91c1c" if alert.severity == "critical" else "#c2410c"
        severity_bg = "#fee2e2" if alert.severity == "critical" else "#ffedd5"
        precautions_html = "".join(f"<li>{escape(item)}</li>" for item in precautions)
        html_cards.append(
            f"""
            <div style="border:1px solid #e2e8f0;border-radius:16px;padding:18px;margin-bottom:14px;background:#ffffff;">
              <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;">
                <strong style="font-size:16px;color:#0f172a;">{_metric_label_for_user(alert.metric, recipient)}</strong>
                <span style="background:{severity_bg};color:{severity_color};padding:6px 10px;border-radius:999px;font-size:12px;font-weight:700;text-transform:uppercase;">{alert.severity}</span>
              </div>
              <p style="margin:14px 0 8px;color:#334155;"><strong>Actual Value:</strong> {alert.actual_value:.2f}</p>
              <p style="margin:8px 0;color:#334155;"><strong>Allowed Range:</strong> {alert.threshold_min if alert.threshold_min is not None else '-'} to {alert.threshold_max if alert.threshold_max is not None else '-'}</p>
              <p style="margin:8px 0 14px;color:#334155;"><strong>Alert Message:</strong> {escape(alert.message)}</p>
              <div style="background:#f8fafc;border-radius:12px;padding:14px;">
                <strong style="display:block;margin-bottom:8px;color:#0f172a;">Recommended Precautions</strong>
                <ul style="margin:0;padding-left:18px;color:#475569;">
                  {precautions_html}
                </ul>
              </div>
            </div>
            """
        )

    text_lines.append("Please log in to the Aqua Monitoring System and verify the alert after field inspection.")
    message.set_content("\n".join(text_lines))
    message.add_alternative(
        f"""
        <html>
          <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;">
            <div style="max-width:760px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 18px 40px rgba(15,23,42,0.12);">
              <div style="padding:28px 32px;background:linear-gradient(135deg,#0f766e,#0284c7);color:#ecfeff;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.85;">Aqua Monitoring System</p>
                <h2 style="margin:0;font-size:28px;line-height:1.1;">Alert Summary For Field Action</h2>
                <p style="margin:12px 0 0;opacity:.92;">One email for the full alert event so you can respond faster in the field.</p>
              </div>
              <div style="padding:28px 32px;">
                <p style="margin-top:0;">Hello {escape(recipient.full_name)},</p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
                  <span style="background:#ecfeff;color:#0f766e;padding:8px 12px;border-radius:999px;font-weight:700;">Site: {escape(site_name)}</span>
                  <span style="background:#eff6ff;color:#1d4ed8;padding:8px 12px;border-radius:999px;font-weight:700;">Device: {escape(device_name)}</span>
                  <span style="background:#fef2f2;color:#b91c1c;padding:8px 12px;border-radius:999px;font-weight:700;">Highest Severity: {highest_severity.upper()}</span>
                </div>
                {''.join(html_cards)}
                <div style="margin-top:18px;padding:16px 18px;border-radius:16px;background:#ecfeff;color:#0f172a;">
                  Please log in to the Aqua Monitoring System after inspection and mark the alert as verified when the site is safe.
                </div>
              </div>
            </div>
          </body>
        </html>
        """,
        subtype="html",
    )

    sent, error_message = _send_message(message)
    if db is not None:
        _record_delivery(
            db,
            event_type="alert",
            recipient=recipient,
            subject=subject,
            status="sent" if sent else "failed",
            error_message=error_message,
            alert_id=primary_alert.id,
        )
        db.commit()

    return sent


def send_agent_alert_summary_email(recipient: User, alerts: list[Alert], db=None) -> bool:
    if recipient.role != "agent":
        return False
    return send_alert_summary_email(recipient, alerts, db)


def send_emergency_email(recipient: User, incident: EmergencyIncident, triggered_by: User, db=None) -> bool:
    if not recipient.email:
        return False

    lang = user_language(recipient)
    site_name = incident.site.name if incident.site else label("unspecified_site", lang)
    subject = label("sos_subject", lang, priority=incident.priority.upper(), name=triggered_by.full_name)

    for setting in getattr(recipient, "settings", []) or []:
        prefs = setting.notification_prefs
        if isinstance(prefs, dict) and prefs.get("email_alerts") is False:
            if db is not None:
                _record_delivery(
                    db,
                    event_type="emergency",
                    recipient=recipient,
                    subject=subject,
                    status="skipped",
                    error_message="Email notifications are disabled for this user.",
                    emergency_id=incident.id,
                )
                db.commit()
            return False

    if not smtp_is_configured():
        if db is not None:
            _record_delivery(
                db,
                event_type="emergency",
                recipient=recipient,
                subject=subject,
                status="skipped",
                error_message=f"Missing SMTP config: {', '.join(missing_smtp_fields())}",
                emergency_id=incident.id,
            )
            db.commit()
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _sender()
    message["To"] = recipient.email

    lines = [
        f"Hello {recipient.full_name},",
        "",
        label("email_intro", lang),
        "",
        f"{label('triggered_by', lang)}: {triggered_by.full_name} ({triggered_by.role})",
        f"{label('agent_email', lang)}: {triggered_by.email}",
        f"{label('site', lang)}: {site_name}",
        f"{label('priority', lang)}: {incident.priority}",
        f"{label('description', lang)}: {incident.description}",
        f"{label('time', lang)}: {incident.created_at.isoformat()} UTC",
        "",
        label("email_action", lang),
    ]
    message.set_content("\n".join(lines))
    message.add_alternative(
        f"""
        <html>
          <body style="margin:0;padding:24px;background:#f8fafc;font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;">
            <div style="max-width:680px;margin:0 auto;background:white;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
              <div style="padding:24px 28px;background:#b91c1c;color:white;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;">Aqua Pulse SOS</p>
                <h2 style="margin:0;font-size:26px;">{escape(label("email_heading", lang))}</h2>
              </div>
              <div style="padding:24px 28px;">
                <p>Hello {escape(recipient.full_name)},</p>
                <p>{escape(label("email_intro", lang))} <strong>{escape(triggered_by.full_name)}</strong>.</p>
                <table style="width:100%;border-collapse:collapse;margin-top:18px;">
                  <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">{escape(label("site", lang))}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">{escape(site_name)}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">{escape(label("priority", lang))}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">{escape(incident.priority.upper())}</td></tr>
                  <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;">{escape(label("agent_email", lang))}</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;">{escape(triggered_by.email)}</td></tr>
                  <tr><td style="padding:8px;color:#64748b;">{escape(label("description", lang))}</td><td style="padding:8px;">{escape(incident.description)}</td></tr>
                </table>
                <p style="margin-top:20px;padding:14px;border-radius:12px;background:#fef2f2;color:#991b1b;font-weight:700;">{escape(label("email_action", lang))}</p>
              </div>
            </div>
          </body>
        </html>
        """,
        subtype="html",
    )

    sent, error_message = _send_message(message)
    if db is not None:
        _record_delivery(
            db,
            event_type="emergency",
            recipient=recipient,
            subject=subject,
            status="sent" if sent else "failed",
            error_message=error_message,
            emergency_id=incident.id,
        )
        db.commit()

    return sent
