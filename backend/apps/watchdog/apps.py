from django.apps import AppConfig

class WatchdogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.watchdog'
    verbose_name = 'Production SSL & Domain Watchdog'
