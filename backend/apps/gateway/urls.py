from django.urls import path
from .views import (
    GatewayConfigAPIView,
    ToggleGatewayAPIView,
    DNSSinkholeStatsAPIView,
    DNSQueriesListAPIView,
    DNSQueryProcessAPIView,
)

urlpatterns = [
    path('config/', GatewayConfigAPIView.as_view(), name='gateway-config'),
    path('toggle/', ToggleGatewayAPIView.as_view(), name='gateway-toggle'),
    path('dns/stats/', DNSSinkholeStatsAPIView.as_view(), name='gateway-dns-stats'),
    path('dns/queries/', DNSQueriesListAPIView.as_view(), name='gateway-dns-queries'),
    path('dns/query/', DNSQueryProcessAPIView.as_view(), name='gateway-dns-process'),
]
