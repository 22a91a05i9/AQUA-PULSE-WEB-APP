from datetime import datetime, time, timedelta
from io import StringIO
import csv
import textwrap

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Alert, Device, EmergencyIncident, Reading, Report, ReportSchedule, Site, SiteAgentAssignment, User
from app.schemas import ReportCreate, ReportScheduleCreate, ReportScheduleOut, ReportScheduleUpdate


router = APIRouter(prefix="/reports", tags=["reports"])


REPORT_LABELS = {
    "water_quality": "Water Quality Report",
    "device_status": "Device Status Report",
    "alert_summary": "Alert Summary Report",
    "incident_report": "Incident Report",
    "site_performance": "Site Performance Report",
    "compliance": "Compliance Report",
}


def report_to_dict(report: Report) -> dict:
    return {
        "id": report.id,
        "user_id": report.user_id,
        "generated_by_name": report.user.full_name if report.user else None,
        "generated_by_role": report.user.role if report.user else None,
        "title": report.title,
        "report_type": report.report_type,
        "scope": report.scope,
        "format": report.format,
        "status": report.status,
        "parameters": report.parameters,
        "created_at": report.created_at,
    }


def schedule_to_dict(schedule: ReportSchedule) -> dict:
    return ReportScheduleOut.model_validate(schedule).model_dump()


def owner_id_for(user: User) -> int:
    return user.id if user.role == "owner" else user.owner_user_id or user.id


def allowed_report_user_ids(current_user: User, db: Session) -> list[int]:
    if current_user.role == "owner":
        agent_ids = db.scalars(
            select(User.id).where(User.owner_user_id == current_user.id, User.role == "agent")
        ).all()
        return [current_user.id, *agent_ids]
    return [current_user.id]


def owned_site_ids(owner_id: int, db: Session) -> list[int]:
    return db.scalars(select(Site.id).where(Site.owner_user_id == owner_id)).all()


def accessible_site_ids(current_user: User, db: Session) -> list[int]:
    if current_user.role == "owner":
        return owned_site_ids(current_user.id, db)
    return db.scalars(
        select(SiteAgentAssignment.site_id).where(
            SiteAgentAssignment.agent_user_id == current_user.id,
            SiteAgentAssignment.is_active.is_(True),
        )
    ).all()


def parse_report_dates(parameters: dict | None) -> tuple[datetime | None, datetime | None]:
    parameters = parameters or {}
    start_value = parameters.get("date_from")
    end_value = parameters.get("date_to")
    start_at = None
    end_at = None
    if start_value:
        start_at = datetime.combine(datetime.fromisoformat(str(start_value)).date(), time.min)
    if end_value:
        end_at = datetime.combine(datetime.fromisoformat(str(end_value)).date(), time.max)
    return start_at, end_at


def apply_date_range(query, column, start_at: datetime | None, end_at: datetime | None):
    if start_at:
        query = query.where(column >= start_at)
    if end_at:
        query = query.where(column <= end_at)
    return query


