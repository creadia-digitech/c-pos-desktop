import { contextBridge, ipcRenderer } from 'electron';

const api = {
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  printReceipt: (receiptHtml: string, printerName?: string) => ipcRenderer.invoke('print-receipt', receiptHtml, printerName),
  openCashDrawer: () => ipcRenderer.invoke('open-cash-drawer'),
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getMachineId: () => ipcRenderer.invoke('get-machine-id'),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  openExternalUrl: (url: string) => ipcRenderer.invoke('open-external', url),
  saveSecureToken: (key: string, value: string) => ipcRenderer.invoke('save-secure-token', key, value),
  loadSecureToken: (key: string) => ipcRenderer.invoke('load-secure-token', key),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateStatus: (callback: (data: any) => void) => {
    const handler = (_event: any, data: any) => callback(data);
    ipcRenderer.on('update-status', handler);
    return () => ipcRenderer.removeListener('update-status', handler);
  },
};

try {
  contextBridge.exposeInMainWorld('electronAPI', api);
} catch (e) {
  // Context bridge unavailable when contextIsolation: false
}

try {
  (window as any).electronAPI = api;
} catch (e) {}

