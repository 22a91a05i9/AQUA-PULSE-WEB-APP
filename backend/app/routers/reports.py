from datetime import datetime
from io import StringIO
import csv

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Alert, Device, Reading, Report, Site, SiteAgentAssignment, User
from app.schemas import ReportCreate


router = APIRouter(prefix="/reports", tags=["reports"])


REPORT_LABELS = {
    "water_quality": "Water Quality Report",
    "device_status": "Device Status Report",
    "alert_summary": "Alert Summary Report",
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


def report_rows(report_type: str, current_user: User, db: Session) -> list[dict]:
    owner_id = owner_id_for(current_user)
    site_ids = accessible_site_ids(current_user, db)

    if report_type == "water_quality":
        query = (
            select(Reading, Device, Site)
            .join(Device, Reading.device_id == Device.id)
            .outerjoin(Site, Reading.site_id == Site.id)
            .where(or_(Device.owner_user_id == owner_id, Site.owner_user_id == owner_id))
            .order_by(Reading.collected_at.desc())
            .limit(100)
        )
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
            .limit(100)
        )
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

    if report_type == "site_performance":
        query = select(Site).where(Site.owner_user_id == owner_id)
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
        rows = report_rows("water_quality", current_user, db)
        return [
            {
                **row,
                "Compliance Status": "Review" if row.get("Ammonia mg/L") and float(row["Ammonia mg/L"]) > 1 else "OK",
            }
            for row in rows
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


def pdf_bytes(title: str, rows: list[dict]) -> bytes:
    lines = [title, f"Generated at: {datetime.utcnow().isoformat()} UTC", ""]
    for index, row in enumerate(rows[:40], start=1):
        lines.append(f"{index}. " + " | ".join(f"{key}: {value}" for key, value in row.items()))
    if not rows:
        lines.append("No data available for this report.")
    text = "\n".join(lines).replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    stream = f"BT /F1 10 Tf 40 780 Td 12 TL ({text[:3500].replace(chr(10), ') Tj T* (')}) Tj ET"
    objects = [
        "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
        "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
        "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
        "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
        f"5 0 obj << /Length {len(stream.encode('latin-1', errors='ignore'))} >> stream\n{stream}\nendstream endobj",
    ]
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
        .limit(100)
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

    rows = report_rows(payload.report_type, current_user, db)
    report = Report(
        user_id=current_user.id,
        title=payload.title or REPORT_LABELS.get(payload.report_type, "Generated Report"),
        report_type=payload.report_type,
        scope=payload.scope,
        format=payload.format,
        status="completed",
        parameters={**(payload.parameters or {}), "row_count": len(rows)},
    )
    db.add(report)
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
    rows = report_rows(report.report_type, report_owner, db)
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
