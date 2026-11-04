import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import ProjectService, ServiceLogEntry

logger = logging.getLogger(__name__)

class ServiceLogsConsumer(AsyncWebsocketConsumer):
    """
    Streams live stdout/stderr log lines for a specific service in real-time.
    Channel: /ws/runner/logs/<service_id>/
    """
    async def connect(self):
        self.service_id = self.scope['url_route']['kwargs'].get('service_id')
        self.group_name = f"runner_logs_{self.service_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        # Stream recent historical logs
        def get_recent_logs():
            entries = ServiceLogEntry.objects.filter(
                service__service_id=self.service_id
            ).order_by('-id')[:60]
            return [e.to_dict() for e in reversed(entries)]

        recent_logs = await sync_to_async(get_recent_logs)()
        await self.send(text_data=json.dumps({
            'type': 'history_logs',
            'serviceId': self.service_id,
            'logs': recent_logs,
        }))

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def service_log_message(self, event):
        """Handler for group messages broadcasted by ProcessSupervisor."""
        await self.send(text_data=json.dumps({
            'type': 'log_entry',
            'log': event['log'],
        }))
