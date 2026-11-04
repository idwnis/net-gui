from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .services import PortService

class SystemPortsListAPIView(APIView):
    """
    Returns all active TCP/UDP sockets on the system with mapped process names,
    PIDs, user accounts, and memory/CPU footprint.
    """
    @extend_schema(
        summary="List System Ports",
        parameters=[
            OpenApiParameter(
                name="listen_only",
                description="Filter only sockets in LISTEN state (default: true)",
                required=False,
                type=bool
            )
        ]
    )
    def get(self, request):
        listen_only = request.query_params.get('listen_only', 'true').lower() in ('true', '1', 'yes')
        ports = PortService.get_system_ports(listen_only=listen_only)
        return Response({
            'status': 'ok',
            'total': len(ports),
            'ports': ports,
        }, status=status.HTTP_200_OK)

class CheckPortAPIView(APIView):
    """
    Probes an individual port to verify if it is available or held by a process.
    """
    @extend_schema(
        summary="Check Single Port Availability",
        request={"application/json": {"type": "object", "properties": {"port": {"type": "integer"}}}},
    )
    def post(self, request):
        port = request.data.get('port')
        if not port or not isinstance(port, int):
            return Response(
                {'error': 'A valid integer "port" is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = PortService.check_port(port)
        return Response(result, status=status.HTTP_200_OK)

class KillProcessAPIView(APIView):
    """
    Terminates a process by PID to release an occupied port.
    """
    @extend_schema(
        summary="Terminate Process / Release Port",
        request={"application/json": {"type": "object", "properties": {"pid": {"type": "integer"}}}},
    )
    def post(self, request):
        pid = request.data.get('pid')
        if not pid or not isinstance(pid, int):
            return Response(
                {'error': 'A valid integer "pid" is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = PortService.kill_process(pid)
        return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)
