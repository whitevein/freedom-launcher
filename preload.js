const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('launcher', {
  /* Auth */
  getHwid: () => ipcRenderer.invoke('get-hwid'),
  setAuthToken: (token) => ipcRenderer.invoke('set-auth-token', token),

  /* Process */
  launchInjector: () => ipcRenderer.invoke('launch-injector'),
  launchPoe: () => ipcRenderer.invoke('launch-poe'),
  killProcess: (name) => ipcRenderer.invoke('kill-process', name),
  restartProcess: (name) => ipcRenderer.invoke('restart-process', name),
  getProcessStatus: (name) => ipcRenderer.invoke('get-process-status', name),
  minimize: () => ipcRenderer.invoke('minimize'),
  close: () => ipcRenderer.invoke('close'),
  onProcessLog: (cb) => { ipcRenderer.on('process-log', (_, data) => cb(data)); },
  onProcessStatus: (cb) => { ipcRenderer.on('process-status', (_, data) => cb(data)); },

  /* Updater */
  checkUpdate: () => ipcRenderer.invoke('check-update'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (cb) => { ipcRenderer.on('update-status', (_, status, data) => cb(status, data)); },
  onUpdateProgress: (cb) => { ipcRenderer.on('update-download-progress', (_, pct) => cb(pct)); },
});
