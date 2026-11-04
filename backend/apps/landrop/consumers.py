import json
from channels.generic.websocket import AsyncWebsocketConsumer

class LanDropConsumer(AsyncWebsocketConsumer):
    """
    WebSocket channel for LAN Drop real-time file transfer progress and alerts.
    Channel: /ws/landrop/
    """
    async def connect(self):
        self.group_name = "landrop_transfers"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def drop_file_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'file_received',
            'file': event['file'],
        }))
