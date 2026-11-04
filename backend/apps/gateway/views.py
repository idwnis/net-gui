from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .models import DNSQueryLog
from .proxy_server import ProxyServerService
from .dns_server import DNSSinkholeService

class GatewayConfigAPIView(APIView):
    """Retrieves or updates VPN Gateway & Proxy configuration."""
    @extend_schema(summary="Get Gateway Proxy Configuration")
    def get(self, request):
        cfg = ProxyServerService.get_or_create_config()
        return Response(cfg.to_dict(), status=status.HTTP_200_OK)

    @extend_schema(summary="Update Gateway Proxy Configuration")
    def post(self, request):
        cfg = ProxyServerService.get_or_create_config()
        for key, val in request.data.items():
            if hasattr(cfg, key):
                setattr(cfg, key, val)
        cfg.save()
        return Response(cfg.to_dict(), status=status.HTTP_200_OK)

class ToggleGatewayAPIView(APIView):
    """Toggles gateway proxy routing state (active / paused)."""
    @extend_schema(summary="Toggle Gateway Proxy State")
    def post(self, request):
        cfg = ProxyServerService.get_or_create_config()
        new_state = not cfg.is_enabled if 'isEnabled' not in request.data else bool(request.data['isEnabled'])
        result = ProxyServerService.toggle_gateway(new_state)
        return Response(result, status=status.HTTP_200_OK)

class DNSSinkholeStatsAPIView(APIView):
    """Returns DNS Sinkhole metrics (total, blocked, percent, blocklist count)."""
    @extend_schema(summary="Get DNS Sinkhole Statistics")
    def get(self, request):
        stats_data = DNSSinkholeService.get_stats()
        return Response(stats_data, status=status.HTTP_200_OK)

class DNSQueriesListAPIView(APIView):
    """Returns historical captured DNS queries."""
    @extend_schema(summary="List DNS Queries")
    def get(self, request):
        queries = DNSQueryLog.objects.all()[:100]

        # Seed initial queries if DB is fresh
        if not queries.exists():
            DNSSinkholeService.process_query('telemetry.samsung.com', '192.168.1.140', 'Samsung QLED TV', 'A')
            DNSSinkholeService.process_query('googleads.g.doubleclick.net', '192.168.1.155', 'iPhone 15 Pro', 'HTTPS')
            DNSSinkholeService.process_query('api.github.com', '192.168.1.105', 'MacBook Pro', 'A')
            DNSSinkholeService.process_query('metrics.icloud.com', '192.168.1.155', 'iPhone 15 Pro', 'AAAA')
            DNSSinkholeService.process_query('registry.npmjs.org', '192.168.1.105', 'MacBook Pro', 'A')
            queries = DNSQueryLog.objects.all()[:100]

        return Response([q.to_dict() for q in queries], status=status.HTTP_200_OK)

class DNSQueryProcessAPIView(APIView):
    """Processes a test query through the DNS sinkhole."""
    @extend_schema(summary="Process DNS Lookup through Sinkhole")
    def post(self, request):
        domain = request.data.get('domain')
        if not domain:
            return Response({'error': 'Parameter "domain" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        client_ip = request.data.get('clientIp', '127.0.0.1')
        client_name = request.data.get('clientName', 'Client Device')
        query_type = request.data.get('type', 'A')

        res = DNSSinkholeService.process_query(
            domain=domain,
            client_ip=client_ip,
            client_name=client_name,
            query_type=query_type
        )
        return Response(res, status=status.HTTP_200_OK)