def next_schedule_run(
    frequency: str,
    time_of_day: str,
    after: datetime | None = None,
    day_of_week: int | None = None,
    day_of_month: int | None = None,
) -> datetime:
    base = after or datetime.utcnow()
    hour_text, minute_text = (time_of_day or "08:00").split(":", 1)
    hour = int(hour_text)
    minute = int(minute_text)

    if frequency == "once":
        candidate = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
        return candidate if candidate > base else base + timedelta(minutes=1)

    if frequency == "weekly":
        target_day = day_of_week if day_of_week is not None else base.weekday()
        days_ahead = (target_day - base.weekday()) % 7
        candidate = (base + timedelta(days=days_ahead)).replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= base:
            candidate += timedelta(days=7)
        return candidate

    if frequency == "monthly":
        target_day = max(1, min(day_of_month or base.day, 28))
        year = base.year
        month = base.month
        candidate = base.replace(year=year, month=month, day=target_day, hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= base:
            month += 1
            if month > 12:
                month = 1
                year += 1
            candidate = candidate.replace(year=year, month=month, day=target_day)
        return candidate

    candidate = base.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if candidate <= base:
        candidate += timedelta(days=1)
    return candidate


def generate_report_record(
    db: Session,
    user: User,
    title: str,
    report_type: str,
    report_format: str,
    scope: str,
    parameters: dict | None = None,
) -> Report:
    rows = report_rows(report_type, user, db, parameters)
    report = Report(
        user_id=user.id,
        title=title or REPORT_LABELS.get(report_type, "Generated Report"),
        report_type=report_type,
        scope=scope,
        format=report_format,
        status="completed",
        parameters={**(parameters or {}), "row_count": len(rows)},
    )
    db.add(report)
    return report


def report_rows(report_type: str, current_user: User, db: Session, parameters: dict | None = None) -> list[dict]:
    owner_id = owner_id_for(current_user)
    site_ids = accessible_site_ids(current_user, db)
    start_at, end_at = parse_report_dates(parameters)

    if report_type == "water_quality":
        query = (
            select(Reading, Device, Site)
            .join(Device, Reading.device_id == Device.id)
            .outerjoin(Site, Reading.site_id == Site.id)
            .where(or_(Device.owner_user_id == owner_id, Site.owner_user_id == owner_id))
            .order_by(Reading.collected_at.desc())
        )
        query = apply_date_range(query, Reading.collected_at, start_at, end_at)
        if current_user.role == "agent":
            query = query.where(Reading.site_id.in_(site_ids) if site_ids else False)
        rows = db.execute(query).all()
        return [
            {
                "Collected At": reading.collected_at.isoformat(),
                "Device": device.device_uid,
                "Site": site.name if site else f"Site #{reading.site_id}" if reading.site_id else "Unassigned",
                "Temperature C": reading.temperature_c,
                "pH": reading.ph,
                "Turbidity NTU": reading.turbidity,
                "Ammonia mg/L": reading.ammonia,
                "Dissolved Oxygen mg/L": reading.dissolved_oxygen,
                "Nitrate mg/L": reading.nitrate,
                "Salinity ppt": reading.salinity,
                "Conductivity uS/cm": reading.electric_conductivity,
            }
            for reading, device, site in rows
        ]

    if report_type == "device_status":
        query = select(Device, Site).outerjoin(Site, Device.site_id == Site.id).where(Device.owner_user_id == owner_id)
        query = apply_date_range(query, Device.created_at, start_at, end_at)
        if current_user.role == "agent":
            query = query.where(Device.site_id.in_(site_ids) if site_ids else False)
        rows = db.execute(query.order_by(Device.created_at.desc())).all()
        return [
            {
                "Device": device.device_uid,
                "Status": device.status,
                "Site": site.name if site else "Unassigned",
                "Firmware": device.firmware_version or "N/A",
                "Sensors": ", ".join(sensor.name for sensor in device.sensor_types) or "N/A",
                "Created At": device.created_at.isoformat(),
            }
            for device, site in rows
        ]

    if report_type == "alert_summary":
        query = (
            select(Alert, Device, Site)
            .join(Device, Alert.device_id == Device.id)
            .outerjoin(Site, Alert.site_id == Site.id)
            .where(Alert.owner_user_id == owner_id)
            .order_by(Alert.created_at.desc())
        )
        query = apply_date_range(query, Alert.created_at, start_at, end_at)
        if current_user.role == "agent":
            query = query.where(Alert.recipient_user_id == current_user.id)
        rows = db.execute(query).all()
        return [
            {
                "Created At": alert.created_at.isoformat(),
                "Title": alert.title,
                "Metric": alert.metric,
                "Severity": alert.severity,
                "Actual Value": alert.actual_value,
                "Status": alert.status,
                "Device": device.device_uid,
                "Site": site.name if site else f"Site #{alert.site_id}" if alert.site_id else "Unassigned",
            }
            for alert, device, site in rows
        ]

    if report_type == "incident_report":
        query = (
            select(EmergencyIncident, Site)
            .outerjoin(Site, EmergencyIncident.site_id == Site.id)
            .order_by(EmergencyIncident.created_at.desc())
        )
        query = apply_date_range(query, EmergencyIncident.created_at, start_at, end_at)
        if current_user.role == "agent":
            query = query.where(
                (EmergencyIncident.triggered_by_user_id == current_user.id)
                | (EmergencyIncident.site_id.in_(site_ids) if site_ids else False)
            )
        elif current_user.role == "owner":
            query = query.where((EmergencyIncident.triggered_by_user_id == current_user.id) | (Site.owner_user_id == current_user.id))
        rows = db.execute(query).all()
        incident_rows = [
            {
                "Created At": incident.created_at.isoformat(),
                "Site": site.name if site else f"Site #{incident.site_id}" if incident.site_id else "Unassigned",
                "Priority": incident.priority,
                "Status": incident.status,
                "Description": incident.description,
                "Resolved At": incident.resolved_at.isoformat() if incident.resolved_at else "",
            }
            for incident, site in rows
        ]
        if incident_rows:
            return incident_rows

        alert_query = (
            select(Alert, Device, Site)
            .join(Device, Alert.device_id == Device.id)
            .outerjoin(Site, Alert.site_id == Site.id)
            .where(Alert.severity.in_(["critical", "warning"]))
            .order_by(Alert.created_at.desc())
        )
        alert_query = apply_date_range(alert_query, Alert.created_at, start_at, end_at)
        if current_user.role == "agent":
            alert_query = alert_query.where(Alert.recipient_user_id == current_user.id)
        elif current_user.role == "owner":
            alert_query = alert_query.where(Alert.owner_user_id == current_user.id)
        alert_rows = db.execute(alert_query).all()
        return [
            {
                "Created At": alert.created_at.isoformat(),
                "Site": site.name if site else f"Site #{alert.site_id}" if alert.site_id else "Unassigned",
                "Device": device.device_uid,
                "Priority": "critical" if alert.severity == "critical" else "warning",
                "Status": alert.status,
                "Description": alert.message,
                "Metric": alert.metric,
                "Actual Value": alert.actual_value,
                "Resolved At": alert.acknowledged_at.isoformat() if alert.acknowledged_at else "",
            }
            for alert, device, site in alert_rows
        ]

    if report_type == "site_performance":
        query = select(Site).where(Site.owner_user_id == owner_id)
        query = apply_date_range(query, Site.created_at, start_at, end_at)
        if current_user.role == "agent":
            query = query.where(Site.id.in_(site_ids) if site_ids else False)
        sites = db.scalars(query.order_by(Site.created_at.desc())).all()
        rows = []
        for site in sites:
            reading_count = db.scalar(select(func.count()).select_from(Reading).where(Reading.site_id == site.id)) or 0
            open_alerts = db.scalar(
                select(func.count()).select_from(Alert).where(Alert.site_id == site.id, Alert.status == "open")
            ) or 0
            rows.append(
                {
                    "Site": site.name,
                    "Type": site.site_type,
                    "Location": site.location_text or "N/A",
                    "Devices": len(site.devices),
                    "Active Agents": site.agents_count,
                    "Readings": reading_count,
                    "Open Alerts": open_alerts,
                    "Active": "Yes" if site.is_active else "No",
                }
            )
        return rows

    if report_type == "compliance":
        return [
            {**row, "Compliance Status": "Review" if row.get("Ammonia mg/L") and float(row["Ammonia mg/L"]) > 1 else "OK"}
            for row in report_rows("water_quality", current_user, db, parameters)
        ]

    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported report type")


def csv_bytes(rows: list[dict]) -> bytes:
    output = StringIO()
    if rows:
        writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    else:
        output.write("Message\r\nNo data available for this report.\r\n")
    return output.getvalue().encode("utf-8-sig")


def pdf_escape(value: object) -> str:
    return str(value).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def wrapped_pdf_lines(title: str, rows: list[dict]) -> list[str]:
    lines = [
        title,
        f"Generated at: {datetime.utcnow().isoformat()} UTC",
        f"Total rows: {len(rows)}",
        "",
    ]
    if not rows:
        return [*lines, "No data available for this report."]

    for index, row in enumerate(rows, start=1):
        lines.append(f"Record {index}")
        for key, value in row.items():
            text = f"{key}: {value if value not in (None, '') else 'N/A'}"
            wrapped = textwrap.wrap(
                text,
                width=72,
                subsequent_indent="    ",
                break_long_words=True,
                break_on_hyphens=False,
            ) or [""]
            lines.extend(wrapped)
        lines.append("")
    return lines


def pdf_bytes(title: str, rows: list[dict]) -> bytes:
    lines = wrapped_pdf_lines(title, rows)
    lines_per_page = 64
    pages = [lines[index : index + lines_per_page] for index in range(0, len(lines), lines_per_page)] or [[]]

    objects = ["1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj"]
    page_object_ids: list[int] = []
    content_object_ids: list[int] = []
    next_object_id = 4

    for page_lines in pages:
        page_id = next_object_id
        content_id = next_object_id + 1
        next_object_id += 2
        page_object_ids.append(page_id)
        content_object_ids.append(content_id)

        text_commands = ["BT /F1 8 Tf 36 770 Td 10 TL"]
        for line in page_lines:
            text_commands.append(f"({pdf_escape(line)}) Tj T*")
        text_commands.append("ET")
        stream = "\n".join(text_commands)
        stream_bytes = stream.encode("latin-1", errors="ignore")

        objects.append(
            f"{page_id} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
            f"/Resources << /Font << /F1 3 0 R >> >> /Contents {content_id} 0 R >> endobj"
        )
        objects.append(
            f"{content_id} 0 obj << /Length {len(stream_bytes)} >> stream\n{stream}\nendstream endobj"
        )

    kids = " ".join(f"{page_id} 0 R" for page_id in page_object_ids)
    objects.insert(1, f"2 0 obj << /Type /Pages /Kids [{kids}] /Count {len(page_object_ids)} >> endobj")
    objects.insert(2, "3 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj")

    objects = sorted(objects, key=lambda item: int(item.split(" ", 1)[0]))
    pdf = "%PDF-1.4\n"
    offsets = [0]
    for obj in objects:
        offsets.append(len(pdf.encode("latin-1")))
        pdf += obj + "\n"
    xref_at = len(pdf.encode("latin-1"))
    pdf += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n"
    pdf += "".join(f"{offset:010d} 00000 n \n" for offset in offsets[1:])
    pdf += f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_at}\n%%EOF"
    return pdf.encode("latin-1", errors="ignore")


