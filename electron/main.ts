import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';
import os from 'os';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow: BrowserWindow | null = null;
let cachedMachineId: string | null = null;

function getAppIconPath(): string {
  const possiblePaths = [
    path.join(__dirname, '../dist/logo.png'),
    path.join(__dirname, '../public/logo.png'),
    path.join(app.getAppPath(), 'dist/logo.png'),
    path.join(app.getAppPath(), 'public/logo.png'),
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {}
  }
  return path.join(__dirname, '../public/logo.png');
}

// Enable background timer stability without overriding GPU pipeline
app.commandLine.appendSwitch('disable-background-timer-throttling');

function computeMachineId(): string {
  if (cachedMachineId) return cachedMachineId;

  let rawHwid = '';
  try {
    if (process.platform === 'win32') {
      try {
        const uuidOutput = execSync('wmic csproduct get uuid', { encoding: 'utf8', timeout: 3000 });
        const uuidMatch = uuidOutput.replace(/UUID/i, '').trim();
        if (uuidMatch && uuidMatch.length > 5) {
          rawHwid += uuidMatch;
        }
      } catch (e) {
        try {
          const psOutput = execSync(
            'powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"',
            { encoding: 'utf8', timeout: 3000 }
          );
          rawHwid += psOutput.trim();
        } catch (e2) {}
      }

      try {
        const volOutput = execSync('vol c:', { encoding: 'utf8', timeout: 2000 });
        const volMatch = volOutput.split('is').pop()?.trim();
        if (volMatch) rawHwid += `-${volMatch}`;
      } catch (e) {}
    }
  } catch (err) {}

  if (!rawHwid || rawHwid.length < 5) {
    const cpus = os.cpus();
    rawHwid = `${os.hostname()}-${cpus[0]?.model || 'cpos-hardware'}-${os.arch()}-${process.env.COMPUTERNAME || ''}`;
  }

  const hash = crypto.createHash('sha256').update(rawHwid).digest('hex').toUpperCase();
  cachedMachineId = `CPOS-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
  return cachedMachineId;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'C-POS — Sistem Kasir Offline',
    backgroundColor: '#0F172A',
    icon: getAppIconPath(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      devTools: isDev,
    },
    autoHideMenuBar: true,
  });

  // Block DevTools shortcuts and accidental refresh in production
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (!isDev) {
      if (
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i') ||
        (input.control && input.key.toLowerCase() === 'r') ||
        input.key === 'F5'
      ) {
        event.preventDefault();
      }
    }
  });

  // Prevent right click inspect element in production
  if (!isDev) {
    mainWindow.webContents.on('context-menu', (e) => {
      e.preventDefault();
    });
  }

  // Prevent opening arbitrary windows; open external links in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error(`[Electron Window Failed to Load] ${desc} (${code}) at ${url}`);
  });

  mainWindow.webContents.on('render-process-gone', (_e, details) => {
    console.error(`[Renderer Process Gone] Reason: ${details.reason}, ExitCode: ${details.exitCode}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Thermal Printer, Cash Drawer & Local System
ipcMain.handle('get-printers', async () => {
  if (!mainWindow) return [];
  try {
    return await mainWindow.webContents.getPrintersAsync();
  } catch (err) {
    console.error('Failed to get printers:', err);
    return [];
  }
});

ipcMain.handle('print-receipt', async (event, receiptHtml: string, printerName?: string) => {
  if (!mainWindow) return { success: false, message: 'Window not ready' };
  try {
    const printWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(receiptHtml)}`);
    await new Promise((r) => setTimeout(r, 100));

    return new Promise((resolve) => {
      const printOptions: any = {
        silent: true,
        printBackground: true,
        margins: { marginType: 'none' },
      };

      if (printerName && printerName.trim() !== '') {
        printOptions.deviceName = printerName.trim();
      }

      printWin.webContents.print(
        printOptions,
        (success, failureReason) => {
          // If printing with specific printer name failed, retry with default printer silently
          if (!success && printerName) {
            printWin.webContents.print(
              {
                silent: true,
                printBackground: true,
                margins: { marginType: 'none' },
              },
              (fallbackSuccess, fallbackReason) => {
                try {
                  if (!printWin.isDestroyed()) printWin.close();
                } catch (e) {}
                resolve({ success: fallbackSuccess, failureReason: fallbackReason });
              }
            );
            return;
          }

          try {
            if (!printWin.isDestroyed()) {
              printWin.close();
            }
          } catch (e) {}
          resolve({ success, failureReason });
        }
      );
    });
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
});

ipcMain.handle('open-cash-drawer', async () => {
  // ESC/POS command for cash drawer kick: ESC p 0 25 250
  return { success: true };
});

ipcMain.handle('get-system-info', async () => {
  return {
    platform: process.platform,
    version: app.getVersion(),
    arch: process.arch,
  };
});

ipcMain.handle('get-machine-id', async () => {
  return computeMachineId();
});

ipcMain.handle('open-external', async (event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
});

ipcMain.handle('save-secure-token', async (event, key: string, value: string) => {
  try {
    const dir = app.getPath('userData');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `.${crypto.createHash('md5').update(key).digest('hex')}.dat`);
    fs.writeFileSync(filePath, value, 'utf8');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message };
  }
});

ipcMain.handle('load-secure-token', async (event, key: string) => {
  try {
    const dir = app.getPath('userData');
    const filePath = path.join(dir, `.${crypto.createHash('md5').update(key).digest('hex')}.dat`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  } catch (err) {
    return null;
  }
});

// ── Auto-Updater Engine Configuration & Events ──────────────────────────
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function sendUpdateStatus(status: string, data: any = {}) {
  try {
    if (mainWindow && !mainWindow.isDestroyed() && mainWindow.webContents) {
      mainWindow.webContents.send('update-status', { status, ...data });
    }
  } catch (e) {}
}

autoUpdater.on('checking-for-update', () => {
  sendUpdateStatus('checking');
});

autoUpdater.on('update-available', (info) => {
  sendUpdateStatus('available', {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes,
  });
});

autoUpdater.on('update-not-available', (info) => {
  sendUpdateStatus('not-available', {
    version: info.version,
  });
});

autoUpdater.on('error', (err) => {
  sendUpdateStatus('error', {
    message: err == null ? 'Gagal menghubungi server update' : (err.message || String(err)),
  });
});

autoUpdater.on('download-progress', (progressObj) => {
  sendUpdateStatus('downloading', {
    percent: Math.round(progressObj.percent || 0),
    bytesPerSecond: progressObj.bytesPerSecond || 0,
    transferred: progressObj.transferred || 0,
    total: progressObj.total || 0,
  });
});

autoUpdater.on('update-downloaded', (info) => {
  sendUpdateStatus('downloaded', {
    version: info.version,
  });
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return {
      success: true,
      status: 'dev-mode',
      message: 'Mode pengembangan lokal. Auto-update aktif otomatis pada paket rilis installer.',
      currentVersion: app.getVersion(),
    };
  }
  try {
    const res = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: res?.updateInfo };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal memeriksa pembaruan' };
  }
});

ipcMain.handle('download-update', async () => {
  if (!app.isPackaged) {
    return { success: false, message: 'Tidak dapat mengunduh di mode pengembangan' };
  }
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Gagal memulai unduhan pembaruan' };
  }
});

ipcMain.handle('install-update', () => {
  try {
    autoUpdater.quitAndInstall(false, true);
  } catch (e) {
    console.error('Failed to quit and install update:', e);
  }
});

app.whenReady().then(() => {
  createWindow();

  // Perform background update check after 10 seconds in packaged mode
  if (app.isPackaged) {
    setTimeout(() => {
      try {
        autoUpdater.checkForUpdates().catch(() => {});
      } catch (e) {}
    }, 10000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

