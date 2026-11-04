from django.db import models
from django.utils import timezone

class DropDevice(models.Model):
    DEVICE_TYPES = [
        ('iphone', 'iPhone'),
        ('android', 'Android'),
        ('mac', 'Mac'),
        ('windows', 'Windows'),
        ('tv', 'Smart TV'),
    ]

    device_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    device_type = models.CharField(max_length=16, choices=DEVICE_TYPES, default='mac')
    ip = models.CharField(max_length=64)
    last_seen = models.CharField(max_length=32, default='Ready')
    is_self = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def to_dict(self):
        return {
            'id': self.device_id,
            'name': self.name,
            'type': self.device_type,
            'ip': self.ip,
            'lastSeen': self.last_seen,
            'isSelf': self.is_self,
        }

class DropFileItem(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('uploading', 'Uploading'),
        ('completed', 'Completed'),
        ('downloaded', 'Downloaded'),
    ]

    file_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    size_bytes = models.BigIntegerField(default=0)
    content_type = models.CharField(max_length=128, default='application/octet-stream')
    sender = models.CharField(max_length=128, default='Local User')
    sender_device = models.CharField(max_length=64, default='MacBook')
    timestamp = models.CharField(max_length=32)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='completed')
    progress = models.IntegerField(default=100)
    file_path = models.CharField(max_length=512, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': self.file_id,
            'name': self.name,
            'size': self.size_bytes,
            'type': self.content_type,
            'sender': self.sender,
            'senderDevice': self.sender_device,
            'timestamp': self.timestamp,
            'status': self.status,
            'progress': self.progress,
            'url': f"/api/landrop/download/{self.file_id}/",
        }
