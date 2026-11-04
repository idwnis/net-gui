from django.test import TestCase
from apps.core.os_adapter import OSAdapter

class OSAdapterTestCase(TestCase):
    def test_platform_detection(self):
        platform = OSAdapter.get_platform()
        self.assertIn(platform, ['darwin', 'win32', 'linux'])

    def test_host_info(self):
        info = OSAdapter.get_host_info()
        self.assertIn('platform', info)
        self.assertIn('hostname', info)
        self.assertIsInstance(info['hostname'], str)

    def test_primary_interface(self):
        iface = OSAdapter.get_primary_interface()
        self.assertIn('interface', iface)
        self.assertIn('ip', iface)
        self.assertIn('mac', iface)
        self.assertTrue(len(iface['ip']) > 0)

    def test_purge_memory(self):
        result = OSAdapter.purge_memory()
        self.assertEqual(result['status'], 'success')
        self.assertIn('memory_used_gb', result)
        self.assertIn('memory_total_gb', result)

    def test_server_spa_serving(self):
        # Verify that root '/' serves the compiled Vite Single Page Application
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'text/html')
        self.assertIn('Net GUI', response.content.decode('utf-8'))
