from django.urls import path
from .views import (
    PacketsListAPIView,
    ClearPacketsAPIView,
    ThrottleProfileAPIView,
    ExplainErrorAPIView,
)

urlpatterns = [
    path('packets/', PacketsListAPIView.as_view(), name='sniffer-packets'),
    path('clear/', ClearPacketsAPIView.as_view(), name='sniffer-clear'),
    path('throttle/', ThrottleProfileAPIView.as_view(), name='sniffer-throttle'),
    path('explain/', ExplainErrorAPIView.as_view(), name='sniffer-explain'),
]
