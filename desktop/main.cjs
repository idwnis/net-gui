const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const { spawn, execSync } = require('child_process');

let mainWindow = null;
let tray = null;
let backendProcess = null;
let backendPort = 8000;

// Resolve application paths
const isDev = !app.isPackaged;
const rootDir = isDev 
  ? path.resolve(__dirname, '..') 
  : path.join(process.resourcesPath, 'app');

const backendDir = path.join(rootDir, 'backend');

/**
 * Check if a port is in use using Node net probe
 */
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      server.once('close', () => resolve(startPort));
      server.close();
    });
    server.on('error', () => {
      resolve(startPort + 1);
    });
  });
}

/**
 * Launch Python ASGI Backend (Daphne / Sidecar binary)
 */
async function launchBackend() {
  backendPort = await findFreePort(8000);
  console.log(`[NetPulse Desktop] Launching backend engine on port ${backendPort}...`);

  let binaryPath = '';
  let args = [];
  let cwd = backendDir;
  const env = { 
    ...process.env, 
    PYTHONPATH: backendDir,
    DJANGO_SETTINGS_MODULE: 'config.settings',
    PYTHONUNBUFFERED: '1',
    PORT: String(backendPort),
    NETPULSE_DATA_DIR: app.getPath('userData'),
  };

  if (!isDev) {
    // Production Packaged App: look for bundled sidecar in extraResources
    const sidecarBinary = process.platform === 'win32' ? 'netpulse-core.exe' : 'netpulse-core';
    const bundledSidecar = path.join(process.resourcesPath, 'sidecar', sidecarBinary);

    if (require('fs').existsSync(bundledSidecar)) {
      binaryPath = bundledSidecar;
      args = ['-b', '127.0.0.1', '-p', String(backendPort)];
    } else {
      // Fallback to bundled Python virtualenv
      const pythonExe = process.platform === 'win32'
        ? path.join(process.resourcesPath, 'backend', 'venv', 'Scripts', 'python.exe')
        : path.join(process.resourcesPath, 'backend', 'venv', 'bin', 'python');
      binaryPath = pythonExe;
      args = ['manage.py', 'runserver', `127.0.0.1:${backendPort}`];
      cwd = path.join(process.resourcesPath, 'backend');
    }
  } else {
    // Development Mode: use workspace backend/venv
    const venvPython = process.platform === 'win32'
      ? path.join(backendDir, 'venv', 'Scripts', 'python.exe')
      : path.join(backendDir, 'venv', 'bin', 'python');

    const sidecarScript = path.join(backendDir, 'sidecar_entry.py');
    if (require('fs').existsSync(sidecarScript) && require('fs').existsSync(venvPython)) {
      binaryPath = venvPython;
      args = [sidecarScript, '-b', '127.0.0.1', '-p', String(backendPort)];
    } else {
      const venvDaphne = process.platform === 'win32'
        ? path.join(backendDir, 'venv', 'Scripts', 'daphne.exe')
        : path.join(backendDir, 'venv', 'bin', 'daphne');

      if (require('fs').existsSync(venvDaphne)) {
        binaryPath = venvDaphne;
        args = ['-b', '127.0.0.1', '-p', String(backendPort), 'config.asgi:application'];
      } else {
        binaryPath = require('fs').existsSync(venvPython) ? venvPython : 'python3';
        args = ['manage.py', 'runserver', `127.0.0.1:${backendPort}`];
      }
    }
  }

  try {
    const isWin = process.platform === 'win32';
    backendProcess = spawn(binaryPath, args, {
      cwd,
      env,
      stdio: 'pipe',
      detached: !isWin, // allow process group termination on Unix
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Core Engine] ${data.toString().trim()}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Core Engine ERR] ${data.toString().trim()}`);
    });

    backendProcess.on('exit', (code, signal) => {
      console.log(`[NetPulse Desktop] Backend process exited (code: ${code}, signal: ${signal})`);
    });
  } catch (err) {
    console.error('[NetPulse Desktop] Failed to launch backend sidecar:', err);
  }
}

/**
 * Polls backend /api/health/ until 200 OK
 */
function waitForBackend(port, maxAttempts = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      http.get(`http://127.0.0.1:${port}/api/health/`, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve(true);
        }
      }).on('error', () => {
        if (attempts >= maxAttempts) {
          clearInterval(interval);
          resolve(false);
        }
      });
    }, 500);
  });
}