@router.get("")
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_ids = allowed_report_user_ids(current_user, db)
    reports = db.scalars(
        select(Report)
        .where(Report.user_id.in_(user_ids))
        .order_by(Report.created_at.desc())
    ).all()
    return [report_to_dict(report) for report in reports]


@router.post("")
def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in {"owner", "agent"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    report = generate_report_record(
        db,
        current_user,
        payload.title,
        payload.report_type,
        payload.format,
        payload.scope,
        payload.parameters,
    )
    db.commit()
    db.refresh(report)
    return report_to_dict(report)


@router.get("/{report_id}/download")
def download_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.scalar(select(Report).where(Report.id == report_id))
    if not report or report.user_id not in allowed_report_user_ids(current_user, db):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    report_owner = db.scalar(select(User).where(User.id == report.user_id))
    if not report_owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report owner not found")
    rows = report_rows(report.report_type, report_owner, db, report.parameters)
    safe_title = report.title.lower().replace(" ", "-").replace("/", "-")

    if report.format.lower() in {"excel", "xlsx", "xls"}:
        return Response(
            csv_bytes(rows),
            media_type="application/vnd.ms-excel; charset=utf-8",
            headers={"Content-Disposition": f'attachment; filename="{safe_title}.xls"'},
        )

    return Response(
        pdf_bytes(report.title, rows),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.pdf"'},
    )


@router.get("/schedules", response_model=list[ReportScheduleOut])
def list_report_schedules(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedules = db.scalars(
        select(ReportSchedule)
        .where(ReportSchedule.user_id.in_(allowed_report_user_ids(current_user, db)))
        .order_by(ReportSchedule.created_at.desc())
    ).all()
    return schedules


@router.post("/schedules", response_model=ReportScheduleOut)
def create_report_schedule(
    payload: ReportScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in {"owner", "agent"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    schedule = ReportSchedule(
        user_id=current_user.id,
        title=payload.title,
        report_type=payload.report_type,
        format=payload.format,
        frequency=payload.frequency,
        time_of_day=payload.time_of_day,
        day_of_week=payload.day_of_week,
        day_of_month=payload.day_of_month,
        date_from=payload.date_from,
        date_to=payload.date_to,
        is_active=payload.is_active,
        next_run_at=next_schedule_run(payload.frequency, payload.time_of_day, day_of_week=payload.day_of_week, day_of_month=payload.day_of_month),
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/schedules/{schedule_id}", response_model=ReportScheduleOut)
def update_report_schedule(
    schedule_id: int,
    payload: ReportScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = db.scalar(
        select(ReportSchedule).where(
            ReportSchedule.id == schedule_id,
            ReportSchedule.user_id.in_(allowed_report_user_ids(current_user, db)),
        )
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")

    for field in [
        "title",
        "report_type",
        "format",
        "frequency",
        "time_of_day",
        "day_of_week",
        "day_of_month",
        "date_from",
        "date_to",
        "is_active",
    ]:
        value = getattr(payload, field)
        if value is not None:
            setattr(schedule, field, value)

    schedule.next_run_at = next_schedule_run(
        schedule.frequency,
        schedule.time_of_day,
        day_of_week=schedule.day_of_week,
        day_of_month=schedule.day_of_month,
    )
    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}")
def delete_report_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schedule = db.scalar(
        select(ReportSchedule).where(
            ReportSchedule.id == schedule_id,
            ReportSchedule.user_id.in_(allowed_report_user_ids(current_user, db)),
        )
    )
    if not schedule:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Schedule not found")
    db.delete(schedule)
    db.commit()
    return {"message": "Schedule deleted successfully"}


def run_due_report_schedules(db: Session) -> int:
    now = datetime.utcnow()
    schedules = db.scalars(
        select(ReportSchedule).where(
            ReportSchedule.is_active.is_(True),
            ReportSchedule.next_run_at.is_not(None),
            ReportSchedule.next_run_at <= now,
        )
    ).all()
    generated = 0
    for schedule in schedules:
        user = db.scalar(select(User).where(User.id == schedule.user_id))
        if not user or not user.is_active:
            continue
        parameters = {
            "generated_from": "report_schedule",
            "schedule_id": schedule.id,
            "date_from": schedule.date_from.date().isoformat() if schedule.date_from else None,
            "date_to": schedule.date_to.date().isoformat() if schedule.date_to else None,
        }
        generate_report_record(
            db,
            user,
            f"{schedule.title} - {now.strftime('%Y-%m-%d %H:%M')}",
            schedule.report_type,
            schedule.format,
            "Scheduled report",
            parameters,
        )
        generated += 1
        schedule.last_run_at = now
        if schedule.frequency == "once":
            schedule.is_active = False
            schedule.next_run_at = None
        else:
            schedule.next_run_at = next_schedule_run(
                schedule.frequency,
                schedule.time_of_day,
                after=now + timedelta(minutes=1),
                day_of_week=schedule.day_of_week,
                day_of_month=schedule.day_of_month,
            )
        schedule.updated_at = now
    db.commit()
    return generated
