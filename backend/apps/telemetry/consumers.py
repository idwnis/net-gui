import asyncio
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .services import TelemetryService

logger = logging.getLogger(__name__)

class TelemetryConsumer(AsyncWebsocketConsumer):
    """
    Streams system telemetry (CPU cores, RAM, network throughput, top processes)
    at 1Hz over WebSocket /ws/telemetry/.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.stream_task: asyncio.Task | None = None
        self.is_streaming = False

    async def connect(self):
        await self.accept()
        self.is_streaming = True
        self.stream_task = asyncio.create_task(self._stream_telemetry_loop())

    async def disconnect(self, close_code):
        self.is_streaming = False
        if self.stream_task and not self.stream_task.done():
            self.stream_task.cancel()

    async def _stream_telemetry_loop(self):
        try:
            while self.is_streaming:
                telemetry_data = await sync_to_async(TelemetryService.get_telemetry)()
                await self.send(text_data=json.dumps({
                    'type': 'telemetry_update',
                    'data': telemetry_data,
                }))
                await asyncio.sleep(1.0)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error streaming telemetry: {e}")

    async def receive(self, text_data=None, bytes_data=None):
        if not text_data:
            return
        try:
            payload = json.loads(text_data)
            action = payload.get('action')

            if action == 'optimize_ram':
                result = await sync_to_async(TelemetryService.optimize_ram)()
                await self.send(text_data=json.dumps({
                    'type': 'ram_optimized',
                    'result': result,
                }))
            elif action == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception as e:
            await self.send(text_data=json.dumps({'type': 'error', 'message': str(e)}))
