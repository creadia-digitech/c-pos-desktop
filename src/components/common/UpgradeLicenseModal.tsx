import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Cpu,
  ClipboardPaste,
  ArrowRight,
  AlertCircle,
  X,
} from 'lucide-react';
import {
  getMachineId,
  activateMachineLicense,
  buildWhatsAppUrl,
  buildWhatsAppMessageText,
} from '../../utils/license';
import { useStore } from '../../stores/useStore';

interface UpgradeLicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeLicenseModal: React.FC<UpgradeLicenseModalProps> = ({ isOpen, onClose }) => {
  const { businessName, addToast, addAuditLog, isTrial, trialStatus, setIsTrial, setTrialStatus } = useStore();

  const [hwid, setHwid] = useState<string>('Memuat HWID...');
  const [serialKeyInput, setSerialKeyInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      getMachineId().then((id) => setHwid(id));
      setErrorMsg('');
      setSerialKeyInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyMessage = async () => {
    const text = buildWhatsAppMessageText(hwid, businessName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('success', 'ID Perangkat berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      addToast('error', 'Gagal menyalin HWID');
    }
  };

  const handleOpenWhatsApp = () => {
    const url = buildWhatsAppUrl(hwid, businessName);
    const electronAPI = (window as any).electronAPI;
    if (electronAPI && typeof electronAPI.openExternal === 'function') {
      electronAPI.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSerialKeyInput(text.trim().toUpperCase().replace(/[^A-Z0-9-]/g, ''));
        setErrorMsg('');
      }
    } catch {
      addToast('info', 'Gunakan Ctrl + V untuk menempel Serial Key.');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = serialKeyInput.trim().toUpperCase();
    if (!key) {
      setErrorMsg('Masukkan Serial Key aktivasi Anda.');
      return;
    }

    setIsActivating(true);
    setErrorMsg('');
    try {
      const res = await activateMachineLicense(key, businessName || 'Toko C-POS');
      if (res.success) {
        setIsTrial(false);
        setTrialStatus(null);
        addToast('success', 'Selamat! Software C-POS berhasil teraktivasi permanen (LIFETIME).');
        addAuditLog({
          employeeId: 'sys-owner',
          employeeName: 'Pemilik Toko',
          employeeRole: 'owner',
          action: 'settings_change',
          details: `Aktivasi lisensi resmi C-POS (HWID: ${hwid})`,
          authorizedBy: 'Sistem Lisensi',
        });
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi lisensi.');
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(9, 13, 22, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#111827',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
          padding: '28px 26px 22px 26px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            borderRadius: '8px',
          }}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F59E0B',
            }}
          >
            <Sparkles size={20} />
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC' }}>
              Upgrade ke Lisensi Resmi
            </h3>
            <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>
              {isTrial && trialStatus
                ? `Mode Demo: Sisa ${trialStatus.daysRemaining} Hari (${trialStatus.completedTransactions}/${trialStatus.maxTransactions} Transaksi)`
                : 'Aktivasi Lisensi Permanen (Lifetime)'}
            </div>
          </div>
        </div>

        {/* HWID Chip Card */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '14px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            marginBottom: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Cpu size={12} style={{ color: '#38BDF8' }} />
              ID PERANGKAT (HWID)
            </span>
            <span style={{ fontSize: '0.64rem', color: '#64748B' }}>Terkunci ke PC Ini</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span style={{ fontFamily: 'Consolas, monospace', fontSize: '1rem', fontWeight: 800, color: '#F8FAFC' }}>
              {hwid}
            </span>
            <button
              type="button"
              onClick={handleCopyMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: copied ? '#10B981' : '#F1F5F9',
                fontSize: '0.7rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenWhatsApp}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(37, 211, 102, 0.35)',
              backgroundColor: 'rgba(37, 211, 102, 0.12)',
              color: '#4ADE80',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <MessageCircle size={14} />
            <span>Kirim ID via WhatsApp untuk Beli</span>
            <ExternalLink size={11} style={{ opacity: 0.7 }} />
          </button>
        </div>

        {/* Serial Key Input Form */}
        <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#CBD5E1' }}>
                Masukkan Serial Key:
              </label>
              <button
                type="button"
                onClick={handlePaste}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#38BDF8',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ClipboardPaste size={11} />
                <span>Tempel dari Clipboard</span>
              </button>
            </div>

            <input
              type="text"
              value={serialKeyInput}
              onChange={(e) => {
                setSerialKeyInput(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              placeholder="CPOS-LIFE-XXXX-XXXX-XXXX"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: errorMsg ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                color: '#F8FAFC',
                fontFamily: 'Consolas, monospace',
                fontSize: '0.96rem',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textAlign: 'center',
                outline: 'none',
              }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#F87171',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '6px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
              }}
            >
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isActivating || !serialKeyInput.trim()}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: serialKeyInput.trim() ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
              color: serialKeyInput.trim() ? '#FFFFFF' : '#64748B',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: serialKeyInput.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span>{isActivating ? 'Memverifikasi...' : 'Aktivasi Sekarang'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div
          style={{
            marginTop: '14px',
            paddingTop: '10px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#64748B',
            fontSize: '0.66rem',
          }}
        >
          <ShieldCheck size={12} style={{ color: '#10B981' }} />
          <span>Sekali Bayar • Aktif Permanen Seumur Hidup</span>
        </div>
      </motion.div>
    </div>
  );
};