/**
 * Terminate backend process and all spawned child processes
 */
function killBackend() {
  if (backendProcess && backendProcess.pid) {
    console.log(`[NetPulse Desktop] Terminating backend PID ${backendProcess.pid}...`);
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /F /T /PID ${backendProcess.pid}`);
      } else {
        process.kill(-backendProcess.pid, 'SIGTERM');
      }
    } catch (e) {
      try {
        backendProcess.kill('SIGKILL');
      } catch (err) {}
    }
    backendProcess = null;
  }
}

/**
 * Create native desktop BrowserWindow
 */
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1040,
    minHeight: 700,
    backgroundColor: '#0b0f19',
    title: 'Net GUI Radar & Dev Orchestrator',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: { x: 18, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    show: false,
  });

  // Target URL: Loads unified Single Page App directly from Django backend
  const targetUrl = `http://127.0.0.1:${backendPort}/`;
  mainWindow.loadURL(targetUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.send('backend-ready', backendPort);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // External link handling
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      require('electron').shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

/**
 * Initialize Native System Tray
 */
function createSystemTray() {
  try {
    // 16x16 / 32x32 SVG or Template Icon with Net GUI Brand Symbol
    const icon = nativeImage.createFromBuffer(Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 256 256"><path fill="#0E1420" d="M80 36H176A44 44 0 0 1 220 80V176A44 44 0 0 1 176 220H80A44 44 0 0 1 36 176V80A44 44 0 0 1 80 36Z"/><path fill="#2EE6A6" d="M96 84A12 12 0 0 0 84 96V148A12 12 0 0 0 96 160H108V172A12 12 0 0 0 120 184H136A12 12 0 0 0 148 172V160H160A12 12 0 0 0 172 148V96A12 12 0 0 0 160 84Z"/></svg>'
    ));

    tray = new Tray(icon);
    tray.setToolTip('Net GUI Radar & Dev Orchestrator');

    const contextMenu = Menu.buildFromTemplate([
      { 
        label: 'Net GUI Core Suite 2.0', 
        enabled: false 
      },
      { 
        label: `Active Engine: 127.0.0.1:${backendPort}`, 
        enabled: false 
      },
      { type: 'separator' },
      { 
        label: 'Open Dashboard', 
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          } else {
            createMainWindow();
          }
        } 
      },
      { 
        label: 'Trigger Subnet Scan', 
        click: () => {
          http.request({
            hostname: '127.0.0.1',
            port: backendPort,
            path: '/api/radar/scan/',
            method: 'POST'
          }).end();
        } 
      },
      { 
        label: 'Optimize System RAM', 
        click: () => {
          http.request({
            hostname: '127.0.0.1',
            port: backendPort,
            path: '/api/telemetry/optimize-ram/',
            method: 'POST'
          }).end();
        } 
      },
      { type: 'separator' },
      { 
        label: 'Quit Net GUI', 
        click: () => {
          app.quit();
        } 
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      if (mainWindow) mainWindow.show();
    });
  } catch (err) {
    console.debug('[NetPulse Desktop] System tray notice:', err.message);
  }
}

// Window control IPC handlers
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

// App Lifecycle
app.whenReady().then(async () => {
  await launchBackend();
  const ready = await waitForBackend(backendPort);
  if (!ready) {
    console.warn('[NetPulse Desktop] Warning: Backend health check timed out. Proceeding to open window...');
  }

  createMainWindow();
  createSystemTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', () => {
  killBackend();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
