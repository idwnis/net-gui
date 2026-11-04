from django.contrib import admin
from django.urls import path, re_path, include
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from .views import serve_spa, serve_assets

def health_check(request):
    return JsonResponse({
        'status': 'healthy',
        'service': 'Net GUI Core Suite Engine',
        'version': '2.0.0',
        'engine': 'Django 5.1 ASGI + Channels',
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health-check'),
    
    # OpenAPI Schema & Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Net GUI Feature APIs
    path('api/telemetry/', include('apps.telemetry.urls')),
    path('api/ports/', include('apps.ports.urls')),
    path('api/radar/', include('apps.radar.urls')),
    path('api/runner/', include('apps.runner.urls')),
    path('api/gateway/', include('apps.gateway.urls')),
    path('api/sniffer/', include('apps.sniffer.urls')),
    path('api/landrop/', include('apps.landrop.urls')),
    path('api/switchboard/', include('apps.switchboard.urls')),
    path('api/watchdog/', include('apps.watchdog.urls')),

    # Direct Web Browser Access (Headless Server / Production SPA)
    path('assets/<path:path>', serve_assets, name='spa-assets'),
    re_path(r'^(?!api/|ws/|admin/|static/|assets/).*$', serve_spa, name='spa-root'),
]
