#!/usr/bin/env python3
"""
Net GUI Core Engine - Standalone Sidecar Entrypoint
Wraps Django 5.1 ASGI & Channels into a self-contained runtime for
macOS DMG (.app), Windows EXE (NSIS), and standalone Linux sidecar packaging.
"""

import argparse
import os
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Net GUI Core ASGI Engine")
    parser.add_argument("-b", "--bind", default="127.0.0.1", help="Interface to bind (default: 127.0.0.1)")
    parser.add_argument("-p", "--port", type=int, default=8000, help="Port to listen on (default: 8000)")
    parser.add_argument("--data-dir", default=None, help="Custom data directory for SQLite & uploads")
    parser.add_argument("--no-migrate", action="store_true", help="Skip running database migrations on startup")
    args = parser.parse_args()

    # Determine backend directory
    if getattr(sys, "frozen", False):
        # Running as PyInstaller frozen binary
        base_dir = Path(sys._MEIPASS)
    else:
        base_dir = Path(__file__).resolve().parent

    if str(base_dir) not in sys.path:
        sys.path.insert(0, str(base_dir))

    if args.data_dir:
        os.environ["NETGUI_DATA_DIR"] = args.data_dir

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    os.environ["PYTHONUNBUFFERED"] = "1"

    # Setup Django
    import django
    django.setup()

    # Auto-run database migrations if not skipped
    if not args.no_migrate:
        from django.core.management import call_command
        from django.db import connection
        try:
            print(f"[Net GUI Core] Checking database migrations...")
            call_command("migrate", interactive=False, verbosity=0)
            connection.close()
            print(f"[Net GUI Core] Database migrations verified.")
        except Exception as e:
            print(f"[Net GUI Core] Migration warning: {e}", file=sys.stderr)
            connection.close()

    # Initialize and execute Daphne ASGI Server
    from config.asgi import application
    from daphne.server import Server

    endpoint = f"tcp:port={args.port}:interface={args.bind}"
    print(f"[Net GUI Core] Starting ASGI server on {args.bind}:{args.port}...")

    server = Server(
        application=application,
        endpoints=[endpoint],
        signal_handlers=True,
        action_logger=None,
        http_timeout=120,
        websocket_timeout=86400,
        websocket_connect_timeout=30,
        ping_interval=25,
        ping_timeout=60,
    )

    try:
        server.run()
    except (KeyboardInterrupt, SystemExit):
        print("[Net GUI Core] Graceful shutdown completed.")

if __name__ == "__main__":
    main()
