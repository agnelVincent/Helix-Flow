
import secrets
from datetime import datetime, timedelta, timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken
from core.constants import OTP_LENGTH, OTP_EXPIRY_MINUTES, EMAIL_SUBJECT_OTP


def generate_otp() -> str:

    max_value = 10 ** OTP_LENGTH
    otp = secrets.randbelow(max_value)

    return str(otp).zfill(OTP_LENGTH)

def get_otp_expiry() -> datetime:

    return datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)


def get_otp_expiry() -> datetime:

    return datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)


def send_otp_email(email: str, otp: str) -> None:

    subject = EMAIL_SUBJECT_OTP
    message = (
        f"Your Helix Flow verification code is: {otp}\n\n"
        f"This code is valid for {OTP_EXPIRY_MINUTES} minutes.\n"
        f"Do not share this code with anyone."
    )

    send_mail(
        subject=subject,
        message=message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,   
    )