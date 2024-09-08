import json
from channels.generic.websocket import AsyncWebsocketConsumer

class CallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_email = self.scope['user'].email
        await self.channel_layer.group_add(self.user_email, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.user_email, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        recipient_email = data['to']

        await self.channel_layer.group_send(
            recipient_email,
            {
                'type': 'send_signal',
                'data': data
            }
        )

    async def send_signal(self, event):
        await self.send(text_data=json.dumps(event['data']))
