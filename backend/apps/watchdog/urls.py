from django.urls import path
from .views import (
    DomainsListCreateAPIView,
    DomainCheckAPIView,
    DomainDeleteAPIView,
)

urlpatterns = [
    path('domains/', DomainsListCreateAPIView.as_view(), name='watchdog-domains'),
    path('domains/<str:domain_id>/check/', DomainCheckAPIView.as_view(), name='watchdog-check'),
    path('domains/<str:domain_id>/', DomainDeleteAPIView.as_view(), name='watchdog-delete'),
]
