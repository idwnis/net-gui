from django.db import models
from django.utils import timezone

class DomainWatchdogItem(models.Model):
    STATUS_CHOICES = [
        ('valid', 'Valid'),
        ('expiring_soon', 'Expiring Soon'),
        ('expired', 'Expired'),
    ]

    domain_id = models.CharField(max_length=64, unique=True, db_index=True)
    domain = models.CharField(max_length=255, db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='valid')
    ssl_issuer = models.CharField(max_length=255, default="Let's Encrypt Authority X3")
    ssl_expiry_days = models.IntegerField(default=90)
    valid_until = models.CharField(max_length=32, default='')
    auto_renew = models.BooleanField(default=True)
    dns_records = models.JSONField(default=list)
    uptime_percent = models.FloatField(default=99.9)
    last_checked = models.CharField(max_length=32, default='Just now')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['ssl_expiry_days']

    def to_dict(self):
        return {
            'id': self.domain_id,
            'domain': self.domain,
            'status': self.status,
            'sslIssuer': self.ssl_issuer,
            'sslExpiryDays': self.ssl_expiry_days,
            'validUntil': self.valid_until,
            'autoRenew': self.auto_renew,
            'dnsRecords': self.dns_records or [{'type': 'A', 'value': '76.76.21.21', 'ttl': 300}],
            'uptimePercent': self.uptime_percent,
            'lastChecked': self.last_checked,
        }
