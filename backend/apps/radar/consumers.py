import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .services import SubnetScannerService, PingBenchmarkService
from .models import NetworkDevice

logger = logging.getLogger(__name__)

class RadarConsumer(AsyncWebsocketConsumer):
    """
    WebSocket channel for Network Radar live scan events, ping benchmarks,
    and rogue intruder alerts.
    """
    async def connect(self):
        await self.accept()
        # Send initial snapshot
        devices = await sync_to_async(lambda: [d.to_dict() for d in NetworkDevice.objects.all()])()
        await self.send(text_data=json.dumps({
            'type': 'radar_snapshot',
            'devices': devices,
        }))

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            payload = json.loads(text_data)
            action = payload.get('action')

            if action == 'scan':
                devices = await sync_to_async(SubnetScannerService.sweep_subnet)()
                await self.send(text_data=json.dumps({
                    'type': 'scan_complete',
                    'devices': devices,
                }))

            elif action == 'ping_test':
                targets = await sync_to_async(PingBenchmarkService.benchmark_targets)()
                await self.send(text_data=json.dumps({
                    'type': 'ping_benchmark_complete',
                    'targets': targets,
                }))

            elif action == 'toggle_trust':
                device_id = payload.get('deviceId')
                if device_id:
                    def _toggle():
                        d = NetworkDevice.objects.get(device_id=device_id)
                        d.is_trusted = not d.is_trusted
                        d.save()
                        return d.to_dict()
                    updated = await sync_to_async(_toggle)()
                    await self.send(text_data=json.dumps({
                        'type': 'device_updated',
                        'device': updated,
                    }))

        except Exception as e:
            logger.error(f"RadarConsumer error: {e}")
            await self.send(text_data=json.dumps({'type': 'error', 'message': str(e)}))
