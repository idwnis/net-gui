import socket
import logging
import subprocess
import psutil
from typing import List, Dict, Any, Optional
from apps.core.os_adapter import OSAdapter

logger = logging.getLogger(__name__)

class PortService:
    @staticmethod
    def _parse_lsof_ports() -> List[Dict[str, Any]]:
        """
        Executes 'lsof -i -P -n' on macOS / Linux to enumerate listening sockets.
        On macOS, this provides unprivileged access to listening sockets that
        psutil.net_connections() cannot access without root permissions.
        """
        ports = []
        platform = OSAdapter.get_platform()
        if platform not in ('darwin', 'linux'):
            return ports

        try:
            cmd = ['lsof', '-iTCP', '-sTCP:LISTEN', '-P', '-n']
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=3)
            if res.returncode == 0:
                lines = res.stdout.strip().split('\n')[1:]  # skip header
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 9:
                        raw_cmd = parts[0].replace('\\x20', ' ')
                        pid = int(parts[1]) if parts[1].isdigit() else 0
                        user = parts[2]
                        addr_part = parts[8]

                        # Address formatting, e.g., *:5173 or 127.0.0.1:8000 or [::1]:3000
                        address = '0.0.0.0'
                        port_str = ''

                        if ':' in addr_part:
                            last_colon = addr_part.rfind(':')
                            host_part = addr_part[:last_colon]
                            port_str = addr_part[last_colon + 1:]

                            if host_part in ('*', '[::]'):
                                address = '0.0.0.0'
                            elif host_part == '[::1]':
                                address = '127.0.0.1'
                            else:
                                address = host_part.strip('[]')

                        if not port_str.isdigit():
                            continue

                        port = int(port_str)
                        proc_name = raw_cmd
                        binary_path = ''
                        cpu_pct = 0.0
                        mem_mb = 0.0

                        if pid > 0:
                            try:
                                proc = psutil.Process(pid)
                                proc_name = proc.name()
                                user = proc.username()
                                try:
                                    binary_path = proc.exe()
                                except Exception:
                                    binary_path = ' '.join(proc.cmdline()[:1]) if proc.cmdline() else proc_name
                                cpu_pct = round(proc.cpu_percent(), 1)
                                if proc.memory_info():
                                    mem_mb = round(proc.memory_info().rss / (1024 * 1024), 1)
                            except (psutil.NoSuchProcess, psutil.AccessDenied):
                                pass

                        ports.append({
                            'id': f"port-tcp-{port}-{address.replace('.', '_')}",
                            'port': port,
                            'protocol': 'TCP',
                            'address': address,
                            'state': 'LISTEN',
                            'pid': pid,
                            'processName': proc_name,
                            'binaryPath': binary_path,
                            'user': user,
                            'cpuPercent': cpu_pct,
                            'memoryMb': mem_mb,
                        })
        except Exception as e:
            logger.debug(f"lsof extraction error: {e}")

        return ports

    @classmethod
    def get_system_ports(cls, listen_only: bool = True) -> List[Dict[str, Any]]:
        """
        Scans all active TCP and UDP sockets across the machine,
        associating process metadata (PID, binary, user, CPU/RAM).
        Uses both psutil and native OS tools (lsof) for maximum cross-platform reliability.
        """
        ports_list = []
        seen_keys = set()

        # Primary or fallback: read via lsof on Unix/macOS
        lsof_entries = cls._parse_lsof_ports()
        for p in lsof_entries:
            key = (p['port'], p['protocol'], p['address'])
            if key not in seen_keys:
                seen_keys.add(key)
                ports_list.append(p)

        # Supplement with psutil if accessible
        try:
            connections = psutil.net_connections(kind='inet')
        except psutil.AccessDenied:
            logger.debug("psutil.net_connections restricted; relying on OS-level tool data.")
            connections = []
        except Exception as e:
            logger.debug(f"psutil.net_connections error: {e}")
            connections = []

        for conn in connections:
            try:
                protocol = 'TCP' if conn.type == socket.SOCK_STREAM else 'UDP'
                state = conn.status if conn.status else ('LISTEN' if protocol == 'UDP' else 'UNKNOWN')

                if listen_only and state != 'LISTEN' and protocol == 'TCP':
                    continue

                if not conn.laddr:
                    continue

                port = conn.laddr.port
                address = conn.laddr.ip if conn.laddr.ip else '0.0.0.0'
                pid = conn.pid or 0

                unique_key = (port, protocol, address)
                if unique_key in seen_keys:
                    continue
                seen_keys.add(unique_key)

                proc_name = 'system'
                binary_path = ''
                user = 'system'
                cpu_pct = 0.0
                mem_mb = 0.0

                if pid > 0:
                    try:
                        proc = psutil.Process(pid)
                        proc_name = proc.name()
                        user = proc.username()
                        try:
                            binary_path = proc.exe()
                        except Exception:
                            binary_path = ' '.join(proc.cmdline()[:1]) if proc.cmdline() else proc_name
                        cpu_pct = round(proc.cpu_percent(), 1)
                        if proc.memory_info():
                            mem_mb = round(proc.memory_info().rss / (1024 * 1024), 1)
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass

                ports_list.append({
                    'id': f"port-{protocol.lower()}-{port}-{address.replace('.', '_')}",
                    'port': port,
                    'protocol': protocol,
                    'address': address,
                    'state': state,
                    'pid': pid,
                    'processName': proc_name,
                    'binaryPath': binary_path,
                    'user': user,
                    'cpuPercent': cpu_pct,
                    'memoryMb': mem_mb,
                })
            except Exception:
                continue

        # Sort primarily by port number
        ports_list.sort(key=lambda p: p['port'])
        return ports_list

    @classmethod
    def check_port(cls, port: int) -> Dict[str, Any]:
        """
        Probes a specific port to determine whether it is free or in use.
        Returns port occupation status and process metadata if in use.
        """
        occupied = False
        port_info = None

        # First probe via low-level socket binding test
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                s.bind(('0.0.0.0', port))
        except (OSError, socket.error):
            occupied = True

        # Locate associated process info from active connections
        all_ports = cls.get_system_ports(listen_only=False)
        for p in all_ports:
            if p['port'] == port:
                occupied = True
                port_info = p
                break

        return {
            'port': port,
            'occupied': occupied,
            'portInfo': port_info,
        }

    @classmethod
    def kill_process(cls, pid: int) -> Dict[str, Any]:
        """
        Terminates the process holding a port using cross-platform OSAdapter.
        """
        success, message = OSAdapter.kill_process(pid=pid, force=True)
        return {
            'success': success,
            'message': message,
            'pid': pid,
        }
