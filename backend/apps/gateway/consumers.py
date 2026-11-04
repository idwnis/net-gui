import json
from channels.generic.websocket import AsyncWebsocketConsumer

class DNSQueryConsumer(AsyncWebsocketConsumer):
    """
    WebSocket channel streaming real-time DNS queries and sinkhole block events.
    Channel: /ws/gateway/dns/
    """
    async def connect(self):
        self.group_name = "gateway_dns_queries"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def dns_query_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'dns_query',
            'query': event['query'],
        }))
