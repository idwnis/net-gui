from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.sniffer.services import SnifferService, ThrottleService

class SnifferServiceTestCase(TestCase):
    def test_record_packet(self):
        packet = SnifferService.record_packet(
            method='GET',
            url='http://localhost:8000/api/health/',
            status=200,
            duration_ms=12,
            size_bytes=450,
            source_app='Unit Test Client',
            content_type='application/json'
        )
        self.assertEqual(packet.status, 200)
        self.assertEqual(packet.method, 'GET')

    def test_throttle_service(self):
        # Set to Fast 4G
        p = ThrottleService.set_profile('fast4g')
        self.assertEqual(p['id'], 'fast4g')
        self.assertEqual(p['latencyMs'], 20)

        # Reset to Gigabit
        p_none = ThrottleService.set_profile('none')
        self.assertEqual(p_none['id'], 'none')
        self.assertEqual(p_none['latencyMs'], 0)

class SnifferAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        SnifferService.record_packet(
            method='GET',
            url='http://localhost:8000/api/health/',
            status=200,
            duration_ms=10,
            size_bytes=128
        )

    def test_packets_list_api(self):
        url = reverse('sniffer-packets')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        self.assertGreaterEqual(response.data['total'], 1)

    def test_packet_inject_api(self):
        url = reverse('sniffer-packets')
        payload = {
            'method': 'POST',
            'url': 'http://localhost:8000/api/test',
            'status': 201,
            'durationMs': 15,
            'sizeBytes': 500,
            'sourceApp': 'Test Runner'
        }
        response = self.client.post(url, payload, format='json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['method'], 'POST')

    def test_clear_packets_api(self):
        url = reverse('sniffer-clear')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)

    def test_throttle_profile_api(self):
        url = reverse('sniffer-throttle')
        res_get = self.client.get(url)
        self.assertEqual(res_get.status_code, 200)
        self.assertIn('activeProfile', res_get.data)

        res_post = self.client.post(url, {'profileId': 'slow3g'}, format='json')
        self.assertEqual(res_post.status_code, 200)
        self.assertEqual(res_post.data['profile']['id'], 'slow3g')

    def test_explain_error_api(self):
        url = reverse('sniffer-explain')
        res = self.client.post(url, {'method': 'POST', 'url': 'https://api.openai.com/v1', 'status': 401}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('explanation', res.data)
        self.assertIn('Unauthorized', res.data['explanation'])
