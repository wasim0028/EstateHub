# config/settings.py
"""
Django settings for Real Estate Portal.
Split into Base → Development → Production using environment variables.
Copy .env.example to .env and fill in values before running.
"""

import os
from datetime import timedelta
from pathlib import Path

import environ

# ─────────────────────────────────────────────
# PATH & ENVIRONMENT
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
)
environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")


# ─────────────────────────────────────────────
# APPLICATION DEFINITION
# ─────────────────────────────────────────────

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "storages",          # django-storages for S3/Cloudinary
]

LOCAL_APPS = [
    "users",
    "properties",
    "realestate",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",     # Static files in prod
    "corsheaders.middleware.CorsMiddleware",          # ← Must be before CommonMiddleware
    "django.middleware.common.CommonMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
AUTH_USER_MODEL = "users.User"


# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]


# ─────────────────────────────────────────────
# DATABASE — PostgreSQL
# ─────────────────────────────────────────────

if env.bool("USE_SQLITE", default=False):
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": env("DB_NAME", default="realestate_db"),
            "USER": env("DB_USER", default="postgres"),
            "PASSWORD": env("DB_PASSWORD", default=""),
            "HOST": env("DB_HOST", default="localhost"),
            "PORT": env("DB_PORT", default="5432"),
            "OPTIONS": {
                "connect_timeout": 10,
            },
            "CONN_MAX_AGE": 60,   # Persistent connections
        }
    }


# ─────────────────────────────────────────────
# DJANGO REST FRAMEWORK
# ─────────────────────────────────────────────

REST_FRAMEWORK = {
    # Authentication: JWT Bearer token from Authorization header
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    # Default: require authentication. Override per-view with AllowAny.
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    # Pagination
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    # Filtering
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    # Throttling (customize rates as needed)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.ScopedRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "100/day",
        "user": "1000/day",
        # Scoped limits for the endpoints worth attacking. The global anon rate
        # of 100/day would otherwise allow 100 password guesses per IP per day
        # against any account, and let anyone flood a user's inbox with reset
        # emails. Applied per-view via `throttle_scope`.
        "login": "10/min",
        "register": "20/hour",
        "password_reset": "5/hour",
        "change_password": "10/hour",
    },
    # Renderers / Parsers
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    # Exception handling
    "EXCEPTION_HANDLER": "rest_framework.views.exception_handler",
    # Date/time format
    "DATETIME_FORMAT": "%Y-%m-%dT%H:%M:%SZ",
}


# ─────────────────────────────────────────────
# JWT CONFIGURATION (SimpleJWT)
# ─────────────────────────────────────────────

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    "TOKEN_TYPE_CLAIM": "token_type",
}


# ─────────────────────────────────────────────
# CORS — Django CORS Headers
# ─────────────────────────────────────────────

# Origins allowed to make cross-site requests to the Django API.
# In production this should be your exact Next.js domain.
CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=[
        "http://localhost:3000",    # Next.js dev server
        "http://127.0.0.1:3000",
    ],
)

# Allow credentials (cookies) so Next.js server-side fetches with cookies work
CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

CORS_ALLOW_METHODS = ["DELETE", "GET", "OPTIONS", "PATCH", "POST", "PUT"]

# CSRF trusted origins (Next.js frontend origin for form submissions)
CSRF_TRUSTED_ORIGINS = env.list(
    "CSRF_TRUSTED_ORIGINS",
    default=[
        "http://localhost:3000",
        "https://yourdomain.com",
    ],
)


# ─────────────────────────────────────────────
# PAYMENTS — RAZORPAY (UPI / PhonePe / Google Pay / cards)
# ─────────────────────────────────────────────
# UPI apps aren't integrated directly — Razorpay's Standard Checkout
# surfaces PhonePe, Google Pay, Paytm, etc. automatically as UPI options
# once UPI is enabled on your Razorpay account. Get test keys from
# https://dashboard.razorpay.com/app/keys (Test Mode).

RAZORPAY_KEY_ID = env("RAZORPAY_KEY_ID", default="")
RAZORPAY_KEY_SECRET = env("RAZORPAY_KEY_SECRET", default="")
# Set when creating the webhook in the Razorpay dashboard. This is NOT the same
# value as RAZORPAY_KEY_SECRET — webhook payloads are signed with their own
# secret. Leave blank and the webhook endpoint refuses everything, which is the
# safe default: an unverified endpoint that marks bookings paid would let anyone
# forge a payment.
RAZORPAY_WEBHOOK_SECRET = env("RAZORPAY_WEBHOOK_SECRET", default="")

# Site-visit booking token amount, in INR (buyer pays this to reserve a slot)
SITE_VISIT_TOKEN_AMOUNT = env.float("SITE_VISIT_TOKEN_AMOUNT", default=500.0)


# ─────────────────────────────────────────────
# MEDIA STORAGE — AWS S3 (toggle via env)
# ─────────────────────────────────────────────

USE_S3 = env.bool("USE_S3", default=False)

if USE_S3:
    # AWS Settings
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY")
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="us-east-1")
    AWS_S3_CUSTOM_DOMAIN = f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    AWS_DEFAULT_ACL = "public-read"
    AWS_S3_FILE_OVERWRITE = False

    # Media files → S3
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/media/"

else:
    # Local media (development)
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "mediafiles"

# ─── Cloudinary (alternative to S3) ──────────
# Uncomment to use Cloudinary instead of S3.
# CLOUDINARY_STORAGE = {
#     "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME"),
#     "API_KEY": env("CLOUDINARY_API_KEY"),
#     "API_SECRET": env("CLOUDINARY_API_SECRET"),
# }
# DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"


# ─────────────────────────────────────────────
# STATIC FILES
# ─────────────────────────────────────────────

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"


# ─────────────────────────────────────────────
# INTERNATIONALISATION
# ─────────────────────────────────────────────

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ─────────────────────────────────────────────
# SECURITY (production hardening)
# ─────────────────────────────────────────────

if not DEBUG:
    # Behind a reverse proxy or load balancer (nginx, ALB, Render, Railway,
    # Fly.io), TLS terminates at the proxy and Django receives plain HTTP.
    # Without this header mapping, request.is_secure() is False, so
    # SECURE_SSL_REDIRECT redirects forever — the classic first-deploy
    # infinite redirect loop.
    #
    # Only safe when a trusted proxy sets X-Forwarded-Proto. If you expose
    # Django directly to the internet, remove this line: a client could
    # otherwise spoof the header.
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    USE_X_FORWARDED_HOST = True

    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    X_FRAME_OPTIONS = "DENY"


# ─────────────────────────────────────────────
# LOGGING
# ─────────────────────────────────────────────

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.db.backends": {
            "handlers": ["console"],
            "level": "DEBUG" if DEBUG else "INFO",
            "propagate": False,
        },
    },
}


# ─────────────────────────────────────────────
# EMAIL (password reset)
# ─────────────────────────────────────────────
# In development, reset emails are printed to the terminal running Django.
# For production set EMAIL_BACKEND to the SMTP backend and fill in the host
# settings (or point DEFAULT_FROM_EMAIL at a transactional provider).
EMAIL_BACKEND = env(
    "EMAIL_BACKEND",
    default="django.core.mail.backends.console.EmailBackend",
)
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="EstateHub <noreply@estatehub.local>")

# Base URL of the Next.js frontend, used to build password reset links
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")


# ─────────────────────────────────────────────
# PASSWORD VALIDATION
# ─────────────────────────────────────────────
# This block was missing entirely, which meant validate_password() had no rules
# to apply — "password" and "12345678" were accepted at registration, at
# password reset, and on change-password.
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]
