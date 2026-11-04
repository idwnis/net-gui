from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.telemetry.services import TelemetryService

class TelemetryTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_telemetry_service_data(self):
        data = TelemetryService.get_telemetry()
        self.assertIn('cpuUsagePercent', data)
        self.assertIn('cpuCores', data)
        self.assertIn('memoryUsedGb', data)
        self.assertIn('memoryTotalGb', data)
        self.assertIn('networkInKbps', data)
        self.assertIn('networkOutKbps', data)
        self.assertIn('topProcesses', data)
        self.assertIsInstance(data['cpuCores'], list)
        self.assertIsInstance(data['topProcesses'], list)

    def test_telemetry_overview_endpoint(self):
        url = reverse('telemetry-overview')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('cpuUsagePercent', response.data)
        self.assertIn('memoryUsedGb', response.data)

    def test_optimize_ram_endpoint(self):
        url = reverse('telemetry-optimize-ram')
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'success')
