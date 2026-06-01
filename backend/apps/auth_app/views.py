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



class RegisterView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Registration failed.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        data = serializer.validated_data
        email = data['email']
        
        if get_user_by_email(email):
            return error_response(
                message="An account with this email already exists.",
                status_code=status.HTTP_409_CONFLICT,
            )
        
        user = User(
            email=email,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
        )

        user.set_password(data['password'])
        user.save()

        return success_response(
            message="Account created successfully. Please log in.",
            status_code=status.HTTP_201_CREATED,
        )
    
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Invalid input.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        data = serializer.validated_data
        user = get_user_by_email(data['email'])
        
        if not user or not user.verify_password(data['password']):
            return error_response(
                message="Invalid email or password.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
        
        if not user.is_active:
            return error_response(
                message="This account has been deactivated.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        tokens = get_tokens_for_user(user)

        response = success_response(
            message="Login successful.",
            data={"email": user.email, "first_name": user.first_name},
        )

        set_auth_cookies(response, tokens)
        return response


class OTPSendView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPRequestSerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Invalid input.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        email = serializer.validated_data['email']
        
        user = get_user_by_email(email)
        if not user:
            user = User(email=email)
        
        otp = generate_otp()
        user.otp = otp
        user.otp_expires_at = get_otp_expiry()
        user.save()
        
        try:
            send_otp_email(email, otp)

        except Exception:
            return error_response(
                message="Failed to send OTP. Please try again.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        return success_response(message="OTP sent to your email.")
    

class OTPVerifyView(APIView):

    permission_classes = [AllowAny]
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)

        if not serializer.is_valid():
            return error_response(
                message="Invalid input.",
                data=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        data = serializer.validated_data
        user = get_user_by_email(data['email'])
        
        if not user or not user.otp:
            return error_response(
                message="No OTP was requested for this email.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        if datetime.now(timezone.utc) > user.otp_expires_at.replace(tzinfo=timezone.utc):
            return error_response(
                message="OTP has expired. Please request a new one.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        if user.otp != data['otp']:
            return error_response(
                message="Incorrect OTP.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        user.clear_otp()
        
        tokens = get_tokens_for_user(user)
        response = success_response(
            message="OTP verified. Login successful.",
            data={"email": user.email, "first_name": user.first_name},
        )

        set_auth_cookies(response, tokens)
        return response
