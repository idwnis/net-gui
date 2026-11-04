# Net GUI Core Suite - Cross-Platform Deployment Guide

Net GUI is architected to operate identically across three primary deployment targets:
1. **macOS Desktop App** (packaged as `.dmg` with native titlebars, traffic lights, system tray & ASGI sidecar)
2. **Windows Desktop App** (packaged as `.exe` with NSIS installer, system tray & sidecar)
3. **Headless Linux Server** (headless ASGI daemon managed via `systemd` or `docker-compose`, accessible directly via standard web browsers at `http://<server-ip>:8000/`)

---

## 1. Quick Development Start (Fullstack Dev Server)

To run the complete fullstack environment locally (Django ASGI on `:8000` + Vite React Hot-Reload UI on `:5173`):

```bash
# One-click start: auto-provisions backend/venv, runs migrations, starts ASGI & Vite UI
bash start.sh
```

- **Vite UI**: [http://localhost:5173/](http://localhost:5173/)
- **Django ASGI Health**: [http://127.0.0.1:8000/api/health/](http://127.0.0.1:8000/api/health/)
- **OpenAPI 3.1 Swagger Docs**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)

---

## 2. macOS Desktop App (.dmg Installer)

The macOS build produces a standalone, self-contained DMG installer containing the Electron shell and the Python ASGI sidecar engine.

### Prerequisites
- Node.js 18+ and Python 3.10+

### Build Steps
```bash
# 1. Build the production React frontend SPA
npm run build:frontend

# 2. Build the Python ASGI standalone binary sidecar
npm run sidecar:build

# 3. Package the macOS DMG installer
npm run desktop:build:mac
```

### Output
The DMG image will be generated in `desktop/dist/`:
- `desktop/dist/Net GUI-2.0.0-mac-universal.dmg` (supports both Apple Silicon M1/M2/M3/M4 & Intel x86_64)

### Running in Development
```bash
# Runs Electron with local backend integration
npm run desktop:start
```

---

## 3. Windows Desktop App (.exe NSIS Installer)

The Windows target builds an NSIS setup installer that registers desktop & Start Menu shortcuts, manages tray icons, and encapsulates the backend without requiring a pre-installed Python runtime on the client machine.

### Build Steps
On a Windows machine (or cross-compiling via CI/CD):
```bash
# 1. Build frontend SPA
npm run build:frontend

# 2. Compile standalone Windows sidecar
python scripts/build_sidecar.py

# 3. Build Windows NSIS installer
npm run desktop:build:win
```

### Output
The installer will be generated in `desktop/dist/`:
- `desktop/dist/Net GUI-2.0.0-win-x64.exe`

---

## 4. Headless Linux Server (Browser Access via http://<ip>:8000)

Net GUI can be deployed to any Linux server (Ubuntu, Debian, CentOS, RHEL, Rocky Linux, Fedora, Arch Linux). Django serves both the REST/WebSocket backend and the compiled React SPA directly on port 8000.

### Option A: Automated Systemd Setup (Recommended)
Run our automated installation script as root / sudo:

```bash
sudo bash deploy/linux_setup.sh
```

This script:
1. Installs system dependencies (`python3-venv`, `lsof`, `curl`, etc.)
2. Creates an isolated system user `netpulse`
3. Copies backend and pre-built frontend files to `/opt/netpulse`
4. Creates a writable database directory at `/var/lib/netpulse`
5. Configures and registers `/etc/systemd/system/netpulse.service`
6. Enables and starts the service immediately

Check status:
```bash
systemctl status netpulse
journalctl -u netpulse -f
```

### Option B: Docker / Docker Compose Setup
Run with zero host dependencies via Docker:

```bash
# Start NetPulse in detached mode
docker-compose up -d --build
```

Access:
- **Web UI & API**: `http://<server-ip>:8000/`

---

## 5. Architectural Highlights

| Feature | Desktop (macOS / Windows) | Linux Server (Browser) |
|---|---|---|
| **Frontend Serving** | Electron loads `http://127.0.0.1:<dynamic_port>/` | Daphne / WhiteNoise serves Vite SPA at `/` |
| **Backend Engine** | Bundled PyInstaller sidecar (`netpulse-core`) | Daphne ASGI running inside venv or Docker container |
| **Data Directory** | Native OS user data path (`app.getPath('userData')`) | `/var/lib/netpulse/` or local `backend/` volume |
| **System Tray** | Native macOS / Win32 tray with RAM optimize & Scan triggers | N/A (Server mode) |
| **Process Management** | Electron manages child process group lifecycle | Managed by `systemd` or Docker supervisor |
