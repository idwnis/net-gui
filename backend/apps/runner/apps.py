from django.apps import AppConfig

class RunnerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.runner'
    verbose_name = 'Dev Orchestrator & Process Supervisor'
