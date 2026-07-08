from datetime import datetime, timedelta
import hashlib
import logging
import secrets
import smtplib
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db import get_db
from app.deps import get_current_user
from app.models import PasswordResetToken, User
from app.schemas import ChangePasswordRequest, ForgotPasswordRequest, ForgotPasswordResponse, LoginRequest, ResetPasswordRequest, ResetPasswordResponse, TokenResponse, UserOut


router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger(__name__)


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def send_password_reset_email(email: str, token: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        return

    message = EmailMessage()
    message["Subject"] = "Aqua Pulse password reset code"
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = email
    message.set_content(
        "Use this password reset code in Aqua Pulse:\n\n"
        f"{token}\n\n"
        "This code expires in 30 minutes. If you did not request it, ignore this email."
    )

    if settings.smtp_use_ssl:
        with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as smtp:
            if settings.smtp_username:
                smtp.login(settings.smtp_username, settings.smtp_password)
            smtp.send_message(message)
        return

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as smtp:
        if settings.smtp_use_tls:
            smtp.starttls()
        if settings.smtp_username:
            smtp.login(settings.smtp_username, settings.smtp_password)
        smtp.send_message(message)


def smtp_configured() -> bool:
    return bool(settings.smtp_host and settings.smtp_from_email)


def create_password_reset(payload: ForgotPasswordRequest, db: Session) -> ForgotPasswordResponse:
    generic_message = "If that email is registered, a password reset code has been sent."
    user = db.scalar(select(User).where(User.email == payload.email, User.is_active.is_(True)))
    if not user:
        return ForgotPasswordResponse(message=generic_message, smtp_configured=smtp_configured())

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_reset_token(token),
            expires_at=expires_at,
        )
    )
    db.commit()

    email_sent = False
    try:
        if smtp_configured():
            send_password_reset_email(user.email, token)
            email_sent = True
    except Exception:
        logger.exception("Password reset email failed for user %s", user.id)

    if settings.app_env.lower() != "production":
        message = generic_message if email_sent else "Password reset code created. SMTP is not configured, so use the development code shown here."
        return ForgotPasswordResponse(
            message=message,
            reset_token=token,
            expires_at=expires_at,
            email_sent=email_sent,
            smtp_configured=smtp_configured(),
        )
    return ForgotPasswordResponse(message=generic_message, email_sent=email_sent, smtp_configured=smtp_configured())


def confirm_password_reset(payload: ResetPasswordRequest, db: Session) -> ResetPasswordResponse:
    reset_row = db.scalar(
        select(PasswordResetToken).where(
            PasswordResetToken.token_hash == hash_reset_token(payload.token),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.utcnow(),
        )
    )
    if not reset_row or not reset_row.user or not reset_row.user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset code is invalid or expired.")

    reset_row.user.password_hash = hash_password(payload.new_password)
    reset_row.used_at = datetime.utcnow()
    db.commit()
    return ResetPasswordResponse(message="Password reset successfully. Please log in with your new password.")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == payload.email, User.is_active.is_(True)))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email is not registered")
    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Password is invalid")

    user.last_portal_access = datetime.utcnow()
    db.commit()
    db.refresh(user)

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return create_password_reset(payload, db)


@router.post("/password-reset/request", response_model=ForgotPasswordResponse)
def request_password_reset(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    return create_password_reset(payload, db)


@router.post("/reset-password", response_model=ResetPasswordResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return confirm_password_reset(payload, db)


@router.post("/password-reset/confirm", response_model=ResetPasswordResponse)
def confirm_reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    return confirm_password_reset(payload, db)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
    if verify_password(payload.new_password, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be different from current password.")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password changed successfully."}


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully."}
