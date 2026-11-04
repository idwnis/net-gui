from django.urls import path
from .views import (
    ProjectsListCreateAPIView,
    ProjectDetectAPIView,
    ServiceControlAPIView,
    ProjectBatchControlAPIView,
    ServiceRebindAPIView,
    ClearLogsAPIView,
    AIDiagnoseAPIView,
    WebhookCatchAPIView,
    WebhookReplayAPIView,
    DatabaseInstancesAPIView,
    DatabaseQueryAPIView,
    ProjectEnvAPIView,
)

urlpatterns = [
    path('projects/', ProjectsListCreateAPIView.as_view(), name='runner-projects'),
    path('projects/detect/', ProjectDetectAPIView.as_view(), name='runner-project-detect'),
    path('projects/<str:project_id>/env/', ProjectEnvAPIView.as_view(), name='runner-project-env'),
    path('projects/<str:project_id>/<str:action>/', ProjectBatchControlAPIView.as_view(), name='runner-project-batch'),
    path('services/<str:service_id>/rebind/', ServiceRebindAPIView.as_view(), name='runner-service-rebind'),
    path('services/<str:service_id>/clear-logs/', ClearLogsAPIView.as_view(), name='runner-clear-logs'),
    path('services/<str:service_id>/<str:action>/', ServiceControlAPIView.as_view(), name='runner-service-control'),
    path('diagnose/', AIDiagnoseAPIView.as_view(), name='runner-ai-diagnose'),
    path('webhooks/catch/<str:source>/', WebhookCatchAPIView.as_view(), name='runner-webhook-catch'),
    path('webhooks/<str:webhook_id>/replay/', WebhookReplayAPIView.as_view(), name='runner-webhook-replay'),
    path('database/instances/', DatabaseInstancesAPIView.as_view(), name='runner-db-instances'),
    path('database/query/', DatabaseQueryAPIView.as_view(), name='runner-db-query'),
]
