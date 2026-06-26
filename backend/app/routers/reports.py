from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.models import Report, User
from app.schemas import ReportCreate, ReportOut


router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("", response_model=list[ReportOut])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = db.scalars(
        select(Report)
        .where(Report.user_id == current_user.id)
        .order_by(Report.created_at.desc())
        .limit(50)
    ).all()
    return [ReportOut.model_validate(r) for r in reports]


@router.post("", response_model=ReportOut)
def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = Report(
        user_id=current_user.id,
        title=payload.title,
        report_type=payload.report_type,
        scope=payload.scope,
        format=payload.format,
        status="completed",
        parameters=payload.parameters,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return ReportOut.model_validate(report)
