from django.urls import path
from .views import (
    DevicesListAPIView,
    FilesListAPIView,
    FileUploadAPIView,
    FileDownloadAPIView,
)

urlpatterns = [
    path('devices/', DevicesListAPIView.as_view(), name='landrop-devices'),
    path('files/', FilesListAPIView.as_view(), name='landrop-files'),
    path('upload/', FileUploadAPIView.as_view(), name='landrop-upload'),
    path('download/<str:file_id>/', FileDownloadAPIView.as_view(), name='landrop-download'),
]
