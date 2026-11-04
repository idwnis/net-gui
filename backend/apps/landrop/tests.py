from django.test import TestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.landrop.services import LanDropService

class LanDropTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_get_nearby_devices(self):
        devices = LanDropService.get_nearby_devices()
        self.assertGreaterEqual(len(devices), 1)
        self_dev = next((d for d in devices if d['isSelf']), None)
        self.assertIsNotNone(self_dev)

    def test_save_and_retrieve_file(self):
        drop_file = LanDropService.save_file(
            filename='test_code.py',
            content=b'print("Hello LAN Drop")',
            content_type='text/x-python',
            sender='Den MacBook',
            sender_device='MacBook'
        )
        self.assertEqual(drop_file.name, 'test_code.py')
        self.assertGreater(drop_file.size_bytes, 0)

        path = LanDropService.get_file_path(drop_file.file_id)
        self.assertIsNotNone(path)

    def test_landrop_api_endpoints(self):
        # 1. Devices list
        res_dev = self.client.get(reverse('landrop-devices'))
        self.assertEqual(res_dev.status_code, 200)

        # 2. Files list
        res_files = self.client.get(reverse('landrop-files'))
        self.assertEqual(res_files.status_code, 200)

        # 3. Upload file
        uploaded = SimpleUploadedFile("sample.txt", b"LAN Drop test payload", content_type="text/plain")
        res_upload = self.client.post(reverse('landrop-upload'), {'file': uploaded, 'sender': 'Test Host'}, format='multipart')
        self.assertEqual(res_upload.status_code, 201)
        file_id = res_upload.data['id']

        # 4. Download file
        res_download = self.client.get(reverse('landrop-download', kwargs={'file_id': file_id}))
        self.assertEqual(res_download.status_code, 200)
