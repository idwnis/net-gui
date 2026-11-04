from django.db import models
from django.utils import timezone

class NetworkDevice(models.Model):
    DEVICE_TYPES = [
        ('router', 'Router / Gateway'),
        ('computer', 'Computer / Workstation'),
        ('mobile', 'Mobile Device'),
        ('iot', 'IoT / Embedded Device'),
        ('printer', 'Network Printer'),
        ('server', 'Server / NAS'),
        ('smart-tv', 'Smart TV / Media Player'),
        ('unknown', 'Unknown Device'),
    ]

    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
    ]

    device_id = models.CharField(max_length=64, unique=True, db_index=True)
    ip = models.GenericIPAddressField(db_index=True)
    mac = models.CharField(max_length=32, db_index=True)
    vendor = models.CharField(max_length=128, default='Generic Device')
    hostname = models.CharField(max_length=255, default='unknown-host')
    device_type = models.CharField(max_length=32, choices=DEVICE_TYPES, default='unknown')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='online')
    latency_ms = models.FloatField(default=1.0)
    open_ports = models.JSONField(default=list, blank=True)
    os_hint = models.CharField(max_length=128, blank=True, default='')
    last_seen = models.DateTimeField(default=timezone.now)
    is_local_host = models.BooleanField(default=False)
    is_trusted = models.BooleanField(default=True)
    supports_wol = models.BooleanField(default=True)
    download_rate_kbps = models.FloatField(default=0.0)
    upload_rate_kbps = models.FloatField(default=0.0)

    class Meta:
        ordering = ['ip']
        verbose_name = 'Network Device'
        verbose_name_plural = 'Network Devices'

    def __str__(self):
        return f"{self.hostname} ({self.ip}) - {self.mac}"

    def to_dict(self):
        """Converts model instance to the exact camelCase structure expected by UI."""
        return {
            'id': self.device_id,
            'ip': self.ip,
            'mac': self.mac,
            'vendor': self.vendor,
            'hostname': self.hostname,
            'deviceType': self.device_type,
            'status': self.status,
            'latencyMs': self.latency_ms,
            'openPorts': self.open_ports or [],
            'osHint': self.os_hint or '',
            'lastSeen': 'Just now' if (timezone.now() - self.last_seen).total_seconds() < 120 else f"{int((timezone.now() - self.last_seen).total_seconds() // 60)} min ago",
            'isLocalHost': self.is_local_host,
            'isTrusted': self.is_trusted,
            'supportsWol': self.supports_wol,
            'downloadRateKbps': self.download_rate_kbps,
            'uploadRateKbps': self.upload_rate_kbps,
        }

class PingTarget(models.Model):
    STATUS_CHOICES = [
        ('excellent', 'Excellent'),
        ('good', 'Good'),
        ('poor', 'Poor'),
        ('down', 'Down'),
    ]

    target_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    host = models.CharField(max_length=255)
    latency_ms = models.FloatField(default=0.0)
    history = models.JSONField(default=list, blank=True)
    jitter_ms = models.FloatField(default=0.0)
    packet_loss_percent = models.FloatField(default=0.0)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='good')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} ({self.host})"

    def to_dict(self):
        return {
            'id': self.target_id,
            'name': self.name,
            'host': self.host,
            'latencyMs': self.latency_ms,
            'history': self.history or [],
            'jitterMs': self.jitter_ms,
            'packetLossPercent': self.packet_loss_percent,
            'status': self.status,
        }
