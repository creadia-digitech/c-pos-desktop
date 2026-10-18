import { useState, useEffect, useCallback } from 'react';

export type UpdateStateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'
  | 'dev-mode';

export interface UpdateInfoState {
  status: UpdateStateStatus;
  version?: string;
  releaseDate?: string;
  releaseNotes?: string;
  percent: number;
  bytesPerSecond: number;
  transferred: number;
  total: number;
  errorMessage?: string;
  lastChecked: Date | null;
}

export function useAutoUpdate() {
  const [updateState, setUpdateState] = useState<UpdateInfoState>({
    status: 'idle',
    percent: 0,
    bytesPerSecond: 0,
    transferred: 0,
    total: 0,
    lastChecked: null,
  });

  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.onUpdateStatus) return;

    const cleanup = electronAPI.onUpdateStatus((data: any) => {
      if (!data || !data.status) return;

      setUpdateState((prev) => {
        switch (data.status) {
          case 'checking':
            return { ...prev, status: 'checking', errorMessage: undefined };
          case 'available':
            return {
              ...prev,
              status: 'available',
              version: data.version,
              releaseDate: data.releaseDate,
              releaseNotes: data.releaseNotes,
              lastChecked: new Date(),
            };
          case 'not-available':
            return {
              ...prev,
              status: 'not-available',
              version: data.version,
              lastChecked: new Date(),
            };
          case 'downloading':
            return {
              ...prev,
              status: 'downloading',
              percent: data.percent ?? prev.percent,
              bytesPerSecond: data.bytesPerSecond ?? 0,
              transferred: data.transferred ?? 0,
              total: data.total ?? 0,
            };
          case 'downloaded':
            return {
              ...prev,
              status: 'downloaded',
              version: data.version ?? prev.version,
              percent: 100,
            };
          case 'error':
            return {
              ...prev,
              status: 'error',
              errorMessage: data.message || 'Terjadi kesalahan pada server pembaruan',
              lastChecked: new Date(),
            };
          default:
            return prev;
        }
      });
    });

    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, []);

  const checkForUpdates = useCallback(async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.checkForUpdates) {
      setUpdateState((prev) => ({
        ...prev,
        status: 'dev-mode',
        errorMessage: 'Fitur pembaruan otomatis aktif di aplikasi desktop yang terpasang.',
        lastChecked: new Date(),
      }));
      return;
    }

    setUpdateState((prev) => ({ ...prev, status: 'checking', errorMessage: undefined }));

    try {
      const res = await electronAPI.checkForUpdates();
      if (res?.status === 'dev-mode') {
        setUpdateState((prev) => ({
          ...prev,
          status: 'dev-mode',
          errorMessage: res.message,
          lastChecked: new Date(),
        }));
      }
    } catch (err: any) {
      setUpdateState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Gagal memeriksa server pembaruan',
        lastChecked: new Date(),
      }));
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.downloadUpdate) return;

    setUpdateState((prev) => ({ ...prev, status: 'downloading', percent: 0 }));
    try {
      await electronAPI.downloadUpdate();
    } catch (err: any) {
      setUpdateState((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: err?.message || 'Gagal memulai unduhan',
      }));
    }
  }, []);

  const installUpdate = useCallback(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.installUpdate) {
      electronAPI.installUpdate();
    }
  }, []);

  return {
    ...updateState,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
}
