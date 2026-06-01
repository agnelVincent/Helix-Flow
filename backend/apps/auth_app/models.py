from mongoengine import Document, StringField, BooleanField, DateTimeField
from django.contrib.auth.hashers import make_password, check_password
from datetime import datetime


class User(Document):
    email = StringField(required=True, unique=True)
    first_name = StringField(max_length=50, default='')
    last_name = StringField(max_length=50, default='')
    password = StringField(required=False)
    otp = StringField(required=False, default=None)             
    otp_expires_at = DateTimeField(required=False, default=None)
    is_active = BooleanField(default=True)
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'users',          
        'indexes': ['email'],           
        'ordering': ['-created_at'],    
    }

    def set_password(self, raw_password: str):
        self.password = make_password(raw_password)

    def verify_password(self, raw_password: str) -> bool:
        return check_password(raw_password, self.password)
    
    def clear_otp(self):
        self.otp = None
        self.otp_expires_at = None
        self.save()

    def __str__(self):
        return self.email