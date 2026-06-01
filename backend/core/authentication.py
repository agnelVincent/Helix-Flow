import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from apps.auth_app.models import User

class CookieJWTAuthentication(BaseAuthentication):

    def authenticate(self, request):
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None
        
        try:
            payload = jwt.decode(
                raw_token,
                settings.SECRET_KEY,
                algorithms=['HS256'],
            )
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Access token has expired. Please refresh.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Invalid access token.")
        
        if payload.get('token_type') != 'access':
            raise AuthenticationFailed("Invalid token type.")
        
        user_id = payload.get('user_id')

        if not user_id:
            raise AuthenticationFailed("Token missing user_id claim.")
        
        try:
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, Exception):
            raise AuthenticationFailed("User not found or token is invalid.")
        
        if not user.is_active:
            raise AuthenticationFailed("This account has been deactivated.")
        
        return (user, payload)
