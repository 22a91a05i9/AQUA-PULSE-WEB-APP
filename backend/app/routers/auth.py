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


def generate_reset_otp() -> str:
    return f"{secrets.randbelow(100000):05d}"


def send_password_reset_email(email: str, token: str) -> None:
    if not settings.smtp_host or not settings.smtp_from_email:
        return

    message = EmailMessage()
    message["Subject"] = f"Aqua Pulse OTP: {token}"
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = email
    message.set_content(
        "Your Aqua Pulse password reset OTP is:\n\n"
        f"{token}\n\n"
        "Enter this 5-digit OTP on the Aqua Pulse reset screen. "
        "This OTP expires in 30 minutes. If you did not request it, ignore this email."
    )
    message.add_alternative(
        f"""
        <html>
          <body style="margin:0;padding:24px;background:#f1f5f9;font-family:Segoe UI,Tahoma,sans-serif;color:#0f172a;">
            <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbeafe;">
              <div style="padding:24px 28px;background:#041526;color:#e0f2fe;">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#22d3ee;">Aqua Pulse</p>
                <h2 style="margin:0;font-size:24px;">Your password reset OTP</h2>
              </div>
              <div style="padding:26px 28px;">
                <p style="margin-top:0;">We received a request to reset your Aqua Pulse password.</p>
                <p style="margin:0 0 14px;color:#475569;">Enter this 5-digit OTP in Aqua Pulse to create a new password.</p>
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#0f172a;">Your OTP code:</p>
                <div style="padding:16px 18px;border-radius:10px;background:#e0f2fe;color:#0f172a;font-size:32px;letter-spacing:10px;font-weight:900;text-align:center;">{token}</div>
                <p style="margin:14px 0 0;color:#475569;">This OTP expires in 30 minutes. If you did not request it, ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
        """,
        subtype="html",
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
    generic_message = "If that email is registered, a reset code has been sent."
    user = db.scalar(select(User).where(User.email == payload.email, User.is_active.is_(True)))
    if not user:
        return ForgotPasswordResponse(message=generic_message, smtp_configured=smtp_configured())

    token = generate_reset_otp()
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

    message = generic_message if email_sent else "Password reset code could not be emailed because SMTP is not configured."
    return ForgotPasswordResponse(
        message=message,
        expires_at=expires_at,
        email_sent=email_sent,
        smtp_configured=smtp_configured(),
    )


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
