from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.watchdog.services import SSLWatchdogService

class WatchdogTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        from apps.watchdog.models import DomainWatchdogItem
        DomainWatchdogItem.objects.create(
            domain_id='test-dom',
            domain='example.com',
            status='valid',
            ssl_expiry_days=90,
            dns_records=[{'type': 'A', 'value': '93.184.216.34', 'ttl': 300}],
            uptime_percent=100.0
        )

    def test_get_domains(self):
        domains = SSLWatchdogService.get_domains()
        self.assertGreaterEqual(len(domains), 1)
        self.assertIn('sslExpiryDays', domains[0])
        self.assertIn('dnsRecords', domains[0])

    def test_inspect_domain(self):
        info = SSLWatchdogService.inspect_ssl_and_dns('netpulse.dev')
        self.assertEqual(info['domain'], 'netpulse.dev')
        self.assertIn(info['status'], ['valid', 'expiring_soon', 'expired'])
        self.assertGreater(len(info['dnsRecords']), 0)

    def test_watchdog_api_endpoints(self):
        # 1. Domains list
        res_list = self.client.get(reverse('watchdog-domains'))
        self.assertEqual(res_list.status_code, 200)
        self.assertGreaterEqual(len(res_list.data), 1)

        # 2. Add domain
        res_add = self.client.post(reverse('watchdog-domains'), {'domain': 'test.example.com'}, format='json')
        self.assertEqual(res_add.status_code, 201)
        dom_id = res_add.data['id']

        # 3. Check domain
        res_check = self.client.post(reverse('watchdog-check', kwargs={'domain_id': dom_id}))
        self.assertEqual(res_check.status_code, 200)

        # 4. Delete domain
        res_del = self.client.delete(reverse('watchdog-delete', kwargs={'domain_id': dom_id}))
        self.assertEqual(res_del.status_code, 200)
