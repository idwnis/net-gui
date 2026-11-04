from django.urls import path
from .views import TelemetryOverviewAPIView, OptimizeRAMAPIView

urlpatterns = [
    path('overview/', TelemetryOverviewAPIView.as_view(), name='telemetry-overview'),
    path('optimize-ram/', OptimizeRAMAPIView.as_view(), name='telemetry-optimize-ram'),
]
