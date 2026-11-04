import os
import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import DevProject, ProjectService, WebhookEvent, ServiceLogEntry
from .supervisor import ProcessSupervisor
from .stack_detector import StackDetectorService
from .ai_diagnose import AIDiagnoseService
from .webhook_service import WebhookService
from .db_inspector import DatabaseInspectorService

class ProjectsListCreateAPIView(APIView):
    """
    Lists all registered development projects or registers a new project.
    Automatically initializes the workspace project if the database is empty.
    """
    @extend_schema(summary="List Dev Projects")
    def get(self, request):
        projects = DevProject.objects.all()

        # Seed current workspace if DB is fresh
        if not projects.exists():
            workspace_path = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            analysis = StackDetectorService.inspect_directory(workspace_path)

            proj = DevProject.objects.create(
                project_id='proj-netpulse',
                name='Net GUI Core Suite',
                description='Vite React frontend with Django ASGI high-performance network radar',
                source_type='local_folder',
                path=workspace_path,
                detected_stack={
                    'frameworks': analysis['frameworks'],
                    'runtimes': analysis['runtimes'],
                    'filesFound': analysis['filesFound'],
                },
                env_variables=[
                    {'key': 'DEBUG', 'value': 'True', 'isSecret': False, 'status': 'valid'},
                    {'key': 'DJANGO_SECRET_KEY', 'value': 'netpulse_sec_token_99182a', 'isSecret': True, 'status': 'valid'},
                    {'key': 'BACKEND_PORT', 'value': '8000', 'isSecret': False, 'status': 'valid'},
                ]
            )

            # Create default services
            ProjectService.objects.create(
                project=proj,
                service_id='svc-vite-client',
                name='Vite Frontend Client',
                category='node',
                command='npm run dev',
                cwd=os.path.join(workspace_path, 'frontend'),
                port=5173,
                status='stopped',
                custom_domain={'enabled': True, 'domain': 'netpulse.test', 'targetPort': 5173, 'sslActive': True}
            )

            ProjectService.objects.create(
                project=proj,
                service_id='svc-django-backend',
                name='Django ASGI Engine',
                category='django',
                command='backend/venv/bin/daphne -b 0.0.0.0 -p 8000 config.asgi:application',
                cwd=workspace_path,
                port=8000,
                status='running',
                custom_domain={'enabled': True, 'domain': 'api.netpulse.test', 'targetPort': 8000, 'sslActive': True}
            )

            projects = DevProject.objects.all()

        return Response([p.to_dict() for p in projects], status=status.HTTP_200_OK)

    @extend_schema(summary="Register New Dev Project")
    def post(self, request):
        data = request.data
        name = data.get('name') or 'New Project'
        path = data.get('path') or os.getcwd()
        source_type = data.get('sourceType', 'local_folder')
        description = data.get('description', '')

        analysis = StackDetectorService.inspect_directory(path)

        project_id = f"proj-{int(os.times()[4] * 1000)}"
        project = DevProject.objects.create(
            project_id=project_id,
            name=name,
            description=description or analysis.get('description', ''),
            source_type=source_type,
            path=path,
            github_url=data.get('githubUrl'),
            custom_instructions=data.get('customInstructions'),
            detected_stack={
                'frameworks': analysis['frameworks'],
                'runtimes': analysis['runtimes'],
                'filesFound': analysis['filesFound'],
            }
        )

        # Create detected services
        for svc_data in analysis.get('services', []):
            svc_id = f"svc-{int(os.times()[4] * 1000)}-{os.urandom(3).hex()}"
            ProjectService.objects.create(
                project=project,
                service_id=svc_id,
                name=svc_data['name'],
                category=svc_data.get('category', 'custom'),
                command=svc_data['command'],
                cwd=svc_data.get('cwd', path),
                port=svc_data.get('port'),
                status='stopped'
            )

        return Response(project.to_dict(), status=status.HTTP_201_CREATED)

class ProjectDetectAPIView(APIView):
    """Inspects a target folder and detects stacks, runtimes, and services."""
    @extend_schema(summary="Auto-Detect Project Stack from Folder")
    def post(self, request):
        path = request.data.get('path', os.getcwd())
        analysis = StackDetectorService.inspect_directory(path)
        return Response(analysis, status=status.HTTP_200_OK)

class ServiceControlAPIView(APIView):
    """Starts, stops, or restarts an individual service daemon."""
    @extend_schema(summary="Control Service Process (start / stop / restart)")
    def post(self, request, service_id, action):
        if action == 'start':
            success, msg = ProcessSupervisor.start_service(service_id)
        elif action == 'stop':
            success, msg = ProcessSupervisor.stop_service(service_id)
        elif action == 'restart':
            success, msg = ProcessSupervisor.restart_service(service_id)
        else:
            return Response({'error': f"Unknown action: {action}"}, status=status.HTTP_400_BAD_REQUEST)

        svc = ProjectService.objects.filter(service_id=service_id).first()
        return Response({
            'success': success,
            'message': msg,
            'service': svc.to_dict() if svc else None,
        }, status=status.HTTP_200_OK if success else status.HTTP_400_BAD_REQUEST)

