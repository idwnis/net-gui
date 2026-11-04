import os
import sys
import time
import signal
import logging
import threading
import subprocess
from typing import Dict, Any, Optional, Tuple
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.core.os_adapter import OSAdapter
from apps.ports.services import PortService
from .models import ProjectService, ServiceLogEntry

logger = logging.getLogger(__name__)

class ProcessSupervisor:
    """
    Thread-safe Process Supervisor Engine.
    Spawns, monitors, and streams stdout/stderr from dev processes in real-time.
    """
    _active_processes: Dict[str, subprocess.Popen] = {}
    _reader_threads: Dict[str, list] = {}
    _lock = threading.Lock()

    @classmethod
    def _broadcast_log(cls, service_id: str, service_name: str, log_type: str, message: str):
        """Saves log entry to database and broadcasts via Django Channels."""
        now_str = time.strftime('%H:%M:%S')
        try:
            # Save to database
            svc = ProjectService.objects.filter(service_id=service_id).first()
            if svc:
                ServiceLogEntry.objects.create(
                    service=svc,
                    timestamp=now_str,
                    log_type=log_type,
                    message=message
                )
        except Exception as e:
            logger.debug(f"Error saving log entry: {e}")

        # Broadcast to WebSocket channel group
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    f"runner_logs_{service_id}",
                    {
                        'type': 'service_log_message',
                        'log': {
                            'timestamp': now_str,
                            'type': log_type,
                            'message': message,
                            'serviceId': service_id,
                            'serviceName': service_name,
                        }
                    }
                )
        except Exception as e:
            logger.debug(f"Error broadcasting log: {e}")

    @classmethod
    def _stream_pipe(cls, service_id: str, service_name: str, pipe, log_type: str):
        """Continuously reads lines from pipe and broadcasts them."""
        try:
            for raw_line in iter(pipe.readline, b''):
                if not raw_line:
                    break
                line = raw_line.decode('utf-8', errors='replace').rstrip()
                cls._broadcast_log(service_id, service_name, log_type, line)
        except Exception as e:
            logger.debug(f"Pipe stream ended for {service_id}: {e}")
        finally:
            try:
                pipe.close()
            except Exception:
                pass

    @classmethod
    def start_service(cls, service_id: str) -> Tuple[bool, str]:
        with cls._lock:
            try:
                service = ProjectService.objects.get(service_id=service_id)
            except ProjectService.DoesNotExist:
                return False, f"Service '{service_id}' not found."

            if service_id in cls._active_processes and cls._active_processes[service_id].poll() is None:
                return False, f"Service '{service.name}' is already running with PID {cls._active_processes[service_id].pid}."

            # Check port conflicts if port defined
            if service.port:
                port_check = PortService.check_port(service.port)
                if port_check['occupied']:
                    service.status = 'error'
                    service.save()
                    msg = f"Error: Port {service.port} is already in use by PID {port_check['portInfo']['pid'] if port_check['portInfo'] else 'unknown'}."
                    cls._broadcast_log(service_id, service.name, 'stderr', msg)
                    cls._broadcast_log(service_id, service.name, 'stderr', f"Hint: Auto-rebind port or kill conflicting process.")
                    return False, msg

            cwd = service.cwd or service.project.path
            if not os.path.exists(cwd):
                cwd = os.getcwd()

            cls._broadcast_log(service_id, service.name, 'system', f"[Net GUI Supervisor] Spawning command: {service.command}")

            try:
                platform = OSAdapter.get_platform()
                # Use setsid on POSIX to create a new process group for clean group termination
                preexec = os.setsid if platform != 'win32' else None

                proc = subprocess.Popen(
                    service.command,
                    shell=True,
                    cwd=cwd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    preexec_fn=preexec,
                )

                cls._active_processes[service_id] = proc
                service.status = 'running'
                service.pid = proc.pid
                service.save()

                cls._broadcast_log(service_id, service.name, 'system', f"[Net GUI Supervisor] Service started with PID {proc.pid}")

                # Launch stdout / stderr reader threads
                t_out = threading.Thread(target=cls._stream_pipe, args=(service_id, service.name, proc.stdout, 'stdout'), daemon=True)
                t_err = threading.Thread(target=cls._stream_pipe, args=(service_id, service.name, proc.stderr, 'stderr'), daemon=True)
                t_out.start()
                t_err.start()
                cls._reader_threads[service_id] = [t_out, t_err]

                return True, f"Service '{service.name}' started successfully."
            except Exception as e:
                service.status = 'error'
                service.save()
                err_msg = f"Failed to execute command: {str(e)}"
                cls._broadcast_log(service_id, service.name, 'stderr', err_msg)
                return False, err_msg

    @classmethod
    def stop_service(cls, service_id: str) -> Tuple[bool, str]:
        with cls._lock:
            try:
                service = ProjectService.objects.get(service_id=service_id)
            except ProjectService.DoesNotExist:
                return False, f"Service '{service_id}' not found."

            proc = cls._active_processes.get(service_id)
            pid = service.pid or (proc.pid if proc else None)

            if proc and proc.poll() is None:
                try:
                    platform = OSAdapter.get_platform()
                    if platform != 'win32':
                        # Terminate entire process group
                        try:
                            os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
                        except Exception:
                            proc.terminate()
                    else:
                        subprocess.run(['taskkill', '/F', '/T', '/PID', str(proc.pid)], capture_output=True)

                    proc.wait(timeout=2.0)
                except Exception:
                    try:
                        proc.kill()
                    except Exception:
                        pass

            if pid:
                OSAdapter.kill_process(pid, force=True)

            cls._active_processes.pop(service_id, None)
            cls._reader_threads.pop(service_id, None)

            service.status = 'stopped'
            service.pid = None
            service.save()

            cls._broadcast_log(service_id, service.name, 'system', "[Net GUI Supervisor] Service terminated by user request.")
            return True, f"Service '{service.name}' terminated."

    @classmethod
    def restart_service(cls, service_id: str) -> Tuple[bool, str]:
        cls.stop_service(service_id)
        time.sleep(0.5)
        return cls.start_service(service_id)

    @classmethod
    def rebind_service(cls, service_id: str, target_port: Optional[int] = None) -> Tuple[bool, int, str]:
        """Auto-rebinds a service to an available port."""
        try:
            service = ProjectService.objects.get(service_id=service_id)
        except ProjectService.DoesNotExist:
            return False, 0, "Service not found."

        current_port = target_port or (service.port or 3000)
        candidate = current_port + 1

        # Search for next available port
        while candidate < 65535:
            if not PortService.check_port(candidate)['occupied']:
                break
            candidate += 1

        service.port = candidate
        # Update command if port flag exists
        if f"--port {current_port}" in service.command:
            service.command = service.command.replace(f"--port {current_port}", f"--port {candidate}")
        elif f"-p {current_port}" in service.command:
            service.command = service.command.replace(f"-p {current_port}", f"-p {candidate}")
        elif f":{current_port}" in service.command:
            service.command = service.command.replace(f":{current_port}", f":{candidate}")

        service.save()
        cls._broadcast_log(service_id, service.name, 'system', f"[Net GUI Supervisor] Auto-rebound port to :{candidate}")
        return True, candidate, f"Service rebound to port {candidate}."
