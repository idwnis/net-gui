from django.db import models

class GatewayConfig(models.Model):
    GATEWAY_TYPES = [
        ('http_proxy', 'HTTP Proxy'),
        ('socks5', 'SOCKS5 Proxy'),
        ('wireguard', 'WireGuard'),
        ('tailscale', 'Tailscale'),
    ]

    is_enabled = models.BooleanField(default=True)
    gateway_type = models.CharField(max_length=32, choices=GATEWAY_TYPES, default='http_proxy')
    bind_address = models.CharField(max_length=64, default='0.0.0.0')
    proxy_port = models.IntegerField(default=7890)
    allow_all_subnet = models.BooleanField(default=True)
    traffic_routed_bytes = models.BigIntegerField(default=1948200000)
    active_clients_count = models.IntegerField(default=3)
    upstream_interface = models.CharField(max_length=128, default='utun4 (WireGuard/VPN)')
    dns_sinkhole_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            'isEnabled': self.is_enabled,
            'gatewayType': self.gateway_type,
            'bindAddress': self.bind_address,
            'proxyPort': self.proxy_port,
            'allowAllSubnet': self.allow_all_subnet,
            'trafficRoutedBytes': self.traffic_routed_bytes,
            'activeClientsCount': self.active_clients_count,
            'upstreamInterface': self.upstream_interface,
            'dnsSinkholeEnabled': self.dns_sinkhole_enabled,
        }

class DNSQueryLog(models.Model):
    QUERY_TYPES = [
        ('A', 'A'),
        ('AAAA', 'AAAA'),
        ('HTTPS', 'HTTPS'),
    ]

    STATUS_CHOICES = [
        ('blocked', 'Blocked'),
        ('forwarded', 'Forwarded'),
    ]

    CATEGORIES = [
        ('ad', 'Ad'),
        ('telemetry', 'Telemetry'),
        ('tracker', 'Tracker'),
        ('malware', 'Malware'),
    ]

    query_id = models.CharField(max_length=64, unique=True, db_index=True)
    timestamp = models.CharField(max_length=32)
    domain = models.CharField(max_length=255, db_index=True)
    client_ip = models.CharField(max_length=64)
    client_name = models.CharField(max_length=128)
    query_type = models.CharField(max_length=16, choices=QUERY_TYPES, default='A')
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='forwarded')
    category = models.CharField(max_length=32, choices=CATEGORIES, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': self.query_id,
            'timestamp': self.timestamp,
            'domain': self.domain,
            'clientIp': self.client_ip,
            'clientName': self.client_name,
            'type': self.query_type,
            'status': self.status,
            'category': self.category,
        }
