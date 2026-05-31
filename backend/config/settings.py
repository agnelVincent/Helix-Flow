"""
Django settings for Task Manager (Helix Flow) project.

Environment variables are loaded from the .env file using python-decouple.
NEVER hardcode secrets here — always use config() to read from .env.
"""

from pathlib import Path
from datetime import timedelta
from decouple import config

# ─────────────────────────────────────────────
# BASE DIRECTORY
# ─────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent


# ─────────────────────────────────────────────
# SECURITY — All values loaded from .env
# ─────────────────────────────────────────────
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')


# ─────────────────────────────────────────────
# INSTALLED APPS
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    # Django built-ins (only what we need — no admin, no ORM auth)
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',

    # Third-party
    'rest_framework',
    'corsheaders',

    # Our apps (full dotted path since they live under apps/)
    'apps.auth_app',
    'apps.tasks',
]


# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',          # Must be first
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


# ─────────────────────────────────────────────
# URL & WSGI
# ─────────────────────────────────────────────
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'


# ─────────────────────────────────────────────
# TEMPLATES (minimal — only needed for DRF browsable API)
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
            ],
        },
    },
]


# ─────────────────────────────────────────────
# DATABASE — Disabled (MongoEngine replaces Django ORM)
# ─────────────────────────────────────────────
DATABASES = {}


# ─────────────────────────────────────────────
# MONGODB via MONGOENGINE
# ─────────────────────────────────────────────
import mongoengine

mongoengine.connect(
    db=config('MONGO_DB_NAME', default='taskmanager'),
    host=config('MONGO_URI'),
)


# ─────────────────────────────────────────────
# DJANGO REST FRAMEWORK
# ─────────────────────────────────────────────
REST_FRAMEWORK = {
    # JWT Bearer token authentication
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # All endpoints require authentication by default
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    # Custom exception handler defined in core/exceptions.py
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}


# ─────────────────────────────────────────────
# JWT CONFIGURATION (SimpleJWT)
# ─────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # Short-lived access token
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),      # Long-lived refresh token
    'ROTATE_REFRESH_TOKENS': True,                    # New refresh token on each use
    'BLACKLIST_AFTER_ROTATION': False,                # No SQL blacklist needed
    'AUTH_HEADER_TYPES': ('Bearer',),                 # Authorization: Bearer <token>
}


# ─────────────────────────────────────────────
# CORS — Allow React dev server to talk to Django
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',    # Vite default dev port
    'http://127.0.0.1:5173',
]
CORS_ALLOW_CREDENTIALS = True


# ─────────────────────────────────────────────
# EMAIL CONFIGURATION (Gmail SMTP)
# ─────────────────────────────────────────────
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER


# ─────────────────────────────────────────────
# INTERNATIONALIZATION
# ─────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True


# ─────────────────────────────────────────────
# STATIC FILES
# ─────────────────────────────────────────────
STATIC_URL = 'static/'
