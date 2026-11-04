from django.urls import re_path
from apps.telemetry.consumers import TelemetryConsumer
from apps.radar.consumers import RadarConsumer
from apps.runner.consumers import ServiceLogsConsumer
from apps.gateway.consumers import DNSQueryConsumer
from apps.sniffer.consumers import SnifferConsumer
from apps.landrop.consumers import LanDropConsumer

websocket_urlpatterns = [
    re_path(r'^ws/telemetry/$', TelemetryConsumer.as_asgi()),
    re_path(r'^ws/radar/$', RadarConsumer.as_asgi()),
    re_path(r'^ws/runner/logs/(?P<service_id>[\w-]+)/$', ServiceLogsConsumer.as_asgi()),
    re_path(r'^ws/gateway/dns/$', DNSQueryConsumer.as_asgi()),
    re_path(r'^ws/sniffer/$', SnifferConsumer.as_asgi()),
    re_path(r'^ws/landrop/$', LanDropConsumer.as_asgi()),
]
