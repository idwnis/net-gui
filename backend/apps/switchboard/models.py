from django.db import models

class LocalLLMModel(models.Model):
    STATUS_CHOICES = [
        ('loaded_in_vram', 'Loaded in VRAM'),
        ('on_disk', 'On Disk'),
        ('downloading', 'Downloading'),
    ]

    model_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    tag = models.CharField(max_length=128)
    family = models.CharField(max_length=64, default='llama')
    parameter_size = models.CharField(max_length=32, default='8B')
    quantization = models.CharField(max_length=32, default='Q4_K_M')
    size_gb = models.FloatField(default=4.0)
    vram_usage_gb = models.FloatField(default=0.0)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default='on_disk')
    context_length = models.IntegerField(default=32768)
    last_used = models.CharField(max_length=64, default='Recently')

    class Meta:
        ordering = ['-status', 'name']

    def to_dict(self):
        return {
            'id': self.model_id,
            'name': self.name,
            'tag': self.tag,
            'family': self.family,
            'parameterSize': self.parameter_size,
            'quantization': self.quantization,
            'sizeGb': self.size_gb,
            'vramUsageGb': self.vram_usage_gb,
            'status': self.status,
            'contextLength': self.context_length,
            'lastUsed': self.last_used,
        }
