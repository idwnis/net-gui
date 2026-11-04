from rest_framework import serializers
from .models import NetworkDevice, PingTarget

class NetworkDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NetworkDevice
        fields = [
            'device_id', 'ip', 'mac', 'vendor', 'hostname',
            'device_type', 'status', 'latency_ms', 'open_ports',
            'os_hint', 'last_seen', 'is_local_host', 'is_trusted',
            'supports_wol', 'download_rate_kbps', 'upload_rate_kbps'
        ]

class PingTargetSerializer(serializers.ModelSerializer):
    class Meta:
        model = PingTarget
        fields = [
            'target_id', 'name', 'host', 'latency_ms',
            'history', 'jitter_ms', 'packet_loss_percent',
            'status', 'updated_at'
        ]
