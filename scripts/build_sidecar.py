#!/usr/bin/env python3
"""
NetPulse Desktop Sidecar Builder
Compiles the Django 5.1 ASGI backend into a standalone binary using PyInstaller.
Places the compiled binary in desktop/sidecar/ for Electron packaging (macOS DMG, Windows EXE).
"""

import os
import sys
import shutil
import platform
import subprocess
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
DESKTOP_DIR = ROOT_DIR / "desktop"
SIDECAR_DIR = DESKTOP_DIR / "sidecar"
DIST_TMP = ROOT_DIR / "build_sidecar_dist"
WORK_TMP = ROOT_DIR / "build_sidecar_work"

def ensure_pyinstaller():
    """Verify PyInstaller is installed in the active environment."""
    try:
        import PyInstaller
        print(f"[Sidecar Builder] PyInstaller {PyInstaller.__version__} detected.")
    except ImportError:
        print("[Sidecar Builder] PyInstaller not detected. Installing in current environment...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pyinstaller>=6.5.0"])

def build():
    print("==========================================================")
    print("   🔨 NetPulse Standalone Sidecar Binary Compilation      ")
    print(f"   OS: {platform.system()} {platform.machine()}           ")
    print("==========================================================")

    ensure_pyinstaller()

    SIDECAR_DIR.mkdir(parents=True, exist_ok=True)
    sep = ";" if platform.system() == "Windows" else ":"

    hidden_imports = [
        "channels",
        "channels.layers",
        "channels.routing",
        "daphne",
        "daphne.server",
        "twisted",
        "twisted.internet",
        "twisted.internet.asyncioreactor",
        "autobahn",
        "whitenoise",
        "rest_framework",
        "corsheaders",
        "drf_spectacular",
        "psutil",
        "httpx",
        "django.db.backends.sqlite3",
        "django.contrib.contenttypes",
        "django.contrib.auth",
        "django.contrib.sessions",
        "django.contrib.messages",
        "django.contrib.staticfiles",
        "apps.core",
        "apps.core.apps",
        "apps.telemetry",
        "apps.telemetry.apps",
        "apps.ports",
        "apps.ports.apps",
        "apps.radar",
        "apps.radar.apps",
        "apps.runner",
        "apps.runner.apps",
        "apps.gateway",
        "apps.gateway.apps",
        "apps.sniffer",
        "apps.sniffer.apps",
        "apps.landrop",
        "apps.landrop.apps",
        "apps.switchboard",
        "apps.switchboard.apps",
        "apps.watchdog",
        "apps.watchdog.apps",
        "config",
        "config.asgi",
        "config.settings",
        "config.urls",
    ]

    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--name=netpulse-core",
        "--onefile",
        "--clean",
        "--distpath", str(DIST_TMP),
        "--workpath", str(WORK_TMP),
        "--specpath", str(ROOT_DIR / "build_sidecar_spec"),
        f"--paths={BACKEND_DIR}",
    ]

    for hi in hidden_imports:
        cmd.extend(["--hidden-import", hi])

    entrypoint = BACKEND_DIR / "sidecar_entry.py"
    cmd.append(str(entrypoint))

    print(f"[Sidecar Builder] Executing PyInstaller command...")
    env = dict(os.environ)
    env["DJANGO_SETTINGS_MODULE"] = "config.settings"
    env["PYTHONPATH"] = str(BACKEND_DIR)
    env["PYINSTALLER_CONFIG_DIR"] = str(ROOT_DIR / ".pyinstaller_cache")
    (ROOT_DIR / ".pyinstaller_cache").mkdir(parents=True, exist_ok=True)
    subprocess.check_call(cmd, env=env)

    # Locate generated binary
    binary_name = "netpulse-core.exe" if platform.system() == "Windows" else "netpulse-core"
    generated_file = DIST_TMP / binary_name

    if generated_file.exists():
        dest = SIDECAR_DIR / binary_name
        shutil.copy2(generated_file, dest)
        os.chmod(dest, 0o755)
        print(f"✅ Sidecar binary compiled and installed to: {dest}")
    else:
        raise FileNotFoundError(f"Expected generated binary not found at {generated_file}")

    # Cleanup temporary build dirs
    for p in [DIST_TMP, WORK_TMP, ROOT_DIR / "build_sidecar_spec"]:
        if p.is_dir():
            shutil.rmtree(p, ignore_errors=True)
        elif p.is_file():
            p.unlink()

    print("[Sidecar Builder] Build complete!")

if __name__ == "__main__":
    build()
