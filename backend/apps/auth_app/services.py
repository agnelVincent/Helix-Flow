
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


def get_tokens_for_user(user) -> dict:
    import jwt
    from datetime import datetime, timezone, timedelta
    from django.conf import settings
    now = datetime.now(timezone.utc)
    
    access_payload = {
        'user_id': str(user.id),
        'email': user.email,
        'token_type': 'access',
        'iat': now,
        'exp': now + timedelta(minutes=15),
    }
    
    refresh_payload = {
        'user_id': str(user.id),
        'email': user.email,
        'token_type': 'refresh',
        'iat': now,
        'exp': now + timedelta(days=7),
    }

    access_token = jwt.encode(access_payload, settings.SECRET_KEY, algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, settings.SECRET_KEY, algorithm='HS256')
    
    return {
        'access': access_token,
        'refresh': refresh_token,
    }


def get_user_by_email(email: str):
    from apps.auth_app.models import User
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None