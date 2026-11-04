import os
import mimetypes
from django.http import HttpResponse, Http404
from django.conf import settings

def serve_spa(request):
    """
    Serves the compiled Vite React Single Page Application (frontend/dist/index.html).
    Enables direct web browser access to Net GUI on headless Linux servers.
    """
    dist_index = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'index.html'
    if dist_index.exists():
        with open(dist_index, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read(), content_type='text/html')
    return HttpResponse(
        """
        <!DOCTYPE html>
        <html>
        <head><title>Net GUI Core Suite</title></head>
        <body style="font-family: sans-serif; background: #0a1122; color: #fff; padding: 40px; text-align: center;">
            <h2>⚡ Net GUI Core Suite Engine</h2>
            <p>Django 5.1 ASGI Backend is active and healthy on port 8000.</p>
            <p>To compile the liquid glass frontend, run: <code>npm --prefix frontend run build</code></p>
            <p><a href="/api/docs/" style="color: #38bdf8;">View OpenAPI 3.1 Swagger Documentation &rarr;</a></p>
        </body>
        </html>
        """,
        content_type='text/html'
    )

def serve_assets(request, path):
    """
    Serves built Vite assets (JavaScript bundles, CSS stylesheets, chunks).
    """
    asset_file = settings.BASE_DIR.parent / 'frontend' / 'dist' / 'assets' / path
    if asset_file.exists() and os.path.isfile(asset_file):
        content_type, _ = mimetypes.guess_type(str(asset_file))
        # Default javascript modules to application/javascript
        if str(path).endswith('.js') or str(path).endswith('.mjs'):
            content_type = 'application/javascript'
        elif str(path).endswith('.css'):
            content_type = 'text/css'

        with open(asset_file, 'rb') as f:
            return HttpResponse(f.read(), content_type=content_type or 'application/octet-stream')
    raise Http404("Asset not found.")
