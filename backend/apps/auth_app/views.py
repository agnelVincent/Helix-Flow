from datetime import datetime, timezone
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status
from core.responses import success_response, error_response
from apps.auth_app.models import User
from apps.auth_app.serializers import (
    RegisterSerializer,
    LoginSerializer,
    OTPRequestSerializer,
    OTPVerifySerializer,
)
from apps.auth_app.services import (
    get_user_by_email,
    get_tokens_for_user,
    generate_otp,
    get_otp_expiry,
    send_otp_email,
)

ACCESS_TOKEN_COOKIE = 'access_token'
REFRESH_TOKEN_COOKIE = 'refresh_token'
ACCESS_TOKEN_MAX_AGE = 60 * 15             
REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7 


def set_auth_cookies(response, tokens: dict):
    is_production = not settings.DEBUG

    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE,
        value=tokens['access'],
        max_age=ACCESS_TOKEN_MAX_AGE,
        httponly=True,           
        secure=is_production,       
        samesite='Lax',             
    )

    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=tokens['refresh'],
        max_age=REFRESH_TOKEN_MAX_AGE,
        httponly=True,
        secure=is_production,
        samesite='Lax',
    )

def clear_auth_cookies(response):
    response.delete_cookie(ACCESS_TOKEN_COOKIE)
    response.delete_cookie(REFRESH_TOKEN_COOKIE)

