from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.gateway.blocklist import is_domain_blocked
from apps.gateway.dns_server import DNSSinkholeService
from apps.gateway.proxy_server import ProxyServerService

class DNSBlocklistTestCase(TestCase):
    def test_blocklist_matches(self):
        # Known blocked domains
        blocked, cat = is_domain_blocked('telemetry.samsung.com')
        self.assertTrue(blocked)
        self.assertEqual(cat, 'telemetry')

        blocked, cat = is_domain_blocked('googleads.g.doubleclick.net')
        self.assertTrue(blocked)
        self.assertEqual(cat, 'ad')

        # Subdomain of blocked parent
        blocked, cat = is_domain_blocked('adserver.sub.doubleclick.net')
        self.assertTrue(blocked)

        # Benign domains
        blocked, cat = is_domain_blocked('api.github.com')
        self.assertFalse(blocked)
        self.assertIsNone(cat)

class DNSSinkholeTestCase(TestCase):
    def test_sinkhole_resolution(self):
        # Test blocked domain sinks to 0.0.0.0
        res_blocked = DNSSinkholeService.process_query('telemetry.samsung.com', '192.168.1.140', 'Samsung TV', 'A')
        self.assertEqual(res_blocked['status'], 'blocked')
        self.assertEqual(res_blocked['resolvedIp'], '0.0.0.0')

        # Test benign domain resolves
        res_ok = DNSSinkholeService.process_query('registry.npmjs.org', '192.168.1.105', 'MacBook', 'A')
        self.assertEqual(res_ok['status'], 'forwarded')

    def test_sinkhole_stats(self):
        stats = DNSSinkholeService.get_stats()
        self.assertIn('totalQueries', stats)
        self.assertIn('blockedQueries', stats)
        self.assertIn('blockPercent', stats)
        self.assertIn('domainsOnBlocklist', stats)

class GatewayAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_gateway_config_api(self):
        url = reverse('gateway-config')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('isEnabled', response.data)
        self.assertEqual(response.data['proxyPort'], 7890)

    def test_gateway_toggle_api(self):
        url = reverse('gateway-toggle')
        response = self.client.post(url, {'isEnabled': False}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['isEnabled'])

    def test_dns_stats_and_queries_api(self):
        url_stats = reverse('gateway-dns-stats')
        res_stats = self.client.get(url_stats)
        self.assertEqual(res_stats.status_code, 200)

        url_queries = reverse('gateway-dns-queries')
        res_queries = self.client.get(url_queries)
        self.assertEqual(res_queries.status_code, 200)
        self.assertGreaterEqual(len(res_queries.data), 1)

    def test_dns_process_query_api(self):
        url = reverse('gateway-dns-process')
        response = self.client.post(url, {'domain': 'telemetry.microsoft.com'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'blocked')
        self.assertEqual(response.data['resolvedIp'], '0.0.0.0')
