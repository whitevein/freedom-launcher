const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { autoUpdater } = require('electron-updater');

let mainWindow;
const APP_DIR = path.dirname(__dirname);
const INJECTOR_PATH = path.join(APP_DIR, 'injector.exe');
const POE_PATH = path.join(APP_DIR, 'poeNullEffects_260702_private', 'poeNullEffects_private.exe');
const runningProcs = new Map();
let authToken = null;

/* ─── HWID Generation ─── */

function generateHwid() {
  const nets = Object.values(os.networkInterfaces()).flat().filter(
    n => n && !n.internal && n.mac && n.mac !== '00:00:00:00:00:00'
  );
  const macs = nets.map(n => n.mac).sort().join('|');
  const raw = [
    os.hostname(),
    os.platform(),
    os.release(),
    os.machine(),
    macs,
  ].join('||');
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 540,
    minWidth: 480,
    minHeight: 420,
    frame: false,
    backgroundColor: '#080808',
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'), { query: { v: Date.now().toString() } });
  mainWindow.webContents.session.clearCache().catch(() => {});
  setupUpdater();
}

/* ─── Auto-Updater ─── */

function setupUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.forceDevUpdateConfig = true;

  autoUpdater.on('checking-for-update', () => {
    mainWindow?.webContents.send('update-status', 'checking');
  });
  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-status', 'available', info.version);
  });
  autoUpdater.on('update-not-available', () => {
    mainWindow?.webContents.send('update-status', 'uptodate');
  });
  autoUpdater.on('download-progress', (progress) => {
    mainWindow?.webContents.send('update-download-progress', progress.percent);
  });
  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-status', 'downloaded');
  });
  autoUpdater.on('error', (err) => {
    mainWindow?.webContents.send('update-status', 'error', err.message);
  });

  ipcMain.handle('check-update', async () => {
    try {
      console.log('[updater] checking for updates...');
      const result = await autoUpdater.checkForUpdates();
      console.log('[updater] check result:', result);
    } catch (e) {
      console.error('[updater] check failed:', e.message, e.stack);
      mainWindow?.webContents.send('update-status', 'error', e.message);
    }
  });
  ipcMain.handle('download-update', () => { autoUpdater.downloadUpdate(); });
  ipcMain.handle('install-update', () => { autoUpdater.quitAndInstall(); });
}

/* ─── Auth IPC ─── */

ipcMain.handle('get-hwid', () => generateHwid());

ipcMain.handle('set-auth-token', (_, token) => {
  authToken = token;
});

/* ─── Process Management ─── */

function launchExe(exePath, cwd, name) {
  return new Promise((resolve) => {
    if (!fs.existsSync(exePath)) {
      resolve({ success: false, error: `File not found: ${path.basename(exePath)}` });
      return;
    }
    try {
      const env = { ...process.env };
      if (authToken) env.AUTH_TOKEN = authToken;
      try { env.HWID = generateHwid(); } catch (_) {}

      const proc = spawn(exePath, [], { cwd, detached: false, stdio: ['ignore', 'pipe', 'pipe'], env });

      proc.stdout.on('data', (data) => {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('process-log', { name, stream: 'stdout', data: data.toString() });
      });
      proc.stderr.on('data', (data) => {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('process-log', { name, stream: 'stderr', data: data.toString() });
      });
      proc.on('close', (code) => {
        runningProcs.delete(name);
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('process-status', { name, running: false, exitCode: code });
      });
      proc.on('error', (err) => {
        runningProcs.delete(name);
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('process-status', { name, running: false, exitCode: -1, error: err.message });
      });

      runningProcs.set(name, { proc, pid: proc.pid, startTime: Date.now(), exePath, cwd });
      resolve({ success: true, name, pid: proc.pid });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
}

function getProcStatus(name) {
  const entry = runningProcs.get(name);
  if (!entry) return { name, running: false };
  const alive = entry.proc.exitCode === null;
  if (!alive) runningProcs.delete(name);
  return { name, running: alive, pid: alive ? entry.pid : null, startTime: alive ? entry.startTime : null };
}

ipcMain.handle('launch-injector', async () => {
  const existing = getProcStatus('Injector');
  if (existing.running) return { success: false, error: 'Already running' };
  return launchExe(INJECTOR_PATH, APP_DIR, 'Injector');
});

ipcMain.handle('launch-poe', async () => {
  const existing = getProcStatus('poeNullEffects');
  if (existing.running) return { success: false, error: 'Already running' };
  return launchExe(POE_PATH, path.join(APP_DIR, 'poeNullEffects_260702_private'), 'poeNullEffects');
});

ipcMain.handle('kill-process', (_, name) => {
  const entry = runningProcs.get(name);
  if (!entry) return { success: false, error: 'Not running' };
  try { entry.proc.kill(); return { success: true }; }
  catch (err) { return { success: false, error: err.message }; }
});

ipcMain.handle('restart-process', async (_, name) => {
  const entry = runningProcs.get(name);
  if (entry) { try { entry.proc.kill(); } catch (_) {} runningProcs.delete(name); }
  const info = entry || { exePath: name === 'Injector' ? INJECTOR_PATH : POE_PATH,
    cwd: name === 'Injector' ? APP_DIR : path.join(APP_DIR, 'poeNullEffects_260702_private') };
  return launchExe(info.exePath, info.cwd, name);
});

ipcMain.handle('get-process-status', (_, name) => getProcStatus(name));
ipcMain.handle('minimize', () => mainWindow?.minimize());
ipcMain.handle('close', () => mainWindow?.close());

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
