from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import NetworkDevice, PingTarget
from .services import SubnetScannerService, PingBenchmarkService, WakeOnLanService

class NetworkDevicesListAPIView(APIView):
    """
    Returns list of discovered network devices on the local subnet.
    Automatically initializes sweep if database is empty.
    """
    @extend_schema(
        summary="List Discovered Network Devices",
        parameters=[
            OpenApiParameter(name="type", description="Filter by deviceType (e.g. computer, router, iot)", required=False, type=str),
            OpenApiParameter(name="search", description="Search by IP, hostname, or vendor", required=False, type=str),
        ]
    )
    def get(self, request):
        queryset = NetworkDevice.objects.all()

        # Seed initial scan if empty
        if not queryset.exists():
            SubnetScannerService.sweep_subnet()
            queryset = NetworkDevice.objects.all()

        device_type = request.query_params.get('type')
        if device_type and device_type != 'all':
            queryset = queryset.filter(device_type=device_type)

        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(ip__icontains=search) |
                Q(hostname__icontains=search) |
                Q(vendor__icontains=search)
            )

        devices = [d.to_dict() for d in queryset]
        return Response({
            'status': 'ok',
            'total': len(devices),
            'devices': devices,
        }, status=status.HTTP_200_OK)

class ScanSubnetAPIView(APIView):
    """
    Triggers an on-demand subnet sweep and ARP cache inspection.
    """
    @extend_schema(summary="Trigger Live Subnet Scan")
    def post(self, request):
        devices = SubnetScannerService.sweep_subnet()
        return Response({
            'status': 'scan_complete',
            'total': len(devices),
            'devices': devices,
        }, status=status.HTTP_200_OK)

class ToggleTrustAPIView(APIView):
    """
    Toggles or sets the whitelist (trusted) status of a network device.
    """
    @extend_schema(
        summary="Toggle Device Whitelist Trust Status",
        request={"application/json": {"type": "object", "properties": {"isTrusted": {"type": "boolean"}}}},
    )
    def post(self, request, device_id):
        try:
            device = NetworkDevice.objects.get(device_id=device_id)
        except NetworkDevice.DoesNotExist:
            return Response({'error': f"Device '{device_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

        if 'isTrusted' in request.data:
            device.is_trusted = bool(request.data['isTrusted'])
        else:
            device.is_trusted = not device.is_trusted

        device.save()
        return Response({
            'status': 'updated',
            'deviceId': device.device_id,
            'isTrusted': device.is_trusted,
            'device': device.to_dict(),
        }, status=status.HTTP_200_OK)

class WakeOnLanAPIView(APIView):
    """
    Transmits an IEEE 802.3 Wake-on-LAN magic packet over UDP port 9/7.
    """
    @extend_schema(
        summary="Dispatch Wake-on-LAN Magic Packet",
        request={
            "application/json": {
                "type": "object",
                "required": ["mac"],
                "properties": {
                    "mac": {"type": "string", "example": "3C:06:30:4A:21:BC"},
                    "broadcastIp": {"type": "string", "default": "255.255.255.255"},
                    "port": {"type": "integer", "default": 9}
                }
            }
        }
    )
    def post(self, request):
        mac = request.data.get('mac')
        if not mac:
            return Response({'error': 'Parameter "mac" is required.'}, status=status.HTTP_400_BAD_REQUEST)

        broadcast_ip = request.data.get('broadcastIp', '255.255.255.255')
        port = int(request.data.get('port', 9))

        success, message = WakeOnLanService.send_magic_packet(mac, broadcast_ip=broadcast_ip, port=port)
        return Response({
            'success': success,
            'message': message,
            'mac': mac,
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)

class PingTargetsAPIView(APIView):
    """
    Retrieves or benchmarks ping targets (Gateway, Cloudflare, Google DNS).
    """
    @extend_schema(summary="Get Ping Target Benchmarks")
    def get(self, request):
        PingBenchmarkService.initialize_default_targets()
        targets = [t.to_dict() for t in PingTarget.objects.all()]
        return Response({
            'status': 'ok',
            'targets': targets,
        }, status=status.HTTP_200_OK)

    @extend_schema(summary="Run Ping Target Latency & Jitter Benchmark")
    def post(self, request):
        updated_targets = PingBenchmarkService.benchmark_targets()
        return Response({
            'status': 'benchmark_complete',
            'targets': updated_targets,
        }, status=status.HTTP_200_OK)

class InspectDevicePortsAPIView(APIView):
    """
    Executes a port scan for a specific discovered device.
    """
    @extend_schema(summary="Inspect Open Ports for Device")
    def post(self, request, device_id):
        try:
            device = NetworkDevice.objects.get(device_id=device_id)
        except NetworkDevice.DoesNotExist:
            return Response({'error': f"Device '{device_id}' not found."}, status=status.HTTP_404_NOT_FOUND)

        open_ports = SubnetScannerService.scan_ports_for_host(device.ip)
        device.open_ports = open_ports
        device.save()

        return Response({
            'deviceId': device.device_id,
            'ip': device.ip,
            'openPorts': open_ports,
        }, status=status.HTTP_200_OK)
