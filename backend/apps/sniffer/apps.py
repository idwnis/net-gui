from django.apps import AppConfig

class SnifferConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.sniffer'
    verbose_name = 'Live API Sniffer & Latency Throttler'
