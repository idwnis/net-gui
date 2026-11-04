import os
import sys
import gc
import ctypes
import socket
import logging
import subprocess
import psutil
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

class OSAdapter:
    """
    Cross-Platform OS & Hardware Abstraction Layer.
    Provides uniform interfaces for macOS (Darwin), Windows (Win32), and Linux.
    """

    @staticmethod
    def get_platform() -> str:
        """Returns normalized platform identifier: 'darwin', 'win32', or 'linux'."""
        if sys.platform.startswith('darwin'):
            return 'darwin'
        elif sys.platform.startswith('win'):
            return 'win32'
        return 'linux'

    @classmethod
    def get_host_info(cls) -> Dict[str, Any]:
        """Returns baseline system identity and platform details."""
        return {
            'platform': cls.get_platform(),
            'platform_raw': sys.platform,
            'hostname': socket.gethostname(),
            'is_root': os.geteuid() == 0 if hasattr(os, 'geteuid') else False,
        }

    @classmethod
    def get_primary_interface(cls) -> Dict[str, Any]:
        """
        Detects primary active network interface, local IP, and MAC address.
        Works across macOS, Linux, and Windows.
        Prioritizes real physical LAN interfaces (en0, eth0, wlan0) over virtual tunnels.
        """
        net_if_addrs = psutil.net_if_addrs()
        detected_iface = 'unknown'
        primary_ip = '127.0.0.1'

        # 1. Prefer physical interfaces with private IPv4 address
        preferred_names = ['en0', 'en1', 'eth0', 'eth1', 'wlan0', 'Wi-Fi', 'Ethernet']
        found = False
        for iface in preferred_names:
            if iface in net_if_addrs:
                for addr in net_if_addrs[iface]:
                    if addr.family == socket.AF_INET and not addr.address.startswith('127.'):
                        primary_ip = addr.address
                        detected_iface = iface
                        found = True
                        break
            if found:
                break

        # 2. If not found, look for any non-virtual interface with IPv4
        if not found:
            for iface_name, addrs in net_if_addrs.items():
                if iface_name.startswith(('utun', 'tun', 'tap', 'lo', 'docker', 'br-')):
                    continue
                for addr in addrs:
                    if addr.family == socket.AF_INET and not addr.address.startswith('127.') and not addr.address.startswith('198.18.'):
                        primary_ip = addr.address
                        detected_iface = iface_name
                        found = True
                        break
                if found:
                    break

        # 3. Fallback to default route probe
        if not found:
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(('8.8.8.8', 80))
                primary_ip = s.getsockname()[0]
                s.close()
            except Exception:
                pass

        # Detect real MAC address
        mac_address = '00:00:00:00:00:00'
        if detected_iface in net_if_addrs:
            for addr in net_if_addrs[detected_iface]:
                if hasattr(psutil, 'AF_LINK') and addr.family == psutil.AF_LINK and addr.address:
                    mac_address = addr.address.upper()
                elif hasattr(socket, 'AF_PACKET') and addr.family == socket.AF_PACKET and addr.address:
                    mac_address = addr.address.upper()

        if mac_address == '00:00:00:00:00:00' and cls.get_platform() == 'darwin' and detected_iface != 'unknown':
            try:
                res = subprocess.run(['ifconfig', detected_iface], capture_output=True, text=True, timeout=2)
                import re
                match = re.search(r'ether\s+([0-9a-fA-F:]+)', res.stdout)
                if match:
                    mac_address = match.group(1).upper()
            except Exception:
                pass

        return {
            'interface': detected_iface,
            'ip': primary_ip,
            'mac': mac_address,
        }

    @classmethod
    def purge_memory(cls) -> Dict[str, Any]:
        """
        Purges system & process memory across Darwin, Linux, and Windows.
        - macOS: runs system 'purge' binary (if available) + gc.collect()
        - Linux: triggers malloc_trim(0) and system sync + gc.collect()
        - Windows: calls EmptyWorkingSet via psapi + gc.collect()
        """
        platform = cls.get_platform()
        initial_mem = psutil.virtual_memory().used
        freed_estimate = 0
        method_used = 'gc_only'

        # Universal Python garbage collection
        gc.collect()

        if platform == 'darwin':
            # On macOS, attempt native purge
            try:
                res = subprocess.run(['purge'], capture_output=True, timeout=5)
                if res.returncode == 0:
                    method_used = 'darwin_purge'
            except Exception as e:
                logger.debug(f"Darwin purge fallback: {e}")

        elif platform == 'linux':
            # On Linux, try malloc_trim via libc
            try:
                libc = ctypes.CDLL('libc.so.6')
                if hasattr(libc, 'malloc_trim'):
                    libc.malloc_trim(0)
                    method_used = 'linux_malloc_trim'
            except Exception as e:
                logger.debug(f"Linux malloc_trim fallback: {e}")

        elif platform == 'win32':
            # On Windows, try EmptyWorkingSet
            try:
                psapi = ctypes.windll.psapi
                kernel32 = ctypes.windll.kernel32
                handle = kernel32.GetCurrentProcess()
                psapi.EmptyWorkingSet(handle)
                method_used = 'win32_empty_working_set'
            except Exception as e:
                logger.debug(f"Win32 EmptyWorkingSet fallback: {e}")

        final_mem = psutil.virtual_memory().used
        freed_estimate = max(0, initial_mem - final_mem)

        return {
            'status': 'success',
            'method': method_used,
            'freed_bytes': freed_estimate,
            'freed_mb': round(freed_estimate / (1024 * 1024), 2),
            'memory_used_gb': round(final_mem / (1024 ** 3), 2),
            'memory_total_gb': round(psutil.virtual_memory().total / (1024 ** 3), 2),
        }

    @classmethod
    def kill_process(cls, pid: int, force: bool = True) -> Tuple[bool, str]:
        """
        Cross-platform safe process termination.
        Attempts graceful SIGTERM, then forceful SIGKILL.
        """
        if pid <= 1:
            return False, "Cannot terminate system init process."

        try:
            proc = psutil.Process(pid)
            name = proc.name()
        except psutil.NoSuchProcess:
            return True, f"Process with PID {pid} is already terminated."
        except psutil.AccessDenied:
            return False, f"Permission denied to access PID {pid}."

        try:
            # Terminate gracefully first
            proc.terminate()
            gone, alive = psutil.wait_procs([proc], timeout=1.5)

            if alive and force:
                for p in alive:
                    p.kill()
                psutil.wait_procs(alive, timeout=1.0)

            return True, f"Successfully terminated process '{name}' (PID {pid})."
        except psutil.NoSuchProcess:
            return True, f"Process '{name}' (PID {pid}) was successfully released."
        except psutil.AccessDenied:
            return False, f"Permission denied to terminate PID {pid} (owned by another user)."
        except Exception as e:
            return False, f"Error terminating process PID {pid}: {str(e)}"
