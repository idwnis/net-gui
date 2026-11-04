import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import SnifferPacket

logger = logging.getLogger(__name__)

THROTTLE_PROFILES = [
    {'id': 'none', 'name': 'No Throttling (Gigabit)', 'downloadKbps': 1000000, 'uploadKbps': 500000, 'latencyMs': 0, 'packetLossPercent': 0.0},
    {'id': 'fast4g', 'name': 'Fast 4G (40 Mbps)', 'downloadKbps': 40000, 'uploadKbps': 15000, 'latencyMs': 20, 'packetLossPercent': 0.0},
    {'id': 'slow3g', 'name': 'Slow 3G (400 Kbps)', 'downloadKbps': 400, 'uploadKbps': 100, 'latencyMs': 320, 'packetLossPercent': 1.5},
    {'id': 'flaky', 'name': 'Flaky Connection (High Jitter)', 'downloadKbps': 2000, 'uploadKbps': 500, 'latencyMs': 180, 'packetLossPercent': 5.0},
]

class ThrottleService:
    _current_profile = THROTTLE_PROFILES[0]

    @classmethod
    def get_current_profile(cls) -> Dict[str, Any]:
        return cls._current_profile

    @classmethod
    def set_profile(cls, profile_id: str) -> Dict[str, Any]:
        for p in THROTTLE_PROFILES:
            if p['id'] == profile_id:
                cls._current_profile = p
                return p
        cls._current_profile = THROTTLE_PROFILES[0]
        return cls._current_profile

    @classmethod
    def get_all_profiles(cls) -> List[Dict[str, Any]]:
        return THROTTLE_PROFILES

class SnifferService:
    @classmethod
    def record_packet(
        cls,
        method: str,
        url: str,
        status: int,
        duration_ms: int,
        size_bytes: int,
        source_app: str = 'Client App',
        content_type: str = 'application/json',
        request_headers: Optional[Dict[str, str]] = None,
        response_headers: Optional[Dict[str, str]] = None,
        request_body_preview: str = '',
        response_body_preview: str = ''
    ) -> SnifferPacket:
        """Saves captured packet and broadcasts to WebSocket channel."""
        packet_id = f"sniff-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}"
        timestamp = time.strftime('%H:%M:%S') + f".{int((time.time() % 1) * 1000):03d}"

        packet = SnifferPacket.objects.create(
            packet_id=packet_id,
            timestamp=timestamp,
            method=method,
            url=url,
            status=status,
            duration_ms=duration_ms,
            size_bytes=size_bytes,
            source_app=source_app,
            content_type=content_type,
            request_headers=request_headers or {},
            response_headers=response_headers or {},
            request_body_preview=request_body_preview,
            response_body_preview=response_body_preview,
        )

        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "sniffer_traffic",
                    {
                        'type': 'sniffer_packet_event',
                        'packet': packet.to_dict(),
                    }
                )
        except Exception as e:
            logger.debug(f"Failed to broadcast sniffer packet: {e}")

        return packet

    @classmethod
    def get_packets(cls, limit: int = 100) -> List[Dict[str, Any]]:
        packets = SnifferPacket.objects.all()[:limit]

        # Seed initial packets if DB is fresh
        if not packets.exists():
            cls.record_packet(
                method='GET',
                url='http://localhost:8000/api/radar/devices/',
                status=200,
                duration_ms=14,
                size_bytes=2480,
                source_app='Vite Frontend (5173)',
                content_type='application/json',
                request_headers={'accept': 'application/json', 'user-agent': 'Net GUI/2.0'},
                response_headers={'content-type': 'application/json'},
                response_body_preview='{"status":"ok","total":7,"devices":[{"ip":"192.168.1.1","status":"online"}]}'
            )
            cls.record_packet(
                method='POST',
                url='https://api.openai.com/v1/chat/completions',
                status=401,
                duration_ms=182,
                size_bytes=420,
                source_app='AI Agent Service (3000)',
                content_type='application/json',
                request_headers={'authorization': 'Bearer invalid_or_expired_key', 'content-type': 'application/json'},
                response_headers={'content-type': 'application/json'},
                request_body_preview='{"model":"gpt-4o","messages":[{"role":"user","content":"Diagnose error"}]}',
                response_body_preview='{"error":{"message":"Incorrect API key provided: invalid_***. Check your settings.","type":"invalid_request_error"}}'
            )
            cls.record_packet(
                method='POST',
                url='http://127.0.0.1:8000/api/checkout/session',
                status=500,
                duration_ms=44,
                size_bytes=1240,
                source_app='Django Storefront (8000)',
                content_type='application/json',
                request_headers={'content-type': 'application/json'},
                response_headers={'content-type': 'text/html'},
                response_body_preview='OperationalError: could not connect to server: Connection refused (PostgreSQL :5432)'
            )
            cls.record_packet(
                method='WS',
                url='ws://localhost:5173/',
                status=101,
                duration_ms=0,
                size_bytes=310,
                source_app='Vite HMR WebSocket',
                content_type='websocket/binary',
                request_headers={'upgrade': 'websocket', 'connection': 'Upgrade'},
                response_headers={'upgrade': 'websocket'},
                response_body_preview='{"type":"connected"}'
            )
            packets = SnifferPacket.objects.all()[:limit]

        return [p.to_dict() for p in packets]

    @classmethod
    def clear_packets(cls):
        SnifferPacket.objects.all().delete()
