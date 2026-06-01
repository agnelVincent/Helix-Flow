from django.urls import path
from apps.auth_app.views import (
    RegisterView,
    RegisterVerifyView,
    LoginView,
    OTPSendView,
    OTPVerifyView,
    TokenRefreshView,
    LogoutView,
)


urlpatterns = [
    # Registration (2-step)
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('register/verify/', RegisterVerifyView.as_view(), name='auth-register-verify'),
    # Password login
    path('login/', LoginView.as_view(), name='auth-login'),
    # Passwordless OTP login
    path('otp/send/', OTPSendView.as_view(), name='auth-otp-send'),
    path('otp/verify/', OTPVerifyView.as_view(), name='auth-otp-verify'),
    # Token management
    path('refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
]