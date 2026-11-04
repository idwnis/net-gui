from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.switchboard.services import OllamaSwitchboardService

class SwitchboardTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_models(self):
        models = OllamaSwitchboardService.get_models()
        self.assertGreaterEqual(len(models), 1)
        self.assertIn('tag', models[0])
        self.assertIn('parameterSize', models[0])

    def test_load_and_unload_model(self):
        models = OllamaSwitchboardService.get_models()
        target = models[0]

        # Test Unload
        ok_u, msg_u, _ = OllamaSwitchboardService.unload_model(target['id'])
        self.assertTrue(ok_u)
        self.assertIn('Reclaimed', msg_u)

        # Test Load
        ok_l, msg_l, _ = OllamaSwitchboardService.load_model(target['id'])
        self.assertTrue(ok_l)
        self.assertIn('Loaded', msg_l)

    def test_benchmark_inference(self):
        models = OllamaSwitchboardService.get_models()
        res = OllamaSwitchboardService.benchmark_inference(models[0]['id'], "Explain ARP")
        self.assertIn('tokensPerSec', res)
        self.assertIn('timeToFirstTokenMs', res)
        self.assertIn('response', res)

    def test_switchboard_api_endpoints(self):
        # 1. Models list
        res_list = self.client.get(reverse('switchboard-models'))
        self.assertEqual(res_list.status_code, 200)
        self.assertIn('totalVramGb', res_list.data)

        # 2. Unload
        model_id = res_list.data['models'][0]['id']
        res_unload = self.client.post(reverse('switchboard-unload', kwargs={'model_id': model_id}))
        self.assertEqual(res_unload.status_code, 200)
        self.assertTrue(res_unload.data['success'])

        # 3. Load
        res_load = self.client.post(reverse('switchboard-load', kwargs={'model_id': model_id}))
        self.assertEqual(res_load.status_code, 200)
        self.assertTrue(res_load.data['success'])

        # 4. Benchmark
        res_bench = self.client.post(reverse('switchboard-benchmark'), {'modelId': model_id, 'prompt': 'test'}, format='json')
        self.assertEqual(res_bench.status_code, 200)
        self.assertIn('tokensPerSec', res_bench.data)
