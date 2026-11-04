from django.urls import path
from .views import (
    ModelsListAPIView,
    ModelLoadAPIView,
    ModelUnloadAPIView,
    BenchmarkInferenceAPIView,
)

urlpatterns = [
    path('models/', ModelsListAPIView.as_view(), name='switchboard-models'),
    path('models/<str:model_id>/load/', ModelLoadAPIView.as_view(), name='switchboard-load'),
    path('models/<str:model_id>/unload/', ModelUnloadAPIView.as_view(), name='switchboard-unload'),
    path('benchmark/', BenchmarkInferenceAPIView.as_view(), name='switchboard-benchmark'),
]
