from django.urls import path
from .views import (
    NetworkDevicesListAPIView,
    ScanSubnetAPIView,
    ToggleTrustAPIView,
    WakeOnLanAPIView,
    PingTargetsAPIView,
    InspectDevicePortsAPIView,
)

urlpatterns = [
    path('devices/', NetworkDevicesListAPIView.as_view(), name='radar-devices-list'),
    path('scan/', ScanSubnetAPIView.as_view(), name='radar-scan-subnet'),
    path('devices/<str:device_id>/trust/', ToggleTrustAPIView.as_view(), name='radar-toggle-trust'),
    path('devices/<str:device_id>/ports/', InspectDevicePortsAPIView.as_view(), name='radar-inspect-ports'),
    path('wol/', WakeOnLanAPIView.as_view(), name='radar-wol'),
    path('ping-targets/', PingTargetsAPIView.as_view(), name='radar-ping-targets'),
    path('ping-targets/test/', PingTargetsAPIView.as_view(), name='radar-ping-test'),
]
