from django.urls import path
from .views import SystemPortsListAPIView, CheckPortAPIView, KillProcessAPIView

urlpatterns = [
    path('', SystemPortsListAPIView.as_view(), name='ports-list'),
    path('check/', CheckPortAPIView.as_view(), name='ports-check'),
    path('kill/', KillProcessAPIView.as_view(), name='ports-kill'),
]
