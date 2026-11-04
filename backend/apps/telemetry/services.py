import time
import logging
import psutil
from typing import Dict, Any, List, Optional
from apps.core.os_adapter import OSAdapter

logger = logging.getLogger(__name__)

class TelemetryService:
    _last_net_io: Optional[Any] = None
    _last_net_time: Optional[float] = None
    _cached_port_map: Dict[int, int] = {}
    _last_port_map_time: float = 0

    @classmethod
    def _get_network_rate_kbps(cls) -> Dict[str, float]:
        """Calculates real-time network throughput rate in Kbps."""
        now = time.time()
        current_io = psutil.net_io_counters()

        if cls._last_net_io is None or cls._last_net_time is None:
            cls._last_net_io = current_io
            cls._last_net_time = now
            return {'in_kbps': 0.0, 'out_kbps': 0.0}

        delta_time = max(0.1, now - cls._last_net_time)
        bytes_recv = current_io.bytes_recv - cls._last_net_io.bytes_recv
        bytes_sent = current_io.bytes_sent - cls._last_net_io.bytes_sent

        cls._last_net_io = current_io
        cls._last_net_time = now

        # Convert bytes/s to Kilobits/s: (bytes * 8) / (delta * 1024)
        in_kbps = max(0.0, round((bytes_recv * 8) / (delta_time * 1024), 1))
        out_kbps = max(0.0, round((bytes_sent * 8) / (delta_time * 1024), 1))

        return {'in_kbps': in_kbps, 'out_kbps': out_kbps}

    @classmethod
    def _get_port_pid_map(cls) -> Dict[int, int]:
        """Returns a mapping of PID -> Listening Port, cached for 3 seconds."""
        now = time.time()
        if now - cls._last_port_map_time < 3.0 and cls._cached_port_map:
            return cls._cached_port_map

        port_map = {}
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'LISTEN' and conn.pid:
                    port_map[conn.pid] = conn.laddr.port
        except Exception:
            pass

        cls._cached_port_map = port_map
        cls._last_port_map_time = now
        return port_map

    @classmethod
    def _get_system_temperature(cls) -> float:
        """Retrieves system temperature or returns baseline estimate."""
        try:
            if hasattr(psutil, 'sensors_temperatures'):
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        if entries and entries[0].current:
                            return round(entries[0].current, 1)
        except Exception:
            pass
        return 46.0  # Normalized fallback temperature in Celsius

    @classmethod
    def get_top_processes(cls, limit: int = 5) -> List[Dict[str, Any]]:
        """Returns top resource-consuming processes mapped to active ports."""
        port_map = cls._get_port_pid_map()
        processes = []

        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info']):
            try:
                info = proc.info
                pid = info['pid']
                if pid <= 0:
                    continue

                mem_mb = 0.0
                if info.get('memory_info'):
                    mem_mb = round(info['memory_info'].rss / (1024 * 1024), 1)

                cpu_pct = round(info.get('cpu_percent') or 0.0, 1)

                processes.append({
                    'pid': pid,
                    'name': info.get('name') or 'unknown',
                    'cpu': cpu_pct,
                    'memory': mem_mb,
                    'port': port_map.get(pid),
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

        # Sort by CPU load, then by Memory
        processes.sort(key=lambda p: (p['cpu'], p['memory']), reverse=True)
        return processes[:limit]

    @classmethod
    def get_telemetry(cls) -> Dict[str, Any]:
        """
        Gathers complete snapshot matching the frontend SystemTelemetry interface.
        """
        # CPU usage
        cpu_total = psutil.cpu_percent(interval=None)
        cpu_cores = [round(c, 1) for c in psutil.cpu_percent(interval=None, percpu=True)]

        # Virtual Memory
        vmem = psutil.virtual_memory()
        mem_used_gb = round(vmem.used / (1024 ** 3), 1)
        mem_total_gb = round(vmem.total / (1024 ** 3), 1)

        # Network throughput
        net_rate = cls._get_network_rate_kbps()

        # Temperature
        temp_c = cls._get_system_temperature()

        # Top processes
        top_procs = cls.get_top_processes(limit=6)

        return {
            'cpuUsagePercent': round(cpu_total, 1),
            'cpuCores': cpu_cores,
            'memoryUsedGb': mem_used_gb,
            'memoryTotalGb': mem_total_gb,
            'networkInKbps': net_rate['in_kbps'],
            'networkOutKbps': net_rate['out_kbps'],
            'temperatureC': temp_c,
            'topProcesses': top_procs,
        }

    @classmethod
    def optimize_ram(cls) -> Dict[str, Any]:
        """Triggers cross-platform memory purge via OSAdapter."""
        return OSAdapter.purge_memory()
