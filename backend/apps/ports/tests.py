from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.ports.services import PortService

class PortsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_system_ports_service(self):
        ports = PortService.get_system_ports(listen_only=False)
        self.assertIsInstance(ports, list)
        if ports:
            p = ports[0]
            self.assertIn('port', p)
            self.assertIn('protocol', p)
            self.assertIn('address', p)
            self.assertIn('state', p)
            self.assertIn('pid', p)

    def test_ports_list_endpoint(self):
        url = reverse('ports-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        self.assertIn('ports', response.data)
        self.assertIsInstance(response.data['ports'], list)

    def test_ports_check_endpoint(self):
        url = reverse('ports-check')
        # Test probing an unused ephemeral port (e.g. 59876)
        response = self.client.post(url, {'port': 59876}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['port'], 59876)
        self.assertIn('occupied', response.data)

    def test_ports_check_invalid_payload(self):
        url = reverse('ports-check')
        response = self.client.post(url, {'port': 'not_a_number'}, format='json')
        self.assertEqual(response.status_code, 400)
