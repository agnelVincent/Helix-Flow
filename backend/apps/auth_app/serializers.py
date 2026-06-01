import re
from rest_framework import serializers


class RegisterSerializer(serializers.serializer):
    first_name = serializers.CharField(max_length = 50, required = False, allow_blank = True)
    last_name = serializers.CharField(max_length=50, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)


    def validate_email(self, value: str) -> str:
        return value.strip().lower()
    
    def validate_password(self, value: str) -> str:

        if not re.search(r'\d', value):
            raise serializers.ValidationError("Password must contain at least one digit.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Password must contain at least one uppercase letter.")
        return value
    
    def validate(self, data: dict) -> dict:

        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data