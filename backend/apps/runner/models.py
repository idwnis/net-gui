from django.db import models
from django.utils import timezone

class DevProject(models.Model):
    SOURCE_TYPES = [
        ('local_folder', 'Local Folder'),
        ('github_repo', 'GitHub Repository'),
        ('custom_instructions', 'Custom Instructions'),
    ]

    project_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True, default='')
    source_type = models.CharField(max_length=32, choices=SOURCE_TYPES, default='local_folder')
    path = models.CharField(max_length=512)
    github_url = models.URLField(max_length=512, blank=True, null=True)
    custom_instructions = models.TextField(blank=True, null=True)
    detected_stack = models.JSONField(default=dict, blank=True)
    env_variables = models.JSONField(default=list, blank=True)
    cloud_deployment = models.JSONField(default=dict, blank=True, null=True)
    vercel_deployment = models.JSONField(default=dict, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Dev Project'
        verbose_name_plural = 'Dev Projects'

    def __str__(self):
        return f"{self.name} ({self.project_id})"

    def to_dict(self):
        return {
            'id': self.project_id,
            'name': self.name,
            'description': self.description,
            'sourceType': self.source_type,
            'path': self.path,
            'githubUrl': self.github_url,
            'customInstructions': self.custom_instructions,
            'detectedStack': self.detected_stack or {'frameworks': [], 'runtimes': [], 'filesFound': []},
            'services': [svc.to_dict() for svc in self.services.all()],
            'createdAt': self.created_at.strftime('%Y-%m-%d %H:%M'),
            'envVariables': self.env_variables or [],
            'webhooks': [wh.to_dict() for wh in self.webhooks.all()],
            'cloudDeployment': self.cloud_deployment,
            'vercelDeployment': self.vercel_deployment,
        }

class ProjectService(models.Model):
    CATEGORIES = [
        ('node', 'Node.js'),
        ('django', 'Django'),
        ('docker', 'Docker'),
        ('python', 'Python'),
        ('custom', 'Custom Script'),
    ]

    STATUS_CHOICES = [
        ('stopped', 'Stopped'),
        ('running', 'Running'),
        ('starting', 'Starting'),
        ('error', 'Error'),
    ]

    project = models.ForeignKey(DevProject, related_name='services', on_delete=models.CASCADE)
    service_id = models.CharField(max_length=64, unique=True, db_index=True)
    name = models.CharField(max_length=128)
    category = models.CharField(max_length=16, choices=CATEGORIES, default='custom')
    command = models.CharField(max_length=512)
    cwd = models.CharField(max_length=512, blank=True, null=True)
    port = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='stopped')
    pid = models.IntegerField(null=True, blank=True)
    custom_domain = models.JSONField(default=dict, blank=True, null=True)
    public_tunnel_url = models.URLField(max_length=512, blank=True, null=True)
    is_shared_on_lan = models.BooleanField(default=False)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.name} [{self.service_id}] - {self.status}"

    def to_dict(self):
        # Fetch last 150 log entries for the service
        logs = [l.to_dict() for l in self.logs.all().order_by('-id')[:150][::-1]]
        return {
            'id': self.service_id,
            'name': self.name,
            'category': self.category,
            'command': self.command,
            'cwd': self.cwd or '',
            'port': self.port,
            'status': self.status,
            'pid': self.pid,
            'logs': logs,
            'publicTunnelUrl': self.public_tunnel_url,
            'isSharedOnLan': self.is_shared_on_lan,
            'customDomain': self.custom_domain,
        }

class ServiceLogEntry(models.Model):
    LOG_TYPES = [
        ('stdout', 'STDOUT'),
        ('stderr', 'STDERR'),
        ('system', 'SYSTEM'),
    ]

    service = models.ForeignKey(ProjectService, related_name='logs', on_delete=models.CASCADE)
    timestamp = models.CharField(max_length=32)
    log_type = models.CharField(max_length=8, choices=LOG_TYPES, default='stdout')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['id']

    def to_dict(self):
        return {
            'timestamp': self.timestamp,
            'type': self.log_type,
            'message': self.message,
            'serviceId': self.service.service_id,
            'serviceName': self.service.name,
        }

class WebhookEvent(models.Model):
    SOURCES = [
        ('stripe', 'Stripe'),
        ('github', 'GitHub'),
        ('shopify', 'Shopify'),
        ('clerk', 'Clerk'),
        ('custom', 'Custom'),
    ]

    project = models.ForeignKey(DevProject, related_name='webhooks', on_delete=models.SET_NULL, null=True, blank=True)
    webhook_id = models.CharField(max_length=64, unique=True, db_index=True)
    source = models.CharField(max_length=32, choices=SOURCES, default='custom')
    event = models.CharField(max_length=128)
    timestamp = models.CharField(max_length=32)
    method = models.CharField(max_length=8, default='POST')
    path = models.CharField(max_length=255)
    headers = models.JSONField(default=dict)
    payload = models.JSONField(default=dict)
    status_code = models.IntegerField(default=200)
    replayed_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def to_dict(self):
        return {
            'id': self.webhook_id,
            'source': self.source,
            'event': self.event,
            'timestamp': self.timestamp,
            'method': self.method,
            'path': self.path,
            'headers': self.headers,
            'payload': self.payload,
            'statusCode': self.status_code,
            'replayedCount': self.replayed_count,
        }
