from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .models import DomainWatchdogItem
from .services import SSLWatchdogService

class DomainsListCreateAPIView(APIView):
    """Lists monitored domains or adds a new domain to the watchdog."""
    @extend_schema(summary="List Monitored Domains")
    def get(self, request):
        domains = SSLWatchdogService.get_domains()
        return Response(domains, status=status.HTTP_200_OK)

    @extend_schema(summary="Add Domain to Watchdog Monitor")
    def post(self, request):
        domain = request.data.get('domain')
        if not domain:
            return Response({'error': 'Parameter "domain" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        item = SSLWatchdogService.add_or_update_domain(domain)
        return Response(item, status=status.HTTP_201_CREATED)

class DomainCheckAPIView(APIView):
    """Triggers an on-demand SSL certificate and DNS check."""
    @extend_schema(summary="Re-check Domain SSL & DNS")
    def post(self, request, domain_id):
        item = DomainWatchdogItem.objects.filter(domain_id=domain_id).first()
        if not item:
            return Response({'error': 'Domain not found'}, status=status.HTTP_404_NOT_FOUND)

        updated = SSLWatchdogService.add_or_update_domain(item.domain)
        return Response(updated, status=status.HTTP_200_OK)

class DomainDeleteAPIView(APIView):
    """Removes a domain from the watchdog monitor."""
    @extend_schema(summary="Remove Domain from Watchdog")
    def delete(self, request, domain_id):
        DomainWatchdogItem.objects.filter(domain_id=domain_id).delete()
        return Response({'status': 'deleted', 'domainId': domain_id}, status=status.HTTP_200_OK)
