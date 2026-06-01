from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework.exceptions import AuthenticationFailed
from apps.auth_app.models import User

class CookieJWTAuthentication(JWTAuthentication):

    def authenticate(self, request):

        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            return None
        
        try:
            validated_token = self.get_validated_token(raw_token)
        except (InvalidToken, TokenError) as e:
            raise AuthenticationFailed(str(e))
        
        user_id = validated_token.get('user_id')
        if not user_id:
            raise AuthenticationFailed("Token missing user_id claim.")
        
        try:
            user = User.objects.get(id=user_id)
        except (User.DoesNotExist, Exception):
            raise AuthenticationFailed("User not found or token is invalid.")
        
        if not user.is_active:
            raise AuthenticationFailed("This account has been deactivated.")
        
        return (user, validated_token)
