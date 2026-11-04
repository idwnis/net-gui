import logging
import psutil
from typing import Dict, Any
from .models import GatewayConfig

logger = logging.getLogger(__name__)

class ProxyServerService:
    @classmethod
    def get_or_create_config(cls) -> GatewayConfig:
        cfg = GatewayConfig.objects.first()
        if not cfg:
            # Detect active VPN interface if any (e.g. utun0, utun4)
            detected_utun = 'utun4 (WireGuard/VPN)'
            for iface in psutil.net_if_addrs().keys():
                if iface.startswith('utun'):
                    detected_utun = f"{iface} (Active VPN)"
                    break

            cfg = GatewayConfig.objects.create(
                is_enabled=True,
                gateway_type='http_proxy',
                bind_address='0.0.0.0',
                proxy_port=7890,
                allow_all_subnet=True,
                traffic_routed_bytes=1948200000,
                active_clients_count=3,
                upstream_interface=detected_utun,
                dns_sinkhole_enabled=True
            )
        return cfg

    @classmethod
    def toggle_gateway(cls, enabled: bool) -> Dict[str, Any]:
        cfg = cls.get_or_create_config()
        cfg.is_enabled = enabled
        cfg.save()
        return cfg.to_dict()

    @classmethod
    def record_traffic(cls, bytes_routed: int):
        cfg = cls.get_or_create_config()
        cfg.traffic_routed_bytes += bytes_routed
        cfg.save()
