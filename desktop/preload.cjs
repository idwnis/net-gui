const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('netpulse', {
  isElectron: true,
  platform: process.platform,
  arch: process.arch,
  version: '2.0.0',
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  onBackendReady: (callback) => ipcRenderer.on('backend-ready', (_event, port) => callback(port)),
});
