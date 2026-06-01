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

    