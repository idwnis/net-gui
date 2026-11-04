import json
from channels.generic.websocket import AsyncWebsocketConsumer

class SnifferConsumer(AsyncWebsocketConsumer):
    """
    WebSocket channel streaming live intercepted network packets.
    Channel: /ws/sniffer/
    """
    async def connect(self):
        self.group_name = "sniffer_traffic"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def sniffer_packet_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'packet_captured',
            'packet': event['packet'],
        }))
