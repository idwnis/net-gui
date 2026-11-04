from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .services import SnifferService, ThrottleService

class PacketsListAPIView(APIView):
    """Retrieves intercepted HTTP/WebSocket packets or injects a test packet."""
    @extend_schema(summary="List Intercepted API Packets")
    def get(self, request):
        packets = SnifferService.get_packets()
        return Response({
            'status': 'ok',
            'total': len(packets),
            'packets': packets,
        }, status=status.HTTP_200_OK)

    @extend_schema(summary="Record or Inject Network Packet")
    def post(self, request):
        data = request.data
        packet = SnifferService.record_packet(
            method=data.get('method', 'GET'),
            url=data.get('url', 'http://localhost/'),
            status=int(data.get('status', 200)),
            duration_ms=int(data.get('durationMs', 10)),
            size_bytes=int(data.get('sizeBytes', 1024)),
            source_app=data.get('sourceApp', 'Client App'),
            content_type=data.get('contentType', 'application/json'),
            request_headers=data.get('requestHeaders'),
            response_headers=data.get('responseHeaders'),
            request_body_preview=data.get('requestBodyPreview', ''),
            response_body_preview=data.get('responseBodyPreview', ''),
        )
        return Response(packet.to_dict(), status=status.HTTP_201_CREATED)

class ClearPacketsAPIView(APIView):
    """Purges packet sniffer history buffer."""
    @extend_schema(summary="Clear Traffic History")
    def post(self, request):
        SnifferService.clear_packets()
        return Response({'status': 'cleared'}, status=status.HTTP_200_OK)

class ThrottleProfileAPIView(APIView):
    """Manages simulated latency and bandwidth throttling profile."""
    @extend_schema(summary="Get Active Throttle Profile & Presets")
    def get(self, request):
        return Response({
            'activeProfile': ThrottleService.get_current_profile(),
            'presets': ThrottleService.get_all_profiles(),
        }, status=status.HTTP_200_OK)

    @extend_schema(summary="Set Network Throttle Profile")
    def post(self, request):
        profile_id = request.data.get('profileId') or request.data.get('id', 'none')
        updated = ThrottleService.set_profile(profile_id)
        return Response({'status': 'updated', 'profile': updated}, status=status.HTTP_200_OK)

class ExplainErrorAPIView(APIView):
    """AI explanation of HTTP error responses."""
    @extend_schema(summary="AI Diagnosis for Intercepted Error Packet")
    def post(self, request):
        method = request.data.get('method', 'GET')
        url = request.data.get('url', '')
        http_status = int(request.data.get('status', 500))

        if http_status == 401:
            explanation = (
                f"AI Diagnosis for {method} {url} (HTTP 401 Unauthorized):\n\n"
                f"Root Cause: The remote host rejected the request due to missing or expired credentials. "
                f"In this case, an authentication credential or Bearer token is invalid or malformed.\n"
                f"Fix Recommendation: Verify your authorization header format or update your API secret key."
            )
        elif http_status == 500:
            explanation = (
                f"AI Diagnosis for {method} {url} (HTTP 500 Internal Server Error):\n\n"
                f"Root Cause: Unhandled runtime exception inside backend view handler or database connection refusal.\n"
                f"Fix Recommendation: Inspect server stderr traceback and verify database credentials."
            )
        elif http_status >= 400 and http_status < 500:
            explanation = (
                f"AI Diagnosis for {method} {url} (HTTP {http_status} Client Error):\n\n"
                f"Root Cause: Bad request schema, missing required parameter, or forbidden endpoint.\n"
                f"Fix Recommendation: Check request payload JSON formatting."
            )
        else:
            explanation = f"Request completed with HTTP {http_status}."

        return Response({'explanation': explanation}, status=status.HTTP_200_OK)
