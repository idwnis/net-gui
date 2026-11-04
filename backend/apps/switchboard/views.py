from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from .services import OllamaSwitchboardService

class ModelsListAPIView(APIView):
    """Lists local LLM models and VRAM usage."""
    @extend_schema(summary="List Local LLM Models")
    def get(self, request):
        models = OllamaSwitchboardService.get_models()
        total_vram = sum(m.get('vramUsageGb', 0) for m in models if m.get('status') == 'loaded_in_vram')
        return Response({
            'totalVramGb': round(total_vram, 1),
            'maxVramGb': 16.0,
            'models': models,
        }, status=status.HTTP_200_OK)

class ModelLoadAPIView(APIView):
    """Loads a model into Apple Silicon Unified Memory."""
    @extend_schema(summary="Load Model into VRAM")
    def post(self, request, model_id):
        ok, msg, model_data = OllamaSwitchboardService.load_model(model_id)
        return Response({
            'success': ok,
            'message': msg,
            'model': model_data,
        }, status=status.HTTP_200_OK if ok else status.HTTP_404_NOT_FOUND)

class ModelUnloadAPIView(APIView):
    """Unloads model from VRAM, freeing Unified Memory."""
    @extend_schema(summary="Unload Model from VRAM")
    def post(self, request, model_id):
        ok, msg, model_data = OllamaSwitchboardService.unload_model(model_id)
        return Response({
            'success': ok,
            'message': msg,
            'model': model_data,
        }, status=status.HTTP_200_OK if ok else status.HTTP_404_NOT_FOUND)

class BenchmarkInferenceAPIView(APIView):
    """Runs high-performance prompt benchmark measuring tokens/sec and TTFT."""
    @extend_schema(summary="Benchmark Local Model Inference")
    def post(self, request):
        model_id = request.data.get('modelId') or 'llm-deepseek-r1'
        prompt = request.data.get('prompt') or 'Explain how ARP discovery works in 2 concise sentences.'

        benchmark = OllamaSwitchboardService.benchmark_inference(model_id, prompt)
        return Response(benchmark, status=status.HTTP_200_OK)
