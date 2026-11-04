import os
import sys
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Add apps directory to sys.path so apps can be discovered cleanly
sys.path.insert(0, str(BASE_DIR))

# Quick-start development settings - unsuitable for production
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', 'netpulse-insecure-core-dev-key-8391827401')

DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = ['*']

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'corsheaders',
    'channels',
    'drf_spectacular',

    # Net GUI Internal Apps
    'apps.core',
    'apps.telemetry',
    'apps.ports',
    'apps.radar',
    'apps.runner',
    'apps.gateway',
    'apps.sniffer',
    'apps.landrop',
    'apps.switchboard',
    'apps.watchdog',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Channel Layers
# In-memory channel layer enables zero-dependency execution in Electron and local dev
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}

# Database & Media Directories
# Supports NETPULSE_DATA_DIR environment variable for packaged Desktop (macOS/Win)
# and custom server persistent volumes. Default: local backend directory.
NETPULSE_DATA_DIR = os.environ.get('NETPULSE_DATA_DIR')
if NETPULSE_DATA_DIR:
    DATA_PATH = Path(NETPULSE_DATA_DIR)
    DATA_PATH.mkdir(parents=True, exist_ok=True)
    DB_PATH = DATA_PATH / 'db.sqlite3'
    MEDIA_ROOT = DATA_PATH / 'media'
else:
    DB_PATH = BASE_DIR / 'db.sqlite3'
    MEDIA_ROOT = BASE_DIR / 'media'

MEDIA_ROOT.mkdir(parents=True, exist_ok=True)
MEDIA_URL = '/media/'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DB_PATH,
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration - Allows Vite React frontend (:5173), Electron, and remote LAN access
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# OpenAPI / Swagger config via drf-spectacular
SPECTACULAR_SETTINGS = {
    'TITLE': 'Net GUI Core Suite API',
    'DESCRIPTION': 'High-performance local network radar, telemetry & developer orchestrator engine.',
    'VERSION': '2.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}
