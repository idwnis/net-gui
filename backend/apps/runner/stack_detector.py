import os
import json
from typing import Dict, Any, List

class StackDetectorService:
    @staticmethod
    def inspect_directory(dir_path: str) -> Dict[str, Any]:
        """
        Inspects directory files to detect frameworks, runtimes, and auto-generate services.
        """
        if not os.path.exists(dir_path):
            return {
                'name': os.path.basename(dir_path) or 'New Project',
                'description': f'Workspace at {dir_path}',
                'frameworks': ['Custom Application'],
                'runtimes': ['System Shell'],
                'filesFound': [],
                'services': [
                    {
                        'name': 'Main Script',
                        'category': 'custom',
                        'command': 'bash run.sh',
                        'port': 3000,
                    }
                ]
            }

        files_found = []
        frameworks = set()
        runtimes = set()
        services = []

        all_entries = set(os.listdir(dir_path))

        # Check Node.js / React / Next.js
        if 'package.json' in all_entries:
            files_found.append('package.json')
            runtimes.add('Node.js')
            try:
                with open(os.path.join(dir_path, 'package.json'), 'r') as f:
                    pkg = json.load(f)
                    deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                    scripts = pkg.get('scripts', {})

                    if 'next' in deps:
                        frameworks.add('Next.js')
                        services.append({
                            'name': 'Next.js Dev Server',
                            'category': 'node',
                            'command': 'npm run dev',
                            'cwd': dir_path,
                            'port': 3000,
                        })
                    elif 'vite' in deps:
                        frameworks.add('Vite')
                        if 'react' in deps:
                            frameworks.add('React')
                        services.append({
                            'name': 'Vite Frontend Server',
                            'category': 'node',
                            'command': 'npm run dev',
                            'cwd': dir_path,
                            'port': 5173,
                        })
                    elif 'react' in deps:
                        frameworks.add('React')
                    if 'tailwindcss' in deps:
                        frameworks.add('Tailwind CSS')

                    if not services and 'dev' in scripts:
                        services.append({
                            'name': 'Node Dev Server',
                            'category': 'node',
                            'command': 'npm run dev',
                            'cwd': dir_path,
                            'port': 3000,
                        })
            except Exception:
                frameworks.add('Node.js App')

        # Check Python / Django / FastAPI
        if 'manage.py' in all_entries:
            files_found.append('manage.py')
            frameworks.add('Django')
            runtimes.add('Python')
            services.append({
                'name': 'Django Web Server',
                'category': 'django',
                'command': 'python manage.py runserver 0.0.0.0:8000',
                'cwd': dir_path,
                'port': 8000,
            })

        if 'requirements.txt' in all_entries:
            files_found.append('requirements.txt')
            runtimes.add('Python')
            try:
                with open(os.path.join(dir_path, 'requirements.txt'), 'r') as f:
                    req_content = f.read().lower()
                    if 'fastapi' in req_content and 'Django' not in frameworks:
                        frameworks.add('FastAPI')
                        services.append({
                            'name': 'FastAPI Engine',
                            'category': 'python',
                            'command': 'uvicorn main:app --reload --port 8080',
                            'cwd': dir_path,
                            'port': 8080,
                        })
                    if 'celery' in req_content:
                        frameworks.add('Celery')
                        services.append({
                            'name': 'Celery Worker',
                            'category': 'python',
                            'command': 'celery -A app worker -l info',
                            'cwd': dir_path,
                        })
            except Exception:
                pass

        # Check Docker
        if 'docker-compose.yml' in all_entries or 'docker-compose.yaml' in all_entries:
            files_found.append('docker-compose.yml')
            frameworks.add('Docker Compose')
            runtimes.add('Docker')
            services.append({
                'name': 'Docker Compose Cluster',
                'category': 'docker',
                'command': 'docker compose up',
                'cwd': dir_path,
            })

        if not services:
            services.append({
                'name': 'Default Service',
                'category': 'custom',
                'command': 'echo "Running custom process"',
                'cwd': dir_path,
                'port': 8000,
            })

        folder_name = os.path.basename(os.path.abspath(dir_path))
        return {
            'name': folder_name.replace('-', ' ').title(),
            'description': f"Auto-detected fullstack stack in {dir_path}",
            'frameworks': sorted(list(frameworks)) if frameworks else ['General Project'],
            'runtimes': sorted(list(runtimes)) if runtimes else ['POSIX / Shell'],
            'filesFound': sorted(files_found),
            'services': services,
        }