class ProjectBatchControlAPIView(APIView):
    """Starts or stops all services under a specific project."""
    @extend_schema(summary="Batch Control All Services (start-all / stop-all)")
    def post(self, request, project_id, action):
        try:
            project = DevProject.objects.get(project_id=project_id)
        except DevProject.DoesNotExist:
            return Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)

        results = []
        for svc in project.services.all():
            if action == 'start-all' and svc.status != 'running':
                ok, msg = ProcessSupervisor.start_service(svc.service_id)
                results.append({'serviceId': svc.service_id, 'success': ok, 'message': msg})
            elif action == 'stop-all' and svc.status == 'running':
                ok, msg = ProcessSupervisor.stop_service(svc.service_id)
                results.append({'serviceId': svc.service_id, 'success': ok, 'message': msg})

        return Response({
            'status': 'completed',
            'action': action,
            'results': results,
            'project': project.to_dict(),
        }, status=status.HTTP_200_OK)

class ServiceRebindAPIView(APIView):
    """Auto-rebinds a service to the next available free port."""
    @extend_schema(summary="Auto-Rebind Service Port")
    def post(self, request, service_id):
        target_port = request.data.get('targetPort')
        ok, new_port, msg = ProcessSupervisor.rebind_service(service_id, target_port=target_port)
        return Response({
            'success': ok,
            'newPort': new_port,
            'message': msg,
        }, status=status.HTTP_200_OK if ok else status.HTTP_400_BAD_REQUEST)

class ClearLogsAPIView(APIView):
    """Clears log history for a service."""
    @extend_schema(summary="Clear Service Terminal Logs")
    def post(self, request, service_id):
        ServiceLogEntry.objects.filter(service__service_id=service_id).delete()
        return Response({'status': 'logs_cleared', 'serviceId': service_id}, status=status.HTTP_200_OK)

class AIDiagnoseAPIView(APIView):
    """Analyzes runtime crash logs using AI doctor."""
    @extend_schema(summary="AI Doctor Error Diagnosis")
    def post(self, request):
        service_id = request.data.get('serviceId')
        logs = request.data.get('logs', [])
        ai_settings = request.data.get('aiSettings', {})

        svc_name = 'Dev Server'
        svc_port = 8000
        if service_id:
            svc = ProjectService.objects.filter(service_id=service_id).first()
            if svc:
                svc_name = svc.name
                svc_port = svc.port

        diagnosis = AIDiagnoseService.diagnose_logs(
            service_name=svc_name,
            service_port=svc_port,
            logs=logs,
            ai_settings=ai_settings
        )
        return Response(diagnosis, status=status.HTTP_200_OK)

class WebhookCatchAPIView(APIView):
    """Catch-all ingestion endpoint for external webhooks."""
    @extend_schema(summary="Ingest External Webhook")
    def post(self, request, source):
        event_header = request.headers.get('x-github-event') or request.headers.get('stripe-event') or 'event.webhook'
        wh = WebhookService.ingest_webhook(
            source=source,
            event=event_header,
            path=request.path,
            method='POST',
            headers=dict(request.headers),
            payload=request.data
        )
        return Response(wh.to_dict(), status=status.HTTP_201_CREATED)

class WebhookReplayAPIView(APIView):
    """Replays an ingested webhook payload to local endpoints."""
    @extend_schema(summary="Replay Webhook Payload Locally")
    def post(self, request, webhook_id):
        target_override = request.data.get('targetUrl', '')
        ok, status_code, elapsed_ms, msg = WebhookService.replay_webhook(webhook_id, target_override_url=target_override)
        return Response({
            'success': ok,
            'statusCode': status_code,
            'latencyMs': elapsed_ms,
            'message': msg,
        }, status=status.HTTP_200_OK)

class DatabaseInstancesAPIView(APIView):
    """Returns local database instances with tables and connection stats."""
    @extend_schema(summary="Get Local Database Instances")
    def get(self, request):
        instances = DatabaseInspectorService.get_database_instances()
        return Response(instances, status=status.HTTP_200_OK)

class DatabaseQueryAPIView(APIView):
    """Executes safe read-only SQL queries."""
    @extend_schema(summary="Run Read-Only SQL Query")
    def post(self, request):
        sql = request.data.get('query', '')
        result = DatabaseInspectorService.run_query(sql)
        return Response(result, status=status.HTTP_200_OK if result['success'] else status.HTTP_400_BAD_REQUEST)

class ProjectEnvAPIView(APIView):
    """Reads or updates environment variables in the project vault."""
    @extend_schema(summary="Manage Project Env Variables")
    def get(self, request, project_id):
        try:
            project = DevProject.objects.get(project_id=project_id)
            return Response(project.env_variables or [], status=status.HTTP_200_OK)
        except DevProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, project_id):
        try:
            project = DevProject.objects.get(project_id=project_id)
            envs = request.data.get('envVariables', [])
            project.env_variables = envs
            project.save()
            return Response({'status': 'saved', 'envVariables': project.env_variables}, status=status.HTTP_200_OK)
        except DevProject.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
