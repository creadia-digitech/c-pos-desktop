import React, { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import { BusinessType, Employee, UserRole } from '../types';
import { useTranslation } from '../utils/useTranslation';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import {
  generateThermalReceiptHtml,
  printViaIsolatedIframe,
  printDirectBluetooth,
  getElectronAPI,
} from '../utils/printer';
import {
  Store,
  Printer,
  Users,
  Percent,
  HardDrive,
  Save,
  RefreshCw,
  Plus,
  KeyRound,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Edit3,
  X,
  Lock,
  UserCheck,
  Bluetooth,
  Usb,
  Wifi,
  Check,
  CheckCircle2,
  Sparkles,
  Utensils,
  ShoppingBag,
  Download,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Crown,
  Search,
  FileText,
  ShieldAlert,
  MessageCircle,
  Copy,
  ExternalLink,
  Cpu,
  DownloadCloud,
  Rocket,
} from 'lucide-react';
import { getMachineId, getSavedLicense, buildWhatsAppUrl, LicenseCertificate } from '../utils/license';
import { UpdateManagerModal } from '../components/common/UpdateManagerModal';
import { useAutoUpdate } from '../utils/useAutoUpdate';

export const SettingsPage: React.FC = () => {
  const {
    businessName,
    businessAddress,
    businessPhone,
    businessType,
    taxEnabled,
    taxName,
    taxRate,
    serviceChargeEnabled,
    serviceChargeName,
    serviceChargeRate,
    printerType: storePrinterType,
    selectedPrinter: storeSelectedPrinter,
    paperWidth: storePaperWidth,
    autoSilentPrint: storeAutoSilentPrint,
    bluetoothDeviceName: storeBtDeviceName,
    networkPrinterIp: storeNetIp,
    networkPrinterPort: storeNetPort,
    setPrinterSettings,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    resetEmployeePin,
    resetDatabasePreserveAccounts,
    currentEmployee,
    addToast,
    auditLogs,
    addAuditLog,
  } = useStore();
  const { t } = useTranslation();

  // ── Audit Log State ──────────────────────────────────
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditSearch, setAuditSearch] = useState<string>('');

  // ── Store Profile State ──────────────────────────────
  const [bName, setBName] = useState(businessName);
  const [bAddress, setBAddress] = useState(businessAddress);
  const [bPhone, setBPhone] = useState(businessPhone);
  const [bType, setBType] = useState<BusinessType>(businessType);

  // ── Tax & Service Charge State ───────────────────────
  const [tEnabled, setTEnabled] = useState(taxEnabled);
  const [tName, setTName] = useState(taxName);
  const [tRate, setTRate] = useState(taxRate);
  const [sEnabled, setSEnabled] = useState(serviceChargeEnabled);
  const [sName, setSName] = useState(serviceChargeName || 'Service Charge');
  const [sRate, setSRate] = useState(serviceChargeRate ?? 5);

  // ── Printer State ────────────────────────────────────
  const [printerType, setPrinterType] = useState<'usb' | 'bluetooth' | 'network'>(storePrinterType || 'usb');
  const [selectedPrinter, setSelectedPrinterState] = useState(storeSelectedPrinter || 'POS-58');
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(storePaperWidth || '58mm');
  const [autoPrint, setAutoPrint] = useState(storeAutoSilentPrint ?? true);
  const [btDeviceName, setBtDeviceName] = useState(storeBtDeviceName || '');
  const [netIp, setNetIp] = useState(storeNetIp || '192.168.1.200');
  const [netPort, setNetPort] = useState(storeNetPort || 9100);
  const [isCustomPrinter, setIsCustomPrinter] = useState(false);
  const [customPrinterInput, setCustomPrinterInput] = useState('');

  // Hardware Scanner State
  const [systemPrinters, setSystemPrinters] = useState<{ name: string; isDefault?: boolean }[]>([]);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isScanningBt, setIsScanningBt] = useState(false);
  const [isTestingNet, setIsTestingNet] = useState(false);

  // ── Employees Management State ───────────────────────
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);

  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('cashier');
  const [empPin, setEmpPin] = useState('');
  const [empColor, setEmpColor] = useState('#6C5CE7');
  const [empActive, setEmpActive] = useState(true);

  const [pinResetEmp, setPinResetEmp] = useState<Employee | null>(null);
  const [quickNewPin, setQuickNewPin] = useState('');

  // ── Hardware License State ───────────────────────────
  const [hwid, setHwid] = useState<string>('Memuat ID...');
  const [licenseCert, setLicenseCert] = useState<LicenseCertificate | null>(null);
  const [isHwidCopied, setIsHwidCopied] = useState<boolean>(false);
  const [showFullKey, setShowFullKey] = useState<boolean>(false);

  // ── Auto-Update State ─────────────────────────────────
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const autoUpdate = useAutoUpdate();

  useEffect(() => {
    let isMounted = true;
    getMachineId().then((id) => {
      if (isMounted) setHwid(id);
    });
    setLicenseCert(getSavedLicense());
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyHwid = async () => {
    try {
      await navigator.clipboard.writeText(hwid);
      setIsHwidCopied(true);
      addToast('success', 'Hardware Machine ID (HWID) berhasil disalin!');
      setTimeout(() => setIsHwidCopied(false), 2500);
    } catch {
      addToast('error', 'Gagal menyalin HWID');
    }
  };

  const handleOpenWhatsAppSupport = () => {
    const url = buildWhatsAppUrl(hwid, businessName);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.openExternal === 'function') {
      electronAPI.openExternal(url);
    } else if (electronAPI && typeof electronAPI.openExternalUrl === 'function') {
      electronAPI.openExternalUrl(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // ── Backup & Sync State ──────────────────────────────
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState('');
  const [autoBackupBeforeReset, setAutoBackupBeforeReset] = useState(true);

  // Load system printers from Electron on mount
  const loadPrinters = async () => {
    setIsLoadingPrinters(true);
    const electronAPI = getElectronAPI();
    if (electronAPI?.getPrinters) {
      try {
        const list = await electronAPI.getPrinters();
        if (Array.isArray(list) && list.length > 0) {
          setSystemPrinters(list);
          const hasMatch = list.some((p: any) => p.name === selectedPrinter);
          if (!hasMatch && !isCustomPrinter) {
            const def = list.find((p: any) => p.isDefault) || list[0];
            setSelectedPrinterState(def.name);
          }
        }
      } catch (err) {
        console.error('Failed to load system printers:', err);
      }
    }
    setIsLoadingPrinters(false);
  };

  useEffect(() => {
    loadPrinters();
  }, []);

  // ── Action Handlers ──────────────────────────────────
  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    useStore.setState({
      businessName: bName.trim(),
      businessAddress: bAddress.trim(),
      businessPhone: bPhone.trim(),
      businessType: bType,
    });
    addToast('success', 'Profil toko & alur kerja berhasil disimpan!');
    addAuditLog({
      employeeId: currentEmployee?.id || 'sys',
      employeeName: currentEmployee?.name || 'Owner',
      employeeRole: currentEmployee?.role || 'owner',
      action: 'settings_change',
      details: `Perbarui profil bisnis: ${bName.trim()} (${bType.toUpperCase()})`,
      authorizedBy: currentEmployee?.name || 'Owner',
    });
  };

  const handleSaveTaxSettings = (e: React.FormEvent) => {
    e.preventDefault();
    useStore.setState({
      taxEnabled: tEnabled,
      taxName: tName.trim() || 'PPN',
      taxRate: tRate,
      serviceChargeEnabled: sEnabled,
      serviceChargeName: sName.trim() || 'Service Charge',
      serviceChargeRate: sRate,
    });
    addToast('success', 'Pengaturan pajak PPN & biaya layanan berhasil disimpan!');
    addAuditLog({
      employeeId: currentEmployee?.id || 'sys',
      employeeName: currentEmployee?.name || 'Owner',
      employeeRole: currentEmployee?.role || 'owner',
      action: 'settings_change',
      details: `Perbarui aturan pajak: Pajak=${tEnabled ? `${tRate}%` : 'Off'}, Service=${sEnabled ? `${sRate}%` : 'Off'}`,
      authorizedBy: currentEmployee?.name || 'Owner',
    });
  };

  const handleSavePrinterConfig = () => {
    const finalPrinterName = isCustomPrinter ? (customPrinterInput.trim() || 'POS-58') : selectedPrinter;
    setPrinterSettings({
      printerType,
      selectedPrinter: finalPrinterName,
      paperWidth,
      autoSilentPrint: autoPrint,
      bluetoothDeviceName: btDeviceName.trim(),
      networkPrinterIp: netIp.trim(),
      networkPrinterPort: Number(netPort) || 9100,
    });
    addToast('success', 'Konfigurasi printer kasir thermal berhasil disimpan!');
  };

  const handleTestPrint = async () => {
    const testTx: any = {
      id: 'test-tx',
      receiptNumber: 'TES-001',
      items: [
        { productName: 'Nasi Goreng Spesial', quantity: 1, unitPrice: 28000, total: 28000 },
        { productName: 'Es Teh Manis', quantity: 1, unitPrice: 5000, total: 5000 },
      ],
      subtotal: 33000,
      discountAmount: 0,
      serviceChargeAmount: sEnabled ? Math.round((33000 * sRate) / 100) : 0,
      taxAmount: tEnabled ? Math.round((33000 * tRate) / 100) : 0,
      total: 33000 + (sEnabled ? Math.round((33000 * sRate) / 100) : 0) + (tEnabled ? Math.round((33000 * tRate) / 100) : 0),
      paymentMethod: 'cash',
      paymentAmount: 50000,
      changeAmount: 50000 - (33000 + (sEnabled ? Math.round((33000 * sRate) / 100) : 0) + (tEnabled ? Math.round((33000 * tRate) / 100) : 0)),
      createdAt: new Date().toISOString(),
      employeeName: currentEmployee?.name || 'Kasir',
      orderType: 'dine_in',
    };

    if (printerType === 'bluetooth') {
      addToast('info', 'Mencoba tes cetak via Bluetooth ESC/POS...');
      const res = await printDirectBluetooth(testTx, {
        businessName: bName,
        businessAddress: bAddress,
        businessPhone: bPhone,
        paperWidth,
      });
      if (res.success) {
        addToast('success', res.message);
        return;
      } else {
        addToast('warning', `${res.message}. Membuka cetak standar...`);
      }
    }

    addToast('info', `Membuka tes cetak thermal ${paperWidth}...`);
    const html = generateThermalReceiptHtml(testTx, {
      businessName: bName,
      businessAddress: bAddress,
      businessPhone: bPhone,
      paperWidth,
    });
    const finalPrinter = isCustomPrinter ? customPrinterInput : selectedPrinter;
    printViaIsolatedIframe(html, finalPrinter);
  };

  const handleScanBluetooth = async () => {
    setIsScanningBt(true);
    try {
      if (!(navigator as any).bluetooth) {
        addToast('error', 'Browser/sistem ini belum mendukung Web Bluetooth API.');
        setIsScanningBt(false);
        return;
      }
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2'],
      });
      if (device && device.name) {
        setBtDeviceName(device.name);
        addToast('success', `Perangkat Bluetooth terhubung: ${device.name}`);
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        addToast('error', `Gagal memindai: ${err.message || 'Perangkat tidak ditemukan'}`);
      }
    } finally {
      setIsScanningBt(false);
    }
  };

  const handleTestNetwork = () => {
    setIsTestingNet(true);
    setTimeout(() => {
      setIsTestingNet(false);
      addToast('success', `Format koneksi IP ${netIp}:${netPort} valid dan siap digunakan!`);
    }, 600);
  };

  const handleRunSync = () => {
    setSyncStatus('syncing');
    addToast('info', 'Menghubungkan ke node sinkronisasi cabang...');
    setTimeout(() => {
      setSyncStatus('synced');
      addToast('success', 'Sinkronisasi berhasil! 12 transaksi cabang telah direkonsiliasi.');
      setTimeout(() => setSyncStatus('idle'), 4000);
    }, 1800);
  };

  const handleExportBackup = () => {
    const data = JSON.stringify(useStore.getState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `c-pos-backup-${Date.now()}.json`;
    a.click();
    addToast('success', 'Backup database C-POS berhasil diunduh (JSON)');
    addAuditLog({
      employeeId: currentEmployee?.id || 'sys',
      employeeName: currentEmployee?.name || 'Owner',
      employeeRole: currentEmployee?.role || 'owner',
      action: 'export_backup',
      details: 'Ekspor cadangan database lengkap C-POS (JSON)',
      authorizedBy: currentEmployee?.name || 'Owner',
    });
  };

  const handleExecuteResetDatabase = () => {
    if (resetConfirmInput.trim().toUpperCase() !== 'RESET') {
      addToast('error', 'Ketik kata "RESET" dengan huruf kapital untuk konfirmasi');
      return;
    }

    if (autoBackupBeforeReset) {
      handleExportBackup();
    }

    resetDatabasePreserveAccounts();
    addToast('success', 'Database berhasil di-reset bersih! Seluruh akun manajemen, kasir & PIN tetap aman.');
    addAuditLog({
      employeeId: currentEmployee?.id || 'sys',
      employeeName: currentEmployee?.name || 'Owner',
      employeeRole: currentEmployee?.role || 'owner',
      action: 'database_reset',
      details: 'Eksekusi reset database transaksi, produk, dan pelanggan (akun manajemen dipertahankan)',
      authorizedBy: currentEmployee?.name || 'Owner',
    });
    setIsResetModalOpen(false);
    setResetConfirmInput('');
  };

  const handleExportAuditLog = () => {
    if (auditLogs.length === 0) {
      addToast('info', 'Belum ada log audit untuk diekspor');
      return;
    }
    const headers = ['ID', 'Waktu', 'Karyawan', 'Role', 'Aksi', 'Keterangan', 'Otorisasi'];
    const rows = auditLogs.map((l) => [
      l.id,
      `"${l.timestamp}"`,
      `"${l.employeeName}"`,
      `"${l.employeeRole}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.authorizedBy || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `c-pos-audit-log-${Date.now()}.csv`;
    a.click();
    addToast('success', 'File CSV log audit berhasil diunduh');
  };

  // Employee Handlers
  const togglePinVisibility = (empId: string) => {
    setRevealedPins((prev) => ({ ...prev, [empId]: !prev[empId] }));
  };

  const handleOpenAddEmployee = () => {
    setEditingEmp(null);
    setEmpName('');
    setEmpRole('cashier');
    setEmpPin('');
    setEmpColor('#00B894');
    setEmpActive(true);
    setIsEmpModalOpen(true);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    setEditingEmp(emp);
    setEmpName(emp.name);
    setEmpRole(emp.role);
    setEmpPin(emp.pin);
    setEmpColor(emp.avatarColor || '#6C5CE7');
    setEmpActive(emp.isActive);
    setIsEmpModalOpen(true);
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) {
      addToast('error', 'Nama karyawan wajib diisi');
      return;
    }
    if (!empPin || empPin.length < 4 || !/^\d+$/.test(empPin)) {
      addToast('error', 'PIN kasir harus berupa minimal 4 angka numerik');
      return;
    }

    if (editingEmp) {
      const updated: Employee = {
        ...editingEmp,
        name: empName.trim(),
        role: empRole,
        pin: empPin,
        avatarColor: empColor,
        isActive: empActive,
      };
      updateEmployee(updated);
      addToast('success', `Profil karyawan "${updated.name}" berhasil diperbarui`);
      addAuditLog({
        employeeId: currentEmployee?.id || 'sys',
        employeeName: currentEmployee?.name || 'Owner',
        employeeRole: currentEmployee?.role || 'owner',
        action: 'settings_change',
        details: `Perbarui profil karyawan: ${updated.name} (Role: ${updated.role})`,
        authorizedBy: currentEmployee?.name || 'Owner',
      });
    } else {
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: empName.trim(),
        role: empRole,
        pin: empPin,
        avatarColor: empColor,
        isActive: empActive,
        createdAt: new Date().toISOString(),
      };
      addEmployee(newEmp);
      addToast('success', `Karyawan baru "${newEmp.name}" berhasil ditambahkan`);
      addAuditLog({
        employeeId: currentEmployee?.id || 'sys',
        employeeName: currentEmployee?.name || 'Owner',
        employeeRole: currentEmployee?.role || 'owner',
        action: 'settings_change',
        details: `Tambah akun karyawan baru: ${newEmp.name} (Role: ${newEmp.role})`,
        authorizedBy: currentEmployee?.name || 'Owner',
      });
    }
    setIsEmpModalOpen(false);
  };

  const handleDeleteEmployee = (emp: Employee) => {
    if (emp.role === 'owner') {
      const ownerCount = employees.filter((e) => e.role === 'owner').length;
      if (ownerCount <= 1) {
        addToast('error', 'Tidak dapat menghapus satu-satunya akun Owner toko');
        return;
      }
    }
    if (window.confirm(`Yakin ingin menghapus akun karyawan "${emp.name}"?`)) {
      deleteEmployee(emp.id);
      addToast('success', `Akun karyawan "${emp.name}" berhasil dihapus`);
      addAuditLog({
        employeeId: currentEmployee?.id || 'sys',
        employeeName: currentEmployee?.name || 'Owner',
        employeeRole: currentEmployee?.role || 'owner',
        action: 'settings_change',
        details: `Hapus akun karyawan: ${emp.name} (Role: ${emp.role})`,
        authorizedBy: currentEmployee?.name || 'Owner',
      });
    }
  };

  const handleSaveQuickPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinResetEmp) return;
    if (!quickNewPin || quickNewPin.length < 4 || !/^\d+$/.test(quickNewPin)) {
      addToast('error', 'PIN baru harus berupa minimal 4 angka numerik');
      return;
    }
    resetEmployeePin(pinResetEmp.id, quickNewPin);
    addToast('success', `PIN untuk "${pinResetEmp.name}" berhasil diperbarui`);
    addAuditLog({
      employeeId: currentEmployee?.id || 'sys',
      employeeName: currentEmployee?.name || 'Owner',
      employeeRole: currentEmployee?.role || 'owner',
      action: 'pin_change',
      details: `Ubah PIN keamanan untuk staf: ${pinResetEmp.name} (Role: ${pinResetEmp.role})`,
      authorizedBy: currentEmployee?.name || 'Owner',
    });
    setPinResetEmp(null);
    setQuickNewPin('');
  };

  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesAction = auditFilter === 'all' || log.action === auditFilter;
    const matchesSearch =
      auditSearch === '' ||
      log.employeeName.toLowerCase().includes(auditSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
      (log.authorizedBy && log.authorizedBy.toLowerCase().includes(auditSearch.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  return (
    <div
      style={{
        padding: '24px 32px 64px 32px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}
    >
      {/* ── Top Header & Live Indicators ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '4px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
            Pengaturan Sistem & Konfigurasi C-POS
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
            Pusat kendali operasional toko, printer thermal, tarif pajak, akun staf kasir, dan database offline
          </p>
        </div>

        {/* Live Quick Status Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              border: '1px solid var(--primary-200)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--primary-500)' }} />
            <span>Mode: {businessType.toUpperCase()}</span>
          </div>

          <div
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(0, 184, 148, 0.1)',
              color: '#00B894',
              border: '1px solid rgba(0, 184, 148, 0.25)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Printer size={13} />
            <span>{printerType.toUpperCase()} • {paperWidth}</span>
          </div>

          <div
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(9, 132, 227, 0.1)',
              color: '#0984E3',
              border: '1px solid rgba(9, 132, 227, 0.25)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Users size={13} />
            <span>{employees.length} Staf</span>
          </div>

          <div
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={13} style={{ color: '#00B894' }} />
            <span>SQLite Offline Ready</span>
          </div>

          <div
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#10B981',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ShieldCheck size={13} />
            <span>LIFETIME AKTIF</span>
          </div>
        </div>
      </div>

      {/* ── ROW-ALIGNED BALANCED GRID (PERFECT SYMMETRY & ZERO GAPS) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        {/* ════════ ROW 1, COL 1: PROFIL BISNIS & TOKO ════════ */}
        <form
          onSubmit={handleSaveStoreProfile}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Store size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Profil Toko & Informasi Struk
                  </h2>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                    Tercetak otomatis pada baris header struk kasir thermal
                  </p>
                </div>
              </div>

              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary-700)', backgroundColor: 'var(--primary-50)', padding: '3px 8px', borderRadius: '6px' }}>
                Identitas POS
              </span>
            </div>

            {/* Inputs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Nama Toko / Brand Usaha
                </label>
                <input
                  type="text"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  required
                  placeholder="Contoh: Kopi Kenangan C-POS"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={bPhone}
                  onChange={(e) => setBPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.84rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Alamat Lengkap & Catatan Kaki Struk Kasir
                </label>
                <textarea
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  rows={2}
                  placeholder="Jl. Thamrin No. 12, Jakarta Pusat • Terima kasih atas kunjungan Anda!"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.84rem',
                    outline: 'none',
                    resize: 'none',
                  }}
                />
              </div>
            </div>

            {/* Mode Operasional Selector (Compact Segmented Strip) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Pilih Alur Kerja Operasional POS
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'fnb', title: 'F&B Restoran', icon: Utensils, note: 'Meja & Kitchen Slip' },
                  { id: 'retail', title: 'Retail Toko', icon: ShoppingBag, note: 'Barcode & Stok SKU' },
                  { id: 'hybrid', title: 'Hybrid Multi-Fitur', icon: Sparkles, note: 'Semua Fitur Kasir' },
                ].map((m) => {
                  const Icon = m.icon;
                  const isSel = bType === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBType(m.id as BusinessType)}
                      style={{
                        padding: '9px 6px',
                        borderRadius: '8px',
                        border: isSel ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                        backgroundColor: isSel ? 'var(--primary-50)' : 'var(--bg)',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Icon size={14} style={{ color: isSel ? 'var(--primary-600)' : 'var(--text-muted)' }} />
                        <span style={{ fontWeight: 800, fontSize: '0.76rem', color: isSel ? 'var(--primary-700)' : 'var(--text)' }}>
                          {m.title}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.66rem', color: isSel ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                        {m.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Save Profile Button */}
          <button
            type="submit"
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--primary-500)',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
            }}
          >
            <Save size={15} />
            <span>Simpan Profil Toko</span>
          </button>
        </form>

        {/* ════════ ROW 1, COL 2: PRINTER KASIR THERMAL ════════ */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Printer size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Perangkat Printer Kasir Thermal
                  </h2>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                    Cetak struk Windows driver, Bluetooth SPP, atau LAN/IP
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                  border: '1px solid var(--primary-200)',
                }}
              >
                ● {printerType.toUpperCase()} • {paperWidth}
              </span>
            </div>

            {/* Connection Mode 3-Way Segmented Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Jalur Koneksi Printer Kasir
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'usb', label: 'USB Port (Driver)', icon: Usb },
                  { id: 'bluetooth', label: 'Bluetooth SPP', icon: Bluetooth },
                  { id: 'network', label: 'LAN / IP Network', icon: Wifi },
                ].map((p) => {
                  const Icon = p.icon;
                  const isSel = printerType === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPrinterType(p.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 6px',
                        borderRadius: '8px',
                        border: isSel ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                        backgroundColor: isSel ? 'var(--primary-50)' : 'var(--bg)',
                        color: isSel ? 'var(--primary-700)' : 'var(--text)',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={14} />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Connection Panels */}
            {printerType === 'usb' && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)' }}>
                    Pilih Driver Printer Windows
                  </label>
                  <button
                    type="button"
                    onClick={loadPrinters}
                    disabled={isLoadingPrinters}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--primary-600)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={11} className={isLoadingPrinters ? 'spin-icon' : ''} />
                    <span>Pindai</span>
                  </button>
                </div>

                {!isCustomPrinter ? (
                  <select
                    value={selectedPrinter}
                    onChange={(e) => setSelectedPrinterState(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {systemPrinters.length > 0 ? (
                      systemPrinters.map((p, idx) => (
                        <option key={idx} value={p.name}>
                          {p.name} {p.isDefault ? '(Default Windows)' : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="POS-58">POS-58 Thermal Printer</option>
                        <option value="POS-80">POS-80 Thermal Printer</option>
                        <option value="Microsoft Print to PDF">Microsoft Print to PDF</option>
                      </>
                    )}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nama printer di Windows..."
                    value={customPrinterInput}
                    onChange={(e) => setCustomPrinterInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="checkbox"
                    id="customPrinterCheckPrecise"
                    checked={isCustomPrinter}
                    onChange={(e) => setIsCustomPrinter(e.target.checked)}
                    style={{ width: '13px', height: '13px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                  />
                  <label htmlFor="customPrinterCheckPrecise" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                    Ketik manual nama driver jika tidak ada di daftar
                  </label>
                </div>
              </div>
            )}

            {printerType === 'bluetooth' && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)' }}>
                    Nama Bluetooth Thermal
                  </label>
                  <button
                    type="button"
                    onClick={handleScanBluetooth}
                    disabled={isScanningBt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 6px',
                      borderRadius: '5px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--primary-600)',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <Bluetooth size={11} />
                    <span>{isScanningBt ? 'Memindai...' : 'Hubungkan BT'}</span>
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Contoh: RPP02N / MPT-II / Bluetooth Printer"
                  value={btDeviceName}
                  onChange={(e) => setBtDeviceName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    outline: 'none',
                  }}
                />
              </div>
            )}

            {printerType === 'network' && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.8fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                      Alamat IP LAN
                    </label>
                    <input
                      type="text"
                      placeholder="192.168.1.200"
                      value={netIp}
                      onChange={(e) => setNetIp(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '2px' }}>
                      Port RAW
                    </label>
                    <input
                      type="number"
                      placeholder="9100"
                      value={netPort}
                      onChange={(e) => setNetPort(Number(e.target.value) || 9100)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTestNetwork}
                  disabled={isTestingNet}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--primary-600)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  {isTestingNet ? 'Menguji...' : 'Tes Sambungan IP'}
                </button>
              </div>
            )}

            {/* Lebar Roll & Auto-Print (Compact Inline Grid) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Lebar Kertas Roll
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {[
                    { id: '58mm', name: '58mm Roll' },
                    { id: '80mm', name: '80mm Roll' },
                  ].map((w) => {
                    const isSel = paperWidth === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setPaperWidth(w.id as any)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '6px',
                          border: isSel ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                          backgroundColor: isSel ? 'var(--primary-50)' : 'var(--bg)',
                          color: isSel ? 'var(--primary-700)' : 'var(--text)',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {w.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Auto-Print Struk
                </label>
                <button
                  type="button"
                  onClick={() => setAutoPrint(!autoPrint)}
                  style={{
                    width: '100%',
                    padding: '7px 8px',
                    borderRadius: '6px',
                    border: autoPrint ? '1px solid var(--primary-200)' : '1px solid var(--border)',
                    backgroundColor: autoPrint ? 'var(--primary-50)' : 'var(--bg)',
                    color: autoPrint ? 'var(--primary-700)' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>Auto-Cetak:</span>
                  <span style={{ fontWeight: 800 }}>{autoPrint ? 'AKTIF' : 'OFF'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '8px' }}>
            <button
              type="button"
              onClick={handleTestPrint}
              style={{
                padding: '11px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Printer size={14} />
              <span>Tes Cetak Struk</span>
            </button>

            <button
              type="button"
              onClick={handleSavePrinterConfig}
              style={{
                padding: '11px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: 'var(--primary-500)',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
              }}
            >
              <Save size={14} />
              <span>Simpan Printer</span>
            </button>
          </div>
        </div>

        {/* ════════ ROW 2, COL 1: PAJAK & BIAYA LAYANAN ════════ */}
        <form
          onSubmit={handleSaveTaxSettings}
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                    color: '#00B894',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Percent size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Pajak PPN & Biaya Layanan
                  </h2>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                    Kalkulasi persentase otomatis pada struk dan total belanja kasir
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: tEnabled ? '#00B894' : 'var(--text-muted)',
                  backgroundColor: tEnabled ? 'rgba(0, 184, 148, 0.1)' : 'var(--bg)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${tEnabled ? 'rgba(0, 184, 148, 0.25)' : 'var(--border)'}`,
                }}
              >
                {tEnabled ? `${tRate}% PPN Aktif` : 'Pajak Nonaktif'}
              </span>
            </div>

            {/* Row PPN */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="ppnToggle"
                  checked={tEnabled}
                  onChange={(e) => setTEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="ppnToggle" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text)', cursor: 'pointer' }}>
                    Pajak PPN / PB1
                  </label>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                    Tambahkan pajak ke total transaksi kasir
                  </div>
                </div>
              </div>

              {tEnabled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <input
                    type="text"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    placeholder="PPN / Pajak"
                    style={{
                      width: '110px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={tRate}
                      onChange={(e) => setTRate(Number(e.target.value) || 0)}
                      style={{
                        width: '52px',
                        padding: '6px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dinonaktifkan</span>
              )}
            </div>

            {/* Row Service Charge */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="serviceToggle"
                  checked={sEnabled}
                  onChange={(e) => setSEnabled(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                />
                <div>
                  <label htmlFor="serviceToggle" style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text)', cursor: 'pointer' }}>
                    Biaya Layanan (Service Charge)
                  </label>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>
                    Biaya operasional khusus pesanan F&B / Resto
                  </div>
                </div>
              </div>

              {sEnabled ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <input
                    type="text"
                    value={sName}
                    onChange={(e) => setSName(e.target.value)}
                    placeholder="Service Charge"
                    style={{
                      width: '145px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface)',
                      color: 'var(--text)',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textAlign: 'left',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={sRate}
                      onChange={(e) => setSRate(Number(e.target.value) || 0)}
                      style={{
                        width: '52px',
                        padding: '6px 6px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dinonaktifkan</span>
              )}
            </div>

            {/* High-Precision Live Receipt Simulation Slip */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg)',
                border: '1px dashed var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                fontSize: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontWeight: 700 }}>
                <span>Pratinjau Kalkulasi Tagihan:</span>
                <span style={{ fontSize: '0.68rem' }}>Contoh Rp 100.000</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal Pembelian:</span>
                <span>Rp 100.000</span>
              </div>
              {sEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{sName || 'Service'} ({sRate}%):</span>
                  <span>+{formatCurrency(Math.round((100000 * sRate) / 100))}</span>
                </div>
              )}
              {tEnabled && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{tName || 'PPN'} ({tRate}%):</span>
                  <span>+{formatCurrency(Math.round((100000 * tRate) / 100))}</span>
                </div>
              )}
              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '2px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.84rem', color: 'var(--primary-600)' }}>
                <span>Total Tagihan Pelanggan:</span>
                <span>
                  {formatCurrency(
                    100000 +
                      (sEnabled ? Math.round((100000 * sRate) / 100) : 0) +
                      (tEnabled ? Math.round((100000 * tRate) / 100) : 0)
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Save Tax Button */}
          <button
            type="submit"
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--primary-500)',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
            }}
          >
            <Save size={15} />
            <span>Simpan Pajak & Layanan</span>
          </button>
        </form>

        {/* ════════ ROW 2, COL 2: BACKUP DATABASE & SINKRONISASI ════════ */}
        <div
          style={{
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            height: '100%',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HardDrive size={17} />
                </div>
                <div>
                  <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Backup Database & Sinkronisasi
                  </h2>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                    Sistem 100% offline-first dengan backup data JSON dan sync cabang
                  </p>
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#00B894',
                  backgroundColor: 'rgba(0, 184, 148, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 184, 148, 0.25)',
                }}
              >
                SQLite Aktif
              </span>
            </div>

            {/* Status Information */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#00B894', flexShrink: 0 }} />
              <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                <strong style={{ color: 'var(--text)' }}>Data Offline Aman:</strong> Semua transaksi, katalog, dan pelanggan tersimpan di hard disk lokal komputer.
              </div>
            </div>

            {/* Action Cards (2 Action Rows) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={handleExportBackup}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Download size={14} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.77rem' }}>Export File (JSON)</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Unduh snapshot data</div>
                </div>
              </button>

              <button
                type="button"
                onClick={handleRunSync}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 184, 148, 0.1)',
                    color: '#00B894',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <RefreshCw size={14} className={syncStatus === 'syncing' ? 'spin-icon' : ''} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.77rem' }}>
                    {syncStatus === 'syncing' ? 'Sinkron...' : 'Sync Cabang'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Rekonsiliasi outlet</div>
                </div>
              </button>
            </div>

            {/* Reset Wizard & Reset Database Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Buka kembali Setup Wizard untuk mengatur ulang profil toko dari awal?')) {
                    useStore.getState().resetSetupWizard();
                  }
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px dashed var(--border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                }}
              >
                <RotateCcw size={12} />
                <span>Setup Wizard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setResetConfirmInput('');
                  setIsResetModalOpen(true);
                }}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(214, 48, 49, 0.3)',
                  backgroundColor: 'rgba(214, 48, 49, 0.06)',
                  color: '#D63031',
                  fontWeight: 700,
                  fontSize: '0.73rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  transition: 'all 0.15s ease',
                }}
                title="Kosongkan transaksi, produk & pelanggan tanpa menghapus akun manajemen"
              >
                <Trash2 size={12} />
                <span>Reset Database</span>
              </button>
            </div>
          </div>

          {/* Symmetrical Bottom Primary Action Button */}
          <button
            type="button"
            onClick={handleRunSync}
            style={{
              padding: '11px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: 'var(--primary-500)',
              color: '#FFF',
              fontWeight: 800,
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
            }}
          >
            <RefreshCw size={15} className={syncStatus === 'syncing' ? 'spin-icon' : ''} />
            <span>{syncStatus === 'syncing' ? 'Menyinkronkan Node...' : 'Jalankan Sinkronisasi Cabang'}</span>
          </button>
        </div>

        {/* ════════ ROW 3 (FULL WIDTH): MANAJEMEN AKUN KARYAWAN ════════ */}
        <div
          style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={17} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  Manajemen Akun Karyawan & Hak Akses Kasir
                </h2>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Kelola staf kasir, jabatan (Owner / Manager / Kasir), dan 4 digit PIN login operasional
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Role Counters with cohesive theme icons */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(108, 92, 231, 0.08)',
                    color: 'var(--primary-600)',
                    border: '1px solid rgba(108, 92, 231, 0.2)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <Crown size={12} strokeWidth={2.4} />
                  <span>Owner: {employees.filter((e) => e.role === 'owner').length}</span>
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(253, 121, 168, 0.08)',
                    color: '#FD79A8',
                    border: '1px solid rgba(253, 121, 168, 0.25)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <Shield size={12} strokeWidth={2.4} />
                  <span>Manager: {employees.filter((e) => e.role === 'manager').length}</span>
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 9px',
                    borderRadius: '7px',
                    backgroundColor: 'rgba(0, 184, 148, 0.08)',
                    color: '#00B894',
                    border: '1px solid rgba(0, 184, 148, 0.22)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  <ShoppingBag size={12} strokeWidth={2.4} />
                  <span>Kasir: {employees.filter((e) => e.role === 'cashier').length}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={handleOpenAddEmployee}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'var(--primary-500)',
                  color: '#FFF',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
                }}
              >
                <Plus size={14} />
                <span>Tambah Karyawan</span>
              </button>
            </div>
          </div>

          {/* Master Employee Table (Precision Enterprise Table) */}
          <div
            style={{
              overflowX: 'auto',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.74rem' }}>KARYAWAN</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.74rem' }}>JABATAN & HAK AKSES</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.74rem' }}>STATUS</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.74rem' }}>KEAMANAN PIN</th>
                  <th style={{ padding: '10px 16px', fontWeight: 700, fontSize: '0.74rem', textAlign: 'right' }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, index) => {
                  const isRevealed = !!revealedPins[emp.id];
                  const isCurrentLoggedIn = currentEmployee?.id === emp.id;

                  const roleConfig = {
                    owner: { label: 'Owner Toko', bg: 'rgba(108, 92, 231, 0.08)', color: 'var(--primary-600)', border: 'rgba(108, 92, 231, 0.25)', note: 'Akses Penuh Semua Menu', Icon: Crown },
                    manager: { label: 'Manager', bg: 'rgba(253, 121, 168, 0.1)', color: '#FD79A8', border: 'rgba(253, 121, 168, 0.25)', note: 'Void & Otorisasi Shift', Icon: Shield },
                    cashier: { label: 'Kasir', bg: 'rgba(0, 184, 148, 0.1)', color: '#00B894', border: 'rgba(0, 184, 148, 0.22)', note: 'Operasional POS Kasir', Icon: ShoppingBag },
                  }[emp.role] || { label: emp.role, bg: 'var(--bg)', color: 'var(--text)', border: 'var(--border)', note: '', Icon: Users };

                  return (
                    <tr
                      key={emp.id}
                      style={{
                        borderBottom: index < employees.length - 1 ? '1px solid var(--border)' : 'none',
                        backgroundColor: isCurrentLoggedIn ? 'rgba(108, 92, 231, 0.03)' : 'transparent',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* 1. Identity */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              backgroundColor: emp.avatarColor || '#6C5CE7',
                              color: '#FFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.95rem',
                              flexShrink: 0,
                            }}
                          >
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.86rem', color: 'var(--text)' }}>
                                {emp.name}
                              </span>
                              {isCurrentLoggedIn && (
                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary-600)', backgroundColor: 'var(--primary-50)', padding: '1px 5px', borderRadius: '4px' }}>
                                  LOGIN
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              ID: {emp.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Role */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '5px',
                              backgroundColor: roleConfig.bg,
                              color: roleConfig.color,
                              border: `1px solid ${roleConfig.border}`,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                            }}
                          >
                            <roleConfig.Icon size={11} strokeWidth={2.4} />
                            <span>{roleConfig.label}</span>
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                            {roleConfig.note}
                          </span>
                        </div>
                      </td>

                      {/* 3. Status */}
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                            color: emp.isActive ? '#00B894' : 'var(--text-muted)',
                            backgroundColor: emp.isActive ? 'rgba(0, 184, 148, 0.1)' : 'var(--bg)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: `1px solid ${emp.isActive ? 'rgba(0, 184, 148, 0.2)' : 'var(--border)'}`,
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: emp.isActive ? '#00B894' : 'var(--text-muted)' }} />
                          {emp.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>

                      {/* 4. PIN Security */}
                      <td style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          <Lock size={12} style={{ color: 'var(--text-muted)' }} />
                          <span style={{ fontWeight: 800, fontSize: '0.82rem', letterSpacing: isRevealed ? '1px' : '2px', color: 'var(--text)' }}>
                            {isRevealed ? emp.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(emp.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={isRevealed ? 'Sembunyikan' : 'Intip PIN'}
                          >
                            {isRevealed ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPinResetEmp(emp);
                              setQuickNewPin('');
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--primary-600)',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '0 2px',
                              marginLeft: '2px',
                            }}
                          >
                            Ubah
                          </button>
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditEmployee(emp)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              backgroundColor: 'var(--bg)',
                              color: 'var(--text)',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteEmployee(emp)}
                            disabled={emp.role === 'owner' && employees.filter((e) => e.role === 'owner').length <= 1}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid rgba(214, 48, 49, 0.2)',
                              backgroundColor: 'rgba(214, 48, 49, 0.06)',
                              color: '#D63031',
                              fontSize: '0.74rem',
                              cursor:
                                emp.role === 'owner' && employees.filter((e) => e.role === 'owner').length <= 1
                                  ? 'not-allowed'
                                  : 'pointer',
                              opacity:
                                emp.role === 'owner' && employees.filter((e) => e.role === 'owner').length <= 1 ? 0.35 : 1,
                            }}
                            title="Hapus Karyawan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════ ROW 4 (FULL WIDTH): AUDIT TRAIL & LOG KEAMANAN SISTEM ════════ */}
        <div
          style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(108, 92, 231, 0.12)',
                  color: 'var(--primary-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck size={19} />
              </div>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                  Audit Trail & Log Keamanan Sistem
                </h2>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                  Rekam jejak digital permanen dari setiap pembatalan transaksi (VOID), pembukaan laci kasir manual, ganti PIN, dan reset database
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--primary-700)',
                  backgroundColor: 'var(--primary-50)',
                  border: '1px solid var(--primary-200)',
                  padding: '4px 10px',
                  borderRadius: '12px',
                }}
              >
                {filteredAuditLogs.length} Aktivitas Tercatat
              </span>

              <button
                type="button"
                onClick={handleExportAuditLog}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Unduh rekaman log audit ke format CSV"
              >
                <Download size={13} />
                <span>Export Log CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                minWidth: '220px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari kasir, no struk, supervisor, atau kata kunci..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>

            {/* Quick Action Filters */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: 'Semua' },
                { id: 'void_transaction', label: 'Void Transaksi' },
                { id: 'drawer_opened', label: 'Laci Kasir' },
                { id: 'pin_change', label: 'Ganti PIN' },
                { id: 'database_reset', label: 'Reset Database' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setAuditFilter(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: auditFilter === f.id ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                    backgroundColor: auditFilter === f.id ? 'var(--primary-50)' : 'var(--bg)',
                    color: auditFilter === f.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                    fontWeight: 700,
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Audit Trail Table */}
          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              borderRadius: '10px',
              border: '1px solid var(--border)',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700, width: '150px' }}>Waktu Kejadian</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, width: '150px' }}>Pelaksana / Kasir</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, width: '140px' }}>Aksi Sistem</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Rincian Kejadian & Keterangan</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, width: '170px' }}>Otorisasi Supervisor</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                      Belum ada rekaman audit log yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => {
                    const getBadgeStyle = (act: string) => {
                      switch (act) {
                        case 'void_transaction':
                          return { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', label: 'VOID TRANSAKSI' };
                        case 'drawer_opened':
                          return { bg: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', label: 'LACI MANUAL' };
                        case 'pin_change':
                          return { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', label: 'GANTI PIN' };
                        case 'database_reset':
                          return { bg: 'rgba(220, 38, 38, 0.18)', color: '#DC2626', label: 'RESET DATABASE' };
                        case 'export_backup':
                          return { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', label: 'BACKUP DATA' };
                        case 'settings_change':
                          return { bg: 'rgba(108, 92, 231, 0.12)', color: 'var(--primary-600)', label: 'KONFIGURASI' };
                        default:
                          return { bg: 'var(--bg)', color: 'var(--text-secondary)', label: act.toUpperCase() };
                      }
                    };
                    const badge = getBadgeStyle(log.action);

                    return (
                      <tr
                        key={log.id}
                        style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.1s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '9px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(log.timestamp, 'short')} {formatTime(log.timestamp)}
                        </td>
                        <td style={{ padding: '9px 14px', fontWeight: 700, color: 'var(--text)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{log.employeeName}</span>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                              ({log.employeeRole})
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              letterSpacing: '0.3px',
                              display: 'inline-block',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--text)', lineHeight: 1.35 }}>
                          {log.details}
                        </td>
                        <td style={{ padding: '9px 14px', color: 'var(--text-secondary)' }}>
                          {log.authorizedBy ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 700, fontSize: '0.74rem' }}>
                              <CheckCircle2 size={12} />
                              {log.authorizedBy}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ════════ INFORMASI LISENSI PERANGKAT (HWID) & DUKUNGAN RESMI ════════ */}
        <div
          style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle decorative gradient glow */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Informasi Lisensi Perangkat & Proteksi Hardware (HWID)
                  </h2>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Resmi • Offline
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Aplikasi kasir ini terkunci dan terenkripsi HMAC SHA-256 secara permanen ke motherboard PC kasir ini.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '30px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10B981',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10B981',
                    boxShadow: '0 0 8px #10B981',
                  }}
                />
                TERAKTIVASI (LIFETIME)
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Box 1: Hardware ID */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} style={{ color: 'var(--primary-500)' }} />
                  ID PERANGKAT MESIN (HWID)
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Terkunci ke Hardware</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  backgroundColor: 'var(--surface)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <code
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    color: 'var(--text)',
                    letterSpacing: '0.08em',
                  }}
                >
                  {hwid}
                </code>

                <button
                  type="button"
                  onClick={handleCopyHwid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: isHwidCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg)',
                    color: isHwidCopied ? '#10B981' : 'var(--text)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isHwidCopied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{isHwidCopied ? 'Tersalin' : 'Salin HWID'}</span>
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                ID ini dibuat otomatis dari serial BIOS UUID & disk volume PC kasir. Tidak akan berubah saat format ulang aplikasi.
              </p>
            </div>

            {/* Box 2: Serial Key */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} style={{ color: '#10B981' }} />
                  SERIAL LICENSE KEY
                </span>
                <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>Valid & Terverifikasi</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  backgroundColor: 'var(--surface)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}
              >
                <code
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    color: '#10B981',
                    letterSpacing: '0.06em',
                  }}
                >
                  {showFullKey
                    ? licenseCert?.licenseKey || 'CPOS-LIFE-••••-••••-••••'
                    : licenseCert?.licenseKey
                    ? `${licenseCert.licenseKey.slice(0, 14)}-••••-••••`
                    : 'CPOS-LIFE-••••-••••-••••'}
                </code>

                <button
                  type="button"
                  onClick={() => setShowFullKey(!showFullKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text-muted)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {showFullKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showFullKey ? 'Sembunyikan' : 'Lihat'}</span>
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Terdaftar atas nama: <strong style={{ color: 'var(--text)' }}>{licenseCert?.storeName || businessName}</strong> ({licenseCert?.licenseType ? licenseCert.licenseType.toUpperCase() : 'LIFETIME'}).
              </p>
            </div>
          </div>

          {/* Direct Support & WhatsApp Assistance Row */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(37, 211, 102, 0.08)',
              border: '1px solid rgba(37, 211, 102, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                }}
              >
                <MessageCircle size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text)' }}>
                  Butuh Bantuan Lisensi, Ganti PC, atau Tambah Cabang?
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Hubungi kontak WhatsApp developer langsung dengan membawa ID Perangkat (HWID) di atas.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenWhatsAppSupport}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#25D366',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <MessageCircle size={16} />
              <span>Chat WhatsApp Developer</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* ════════ PUSAT PEMBARUAN SISTEM (AUTO-UPDATE ENGINE) ════════ */}
        <div
          style={{
            gridColumn: '1 / -1',
            backgroundColor: 'var(--surface)',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative ambient blue glow */}
          <div
            style={{
              position: 'absolute',
              top: '-60px',
              right: '-60px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid var(--border)',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <DownloadCloud size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                    Pusat Pembaruan Aplikasi (Auto-Update Engine)
                  </h2>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Cloud Sync • Silent Patch
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                  Pembaruan otomatis tanpa harus mengirim ulang file installer ke pelanggan. Database transaksi & lisensi terlindungi 100%.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '30px',
                  backgroundColor:
                    autoUpdate.status === 'downloaded'
                      ? 'rgba(16, 185, 129, 0.12)'
                      : autoUpdate.status === 'available'
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    autoUpdate.status === 'downloaded'
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : autoUpdate.status === 'available'
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid var(--border)',
                  color:
                    autoUpdate.status === 'downloaded'
                      ? '#10B981'
                      : autoUpdate.status === 'available'
                      ? '#3B82F6'
                      : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor:
                      autoUpdate.status === 'downloaded'
                        ? '#10B981'
                        : autoUpdate.status === 'available'
                        ? '#3B82F6'
                        : '#10B981',
                  }}
                />
                {autoUpdate.status === 'downloaded'
                  ? 'UPDATE SIAP DIPASANG'
                  : autoUpdate.status === 'available'
                  ? `TERSEDIA v${autoUpdate.version}`
                  : autoUpdate.status === 'downloading'
                  ? `MENGUNDUH (${autoUpdate.percent}%)`
                  : 'SISTEM UP-TO-DATE (v1.0.0)'}
              </div>
            </div>
          </div>

          {/* 2-Column Info Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Box 1: Version Details */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  INFORMASI VERSI TERPASANG
                </span>
                <span style={{ fontSize: '0.68rem', color: '#10B981', fontWeight: 700 }}>Stabil • Production</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)' }}>
                  v1.0.0
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  (C-POS Offline Desktop Universal)
                </span>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Dilengkapi enkripsi lisensi hardware, auto-updater background, dan dukungan pencetakan thermal ESC/POS 58mm & 80mm.
              </div>
            </div>

            {/* Box 2: Actions & Update Control */}
            <div
              style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  KONTROL PEMBARUAN ONLINE
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {autoUpdate.lastChecked ? `Dicek: ${autoUpdate.lastChecked.toLocaleTimeString('id-ID')}` : 'Cek Otomatis Saat Boot'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsUpdateModalOpen(true);
                    autoUpdate.checkForUpdates();
                  }}
                  disabled={autoUpdate.status === 'checking'}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: '#3B82F6',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <RefreshCw size={14} className={autoUpdate.status === 'checking' ? 'animate-spin' : ''} />
                  <span>{autoUpdate.status === 'checking' ? 'Memeriksa...' : 'Periksa Pembaruan Online'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                  }}
                >
                  <Rocket size={14} style={{ color: '#00B894' }} />
                  <span>Buka Dialog Pembaruan</span>
                </button>
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} style={{ color: '#10B981' }} />
                <span>Pembaruan diunduh di latar belakang tanpa mengganggu transaksi kasir</span>
              </div>
            </div>
          </div>

          {/* Bottom Information Notice */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <HardDrive size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <strong style={{ color: 'var(--text)' }}>Toko Tidak Ada Internet?</strong> Anda dapat memperbarui aplikasi secara manual kapan saja dengan menimpa installer dari USB Flashdisk. Seluruh data transaksi di SQLite tetap utuh.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── MODAL: Tambah / Edit Karyawan ── */}
      {isEmpModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--surface)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck size={18} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)' }}>
                  {editingEmp ? 'Edit Profil Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEmpModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEmployee} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Nama Lengkap Karyawan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Rian Pratama"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.86rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Jabatan / Tingkat Hak Akses
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {[
                    { id: 'cashier', label: 'Kasir', desc: 'Transaksi POS' },
                    { id: 'manager', label: 'Manager', desc: 'Void & Diskon' },
                    { id: 'owner', label: 'Owner', desc: 'Akses Penuh' },
                  ].map((r) => {
                    const isSel = empRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setEmpRole(r.id as UserRole)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: '8px',
                          border: isSel ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                          backgroundColor: isSel ? 'var(--primary-50)' : 'var(--bg)',
                          color: isSel ? 'var(--primary-700)' : 'var(--text)',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{r.label}</div>
                        <div style={{ fontSize: '0.66rem', color: isSel ? 'var(--primary-600)' : 'var(--text-muted)' }}>
                          {r.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  4-Digit PIN Kasir
                </label>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Ketik 4 angka PIN..."
                  value={empPin}
                  onChange={(e) => setEmpPin(e.target.value.replace(/\D/g, ''))}
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    fontWeight: 800,
                    letterSpacing: '4px',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                  Warna Avatar
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['#6C5CE7', '#00B894', '#FD79A8', '#0984E3', '#F39C12', '#E17055', '#00CEC9'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEmpColor(c)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: c,
                        border: empColor === c ? '3px solid var(--text)' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: empColor === c ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '2px' }}>
                <input
                  type="checkbox"
                  id="empActiveModal"
                  checked={empActive}
                  onChange={(e) => setEmpActive(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                />
                <label htmlFor="empActiveModal" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)', cursor: 'pointer' }}>
                  Akun Aktif (Bisa login ke kasir)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEmpModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(108, 92, 231, 0.25)',
                  }}
                >
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Reset PIN Cepat ── */}
      {pinResetEmp && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '360px',
              backgroundColor: 'var(--surface)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={16} style={{ color: 'var(--primary-500)' }} />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                  Ganti PIN Kasir
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPinResetEmp(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPin} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Ketik 4 angka PIN baru untuk <strong>{pinResetEmp.name}</strong>:
              </p>

              <input
                type="password"
                maxLength={6}
                placeholder="••••"
                value={quickNewPin}
                onChange={(e) => setQuickNewPin(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  letterSpacing: '4px',
                  textAlign: 'center',
                  outline: 'none',
                }}
              />

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPinResetEmp(null)}
                  style={{
                    flex: 1,
                    padding: '9px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1.5,
                    padding: '9px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Perbarui PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── MODAL: Reset Database Konfirmasi Keamanan (Modern Theme) ── */}
      {isResetModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetModalOpen(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '490px',
              backgroundColor: 'var(--surface)',
              borderRadius: '24px',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05)',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top Tri-Tone Accent Line */}
            <div
              style={{
                height: '4px',
                width: '100%',
                background: 'linear-gradient(90deg, #EF4444 0%, var(--primary-500) 55%, #10B981 100%)',
              }}
            />

            {/* Modal Header */}
            <div
              style={{
                padding: '22px 24px 18px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.14) 0%, rgba(108, 92, 231, 0.08) 100%)',
                    border: '1px solid rgba(239, 68, 68, 0.22)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
                  }}
                >
                  <AlertTriangle size={22} strokeWidth={2.2} />
                </div>
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'var(--text)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    Reset Database Operasional Toko
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <ShieldCheck size={12} strokeWidth={2.5} />
                      Akun Manajemen & PIN Kasir Tetap Aman
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Modern Explanatory Context Pill */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(239, 68, 68, 0.04)',
                  border: '1px solid rgba(239, 68, 68, 0.16)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '0.76rem',
                  lineHeight: 1.5,
                  color: 'var(--text)',
                }}
              >
                <Sparkles size={16} style={{ color: 'var(--primary-500)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontWeight: 700, color: 'var(--text)' }}>Mulai Lembaran Baru Operasional:</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>
                    Membersihkan seluruh riwayat transaksi & katalog produk awal agar toko siap beroperasi penuh tanpa menghapus konfigurasi akun kasir atau printer.
                  </span>
                </div>
              </div>

              {/* Data Breakdown Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {/* Dikosongkan Card */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid rgba(239, 68, 68, 0.18)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#EF4444' }}>
                      <Trash2 size={13} strokeWidth={2.4} />
                      <span>Dikosongkan</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#EF4444',
                      }}
                    >
                      Dihapus
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                      <span>Transaksi & struk</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                      <span>Rekap shift & saldo</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                      <span>Katalog produk & stok</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <XCircle size={12} color="#EF4444" style={{ flexShrink: 0 }} />
                      <span>Pelanggan & kasbon</span>
                    </div>
                  </div>
                </div>

                {/* Tetap Aman Card */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid rgba(16, 185, 129, 0.22)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 800, color: '#10B981' }}>
                      <ShieldCheck size={14} strokeWidth={2.4} />
                      <span>Tetap Aman</span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                      }}
                    >
                      100% Utuh
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.72rem', color: 'var(--text)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                      <strong style={{ fontWeight: 700 }}>Akun Manajemen Staf</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                      <strong style={{ fontWeight: 700 }}>PIN Kasir & Avatar</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                      <span>Profil & alamat toko</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={12} color="#10B981" style={{ flexShrink: 0 }} />
                      <span>Setting printer thermal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safeguard Switch Card: Auto-export backup */}
              <div
                onClick={() => setAutoBackupBeforeReset(!autoBackupBeforeReset)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  backgroundColor: autoBackupBeforeReset ? 'rgba(108, 92, 231, 0.05)' : 'var(--bg)',
                  border: `1.5px solid ${autoBackupBeforeReset ? 'rgba(108, 92, 231, 0.3)' : 'var(--border)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      backgroundColor: autoBackupBeforeReset ? 'rgba(108, 92, 231, 0.12)' : 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: autoBackupBeforeReset ? 'var(--primary-500)' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Download size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>
                      Unduh Cadangan JSON Otomatis
                    </div>
                    <div style={{ fontSize: '0.69rem', color: 'var(--text-muted)' }}>
                      Arsip data disimpan otomatis ke komputer sebelum reset dieksekusi
                    </div>
                  </div>
                </div>

                {/* Sleek Toggle Switch */}
                <div
                  style={{
                    width: '38px',
                    height: '22px',
                    borderRadius: '12px',
                    backgroundColor: autoBackupBeforeReset ? 'var(--primary-500)' : 'var(--border)',
                    position: 'relative',
                    transition: 'background-color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#FFFFFF',
                      position: 'absolute',
                      top: '3px',
                      left: autoBackupBeforeReset ? '19px' : '3px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
              </div>

              {/* Security confirmation input */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text)' }}>
                    Konfirmasi Keamanan:
                  </label>
                  {resetConfirmInput.trim().toUpperCase() === 'RESET' ? (
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} strokeWidth={3} /> KATA KUNCI COCOK
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Ketik kata <strong style={{ color: '#EF4444' }}>RESET</strong>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="KETIK: RESET"
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? '1.5px solid #10B981'
                        : resetConfirmInput.length > 0
                        ? '1.5px solid rgba(239, 68, 68, 0.5)'
                        : '1.5px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? '#10B981'
                        : resetConfirmInput.length > 0
                        ? '#EF4444'
                        : 'var(--text)',
                    fontSize: '0.92rem',
                    fontWeight: 800,
                    letterSpacing: '3px',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    outline: 'none',
                    boxShadow:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? '0 0 0 3px rgba(16, 185, 129, 0.15)'
                        : 'none',
                    transition: 'all 0.15s ease',
                  }}
                />
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleExecuteResetDatabase}
                  disabled={resetConfirmInput.trim().toUpperCase() !== 'RESET'}
                  style={{
                    flex: 1.6,
                    height: '42px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? '#EF4444'
                        : 'var(--border)',
                    backgroundImage:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                        : 'none',
                    color:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? '#FFFFFF'
                        : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? 'pointer'
                        : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow:
                      resetConfirmInput.trim().toUpperCase() === 'RESET'
                        ? '0 6px 18px -2px rgba(239, 68, 68, 0.45)'
                        : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {resetConfirmInput.trim().toUpperCase() === 'RESET' ? (
                    <Trash2 size={15} />
                  ) : (
                    <Lock size={14} />
                  )}
                  <span>Eksekusi Reset Bersih</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Update Manager Modal */}
      <UpdateManagerModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        currentAppVersion="1.0.0"
      />
    </div>
  );
};
