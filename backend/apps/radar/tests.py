from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.radar.models import NetworkDevice, PingTarget
from apps.radar.oui_database import lookup_vendor
from apps.radar.services import WakeOnLanService, PingBenchmarkService, SubnetScannerService

class OuiDatabaseTestCase(TestCase):
    def test_vendor_lookups(self):
        # Apple
        self.assertEqual(lookup_vendor('3C:06:30:4A:21:BC'), 'Apple, Inc.')
        # Asus
        self.assertEqual(lookup_vendor('E4:C3:2A:8B:11:00'), 'AsusTek Computer')
        # Espressif
        self.assertEqual(lookup_vendor('30:AE:A4:71:02:44'), 'Espressif Inc.')
        # Raspberry Pi
        self.assertEqual(lookup_vendor('DC:A6:32:98:EF:01'), 'Raspberry Pi Foundation')
        # Unknown fallback
        self.assertEqual(lookup_vendor('00:99:88:77:66:55'), 'Generic Network Device')

class WakeOnLanTestCase(TestCase):
    def test_valid_magic_packet(self):
        success, msg = WakeOnLanService.send_magic_packet('3C:06:30:4A:21:BC')
        self.assertTrue(success)
        self.assertIn('successfully broadcasted', msg)

    def test_invalid_mac_packet(self):
        success, msg = WakeOnLanService.send_magic_packet('invalid-mac')
        self.assertFalse(success)
        self.assertIn('Invalid MAC', msg)

class PingBenchmarkTestCase(TestCase):
    def test_default_targets_initialization(self):
        PingBenchmarkService.initialize_default_targets()
        targets = PingTarget.objects.all()
        self.assertGreaterEqual(targets.count(), 3)

    def test_benchmark_execution(self):
        results = PingBenchmarkService.benchmark_targets()
        self.assertIsInstance(results, list)
        self.assertGreaterEqual(len(results), 3)
        self.assertIn('latencyMs', results[0])
        self.assertIn('jitterMs', results[0])

class SubnetScannerTestCase(TestCase):
    def test_subnet_sweep(self):
        devices = SubnetScannerService.sweep_subnet()
        self.assertIsInstance(devices, list)
        self.assertGreaterEqual(len(devices), 1)  # At least local host
        local = next((d for d in devices if d['isLocalHost']), None)
        self.assertIsNotNone(local)
        self.assertEqual(local['status'], 'online')

class RadarAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.device = NetworkDevice.objects.create(
            device_id='dev-test-1',
            ip='192.168.1.150',
            mac='3C:06:30:11:22:33',
            vendor='Apple, Inc.',
            hostname='test-macbook.local',
            device_type='computer',
            status='online',
            latency_ms=1.4,
            is_trusted=True
        )

    def test_get_devices_list(self):
        url = reverse('radar-devices-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        self.assertGreaterEqual(response.data['total'], 1)

    def test_toggle_trust(self):
        url = reverse('radar-toggle-trust', kwargs={'device_id': self.device.device_id})
        # Toggle to false
        response = self.client.post(url, {'isTrusted': False}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data['isTrusted'])

        # Toggle back
        response = self.client.post(url, {'isTrusted': True}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['isTrusted'])

    def test_wol_api(self):
        url = reverse('radar-wol')
        response = self.client.post(url, {'mac': '3C:06:30:11:22:33'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])

    def test_ping_targets_api(self):
        url = reverse('radar-ping-targets')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn('targets', response.data)

        # Run benchmark
        test_url = reverse('radar-ping-test')
        res_test = self.client.post(test_url)
        self.assertEqual(res_test.status_code, 200)
        self.assertIn('targets', res_test.data)
