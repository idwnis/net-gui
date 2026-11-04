from django.db import models

class SnifferPacket(models.Model):
    packet_id = models.CharField(max_length=64, unique=True, db_index=True)
    timestamp = models.CharField(max_length=32)
    method = models.CharField(max_length=16)
    url = models.CharField(max_length=512)
    status = models.IntegerField(default=200)
    duration_ms = models.IntegerField(default=0)
    size_bytes = models.IntegerField(default=0)
    source_app = models.CharField(max_length=128, default='Application')
    content_type = models.CharField(max_length=128, default='application/json')
    request_headers = models.JSONField(default=dict)
    response_headers = models.JSONField(default=dict)
    request_body_preview = models.TextField(blank=True, default='')
    response_body_preview = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': self.packet_id,
            'timestamp': self.timestamp,
            'method': self.method,
            'url': self.url,
            'status': self.status,
            'durationMs': self.duration_ms,
            'sizeBytes': self.size_bytes,
            'sourceApp': self.source_app,
            'contentType': self.content_type,
            'requestHeaders': self.request_headers or {},
            'responseHeaders': self.response_headers or {},
            'requestBodyPreview': self.request_body_preview or '',
            'responseBodyPreview': self.response_body_preview or '',
        }
