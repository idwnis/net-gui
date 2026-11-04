from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .services import TelemetryService

class TelemetryOverviewAPIView(APIView):
    """
    Returns real-time snapshot of CPU per-core load, memory, network I/O throughput,
    and top processes with mapped listening ports.
    """
    @extend_schema(
        summary="Get System Telemetry Snapshot",
        description="Returns CPU cores, RAM pressure, network in/out Kbps, and top processes."
    )
    def get(self, request):
        data = TelemetryService.get_telemetry()
        return Response(data, status=status.HTTP_200_OK)

class OptimizeRAMAPIView(APIView):
    """
    Frees inactive system memory and runs memory compaction.
    Uses macOS purge, Linux malloc_trim, or Win32 EmptyWorkingSet.
    """
    @extend_schema(
        summary="Optimize System Memory",
        description="Executes cross-platform RAM purge and garbage compaction."
    )
    def post(self, request):
        result = TelemetryService.optimize_ram()
        return Response(result, status=status.HTTP_200_OK)
