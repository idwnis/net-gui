import os
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from apps.runner.models import DevProject, ProjectService, WebhookEvent
from apps.runner.stack_detector import StackDetectorService
from apps.runner.ai_diagnose import AIDiagnoseService
from apps.runner.webhook_service import WebhookService
from apps.runner.db_inspector import DatabaseInspectorService
from apps.runner.supervisor import ProcessSupervisor

class StackDetectorTestCase(TestCase):
    def test_inspect_workspace(self):
        workspace = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        analysis = StackDetectorService.inspect_directory(workspace)
        self.assertIn('frameworks', analysis)
        self.assertIn('runtimes', analysis)
        self.assertIn('services', analysis)

class AIDiagnoseTestCase(TestCase):
    def test_eaddrinuse_detection(self):
        logs = [{'type': 'stderr', 'message': 'Error: That port is already in use (EADDRINUSE: 0.0.0.0:8000).'}]
        res = AIDiagnoseService.diagnose_logs('Django Server', 8000, logs)
        self.assertEqual(res['status'], 'error_found')
        self.assertIn('Port Conflict', res['title'])
        self.assertIn('kill -9', res['fixCommand'])

    def test_clean_process_diagnosis(self):
        logs = [{'type': 'stdout', 'message': 'VITE v6.4.5 ready in 214 ms'}]
        res = AIDiagnoseService.diagnose_logs('Vite Frontend', 5173, logs)
        self.assertEqual(res['status'], 'healthy')
        self.assertIn('Running Cleanly', res['title'])

class DatabaseInspectorTestCase(TestCase):
    def test_db_instances(self):
        instances = DatabaseInspectorService.get_database_instances()
        self.assertGreaterEqual(len(instances), 1)
        self.assertEqual(instances[0]['status'], 'online')

    def test_db_read_only_query(self):
        res = DatabaseInspectorService.run_query("SELECT 1 AS test_val;")
        self.assertTrue(res['success'])
        self.assertEqual(res['data'][0]['test_val'], 1)

    def test_db_reject_destructive_query(self):
        res = DatabaseInspectorService.run_query("DROP TABLE users;")
        self.assertFalse(res['success'])
        self.assertIn('read-only', res['error'])

class WebhookServiceTestCase(TestCase):
    def test_ingest_and_replay(self):
        wh = WebhookService.ingest_webhook(
            source='stripe',
            event='payment_intent.succeeded',
            path='/api/webhooks/stripe',
            method='POST',
            headers={'content-type': 'application/json'},
            payload={'amount': 2000, 'currency': 'usd'}
        )
        self.assertEqual(wh.source, 'stripe')
        self.assertEqual(wh.status_code, 200)

class RunnerAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = DevProject.objects.create(
            project_id='proj-test-1',
            name='Test Project',
            path='/tmp',
            detected_stack={'frameworks': ['Django'], 'runtimes': ['Python']}
        )
        self.service = ProjectService.objects.create(
            project=self.project,
            service_id='svc-echo-test',
            name='Echo Worker',
            category='custom',
            command='echo "testing supervisor"',
            port=9999,
            status='stopped'
        )

    def test_get_projects_api(self):
        url = reverse('runner-projects')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 1)

    def test_detect_project_stack_api(self):
        url = reverse('runner-project-detect')
        response = self.client.post(url, {'path': '/tmp'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('frameworks', response.data)

    def test_service_lifecycle_api(self):
        # Start service
        url_start = reverse('runner-service-control', kwargs={'service_id': self.service.service_id, 'action': 'start'})
        res_start = self.client.post(url_start)
        self.assertEqual(res_start.status_code, 200)

        # Stop service
        url_stop = reverse('runner-service-control', kwargs={'service_id': self.service.service_id, 'action': 'stop'})
        res_stop = self.client.post(url_stop)
        self.assertEqual(res_stop.status_code, 200)

    def test_service_rebind_api(self):
        url = reverse('runner-service-rebind', kwargs={'service_id': self.service.service_id})
        response = self.client.post(url, {'targetPort': 9999}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertNotEqual(response.data['newPort'], 9999)

    def test_ai_diagnose_api(self):
        url = reverse('runner-ai-diagnose')
        logs = [{'type': 'stderr', 'message': 'OperationalError: connection refused port 5432'}]
        response = self.client.post(url, {'serviceId': self.service.service_id, 'logs': logs}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'error_found')

    def test_webhook_catch_and_replay_api(self):
        url_catch = reverse('runner-webhook-catch', kwargs={'source': 'github'})
        res_catch = self.client.post(url_catch, {'ref': 'refs/heads/main'}, format='json')
        self.assertEqual(res_catch.status_code, 201)
        wh_id = res_catch.data['id']

        url_replay = reverse('runner-webhook-replay', kwargs={'webhook_id': wh_id})
        res_replay = self.client.post(url_replay, {'targetUrl': 'http://127.0.0.1:8000/api/health/'}, format='json')
        self.assertEqual(res_replay.status_code, 200)
