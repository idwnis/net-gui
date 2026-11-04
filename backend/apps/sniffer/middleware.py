import time
from .services import SnifferService

class APISnifferMiddleware:
    """
    Real-time packet sniffer middleware for Django ASGI engine.
    Intercepts and logs live HTTP API request/response cycles into the sniffer stream.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start_time = time.perf_counter()
        response = self.get_response(request)
        duration_ms = int((time.perf_counter() - start_time) * 1000)

        # Log active API calls, ignoring static assets and polling noise
        path = request.path
        if path.startswith('/api/') and not path.startswith('/api/sniffer/'):
            try:
                content_len = len(response.content) if hasattr(response, 'content') else 128
                SnifferService.record_packet(
                    method=request.method,
                    url=request.build_absolute_uri(),
                    status=response.status_code,
                    duration_ms=max(1, duration_ms),
                    size_bytes=content_len,
                    source_app='Net GUI Web App',
                    content_type=response.get('Content-Type', 'application/json'),
                    request_headers={'User-Agent': request.headers.get('User-Agent', 'Net GUI Client')},
                    response_headers={'Content-Type': response.get('Content-Type', 'application/json')},
                )
            except Exception:
                pass

        return response
