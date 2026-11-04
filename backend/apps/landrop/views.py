import os
from django.http import FileResponse, Http404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema
from .models import DropFileItem
from .services import LanDropService

class DevicesListAPIView(APIView):
    """Lists nearby devices available on the local Wi-Fi network."""
    @extend_schema(summary="List Nearby LAN Drop Receivers")
    def get(self, request):
        devices = LanDropService.get_nearby_devices()
        return Response(devices, status=status.HTTP_200_OK)

class FilesListAPIView(APIView):
    """Lists transferred files in the LAN Drop inbox."""
    @extend_schema(summary="List LAN Drop Files")
    def get(self, request):
        files = DropFileItem.objects.all()[:50]

        # Seed sample files if inbox is fresh
        if not files.exists():
            LanDropService.save_file(
                filename='netgui-architecture.pdf',
                content=b'%PDF-1.4 Net GUI Architecture Diagram Spec',
                content_type='application/pdf',
                sender='MacBook Pro',
                sender_device='MacBook'
            )
            files = DropFileItem.objects.all()[:50]

        return Response([f.to_dict() for f in files], status=status.HTTP_200_OK)

class FileUploadAPIView(APIView):
    """Uploads a file to LAN Drop."""
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(summary="Upload File to Local Network Drop")
    def post(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file uploaded in "file" form field.'}, status=status.HTTP_400_BAD_REQUEST)

        sender = request.data.get('sender', 'Local User')
        sender_device = request.data.get('senderDevice', 'Workstation')

        content = file_obj.read()
        drop_file = LanDropService.save_file(
            filename=file_obj.name,
            content=content,
            content_type=file_obj.content_type or 'application/octet-stream',
            sender=sender,
            sender_device=sender_device
        )

        return Response(drop_file.to_dict(), status=status.HTTP_201_CREATED)

class FileDownloadAPIView(APIView):
    """Downloads a transferred file by file_id."""
    @extend_schema(summary="Download LAN Drop File")
    def get(self, request, file_id):
        path = LanDropService.get_file_path(file_id)
        if not path or not os.path.exists(path):
            raise Http404("File not found or expired.")

        return FileResponse(open(path, 'rb'), as_attachment=True, filename=os.path.basename(path))
