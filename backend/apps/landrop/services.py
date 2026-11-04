import os
import time
import uuid
import logging
from typing import Dict, Any, List, Optional
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.core.os_adapter import OSAdapter
from apps.radar.models import NetworkDevice
from .models import DropDevice, DropFileItem

logger = logging.getLogger(__name__)

class LanDropService:
    MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'media', 'landrop')

    @classmethod
    def get_nearby_devices(cls) -> List[Dict[str, Any]]:
        """Returns peer devices discovered on the local Wi-Fi network."""
        primary = OSAdapter.get_primary_interface()
        local_ip = primary.get('ip', '127.0.0.1')

        # Ensure Self Device is seeded
        DropDevice.objects.update_or_create(
            device_id='drop-self',
            defaults={
                'name': f"{OSAdapter.get_host_info()['hostname']} (This Device)",
                'device_type': 'mac' if OSAdapter.get_platform() == 'darwin' else ('windows' if OSAdapter.get_platform() == 'win32' else 'mac'),
                'ip': local_ip,
                'last_seen': 'Active',
                'is_self': True,
            }
        )

        # Map discovered peers from apps.radar
        radar_devices = NetworkDevice.objects.exclude(ip=local_ip)[:5]
        for rd in radar_devices:
            dev_type = 'mac'
            if rd.device_type == 'mobile':
                dev_type = 'iphone' if 'apple' in rd.vendor.lower() else 'android'
            elif rd.device_type == 'smart-tv':
                dev_type = 'tv'
            elif rd.device_type == 'computer':
                dev_type = 'windows' if 'win' in rd.os_hint.lower() else 'mac'

            DropDevice.objects.update_or_create(
                device_id=f"drop-{rd.device_id}",
                defaults={
                    'name': rd.hostname if rd.hostname != 'unknown-host' else f"{rd.vendor} ({rd.ip})",
                    'device_type': dev_type,
                    'ip': rd.ip,
                    'last_seen': 'Ready',
                    'is_self': False,
                }
            )

        devices = DropDevice.objects.all()
        return [d.to_dict() for d in devices]

    @classmethod
    def save_file(cls, filename: str, content: bytes, content_type: str, sender: str = 'Local User', sender_device: str = 'Workstation') -> DropFileItem:
        """Stores uploaded file on disk and broadcasts transfer event."""
        os.makedirs(cls.MEDIA_DIR, exist_ok=True)
        file_id = f"drop-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}"

        clean_filename = os.path.basename(filename)
        dest_path = os.path.join(cls.MEDIA_DIR, f"{file_id}_{clean_filename}")

        with open(dest_path, 'wb') as f:
            f.write(content)

        timestamp = time.strftime('%I:%M %p')

        drop_file = DropFileItem.objects.create(
            file_id=file_id,
            name=clean_filename,
            size_bytes=len(content),
            content_type=content_type,
            sender=sender,
            sender_device=sender_device,
            timestamp=timestamp,
            status='completed',
            progress=100,
            file_path=dest_path
        )

        # Broadcast event
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "landrop_transfers",
                    {
                        'type': 'drop_file_event',
                        'file': drop_file.to_dict(),
                    }
                )
        except Exception as e:
            logger.debug(f"Failed to broadcast landrop event: {e}")

        return drop_file

    @classmethod
    def get_file_path(cls, file_id: str) -> Optional[str]:
        drop_file = DropFileItem.objects.filter(file_id=file_id).first()
        if drop_file and drop_file.file_path and os.path.exists(drop_file.file_path):
            return drop_file.file_path
        return None
