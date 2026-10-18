import React, { useState, useEffect } from 'react';
import {
  getMachineId,
  activateMachineLicense,
  buildWhatsAppUrl,
  buildWhatsAppMessageText,
  startInstantTrial,
  evaluateTrialStatus,
  TrialStatus,
} from '../../utils/license';
import { useStore } from '../../stores/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound,
  ShieldCheck,
  Copy,
  Check,
  MessageCircle,
  ExternalLink,
  Cpu,
  ClipboardPaste,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import backdropImg from '../../assets/pos_luxury_backdrop_blurred.jpg';
import logoImg from '../../assets/logo.png';

interface LicenseActivationScreenProps {
  onActivated: () => void;
}

export const LicenseActivationScreen: React.FC<LicenseActivationScreenProps> = ({ onActivated }) => {
  const { businessName, addToast, addAuditLog, transactions } = useStore();

  const [hwid, setHwid] = useState<string>('Memuat HWID...');
  const [serialKeyInput, setSerialKeyInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isActivating, setIsActivating] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [trialInfo, setTrialInfo] = useState<TrialStatus | null>(null);
  const [isStartingTrial, setIsStartingTrial] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    getMachineId().then((id) => {
      if (mounted) setHwid(id);
    });
    evaluateTrialStatus(transactions?.length || 0).then((st) => {
      if (mounted) setTrialInfo(st);
    });
    return () => {
      mounted = false;
    };
  }, [transactions?.length]);

  const handleCopyMessage = async () => {
    const text = buildWhatsAppMessageText(hwid, businessName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      addToast('success', 'ID Perangkat berhasil disalin ke clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      addToast('error', 'Gagal menyalin HWID');
    }
  };

  const handleOpenWhatsApp = () => {
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

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
        setSerialKeyInput(clean);
        setErrorMsg('');
        addToast('info', 'Serial Key berhasil ditempel!');
      }
    } catch {
      addToast('info', 'Gunakan Ctrl + V untuk menempel Serial Key.');
    }
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const key = serialKeyInput.trim().toUpperCase();

    if (!key) {
      setErrorMsg('Masukkan Serial Key aktivasi Anda.');
      return;
    }

    setIsActivating(true);
    try {
      const res = await activateMachineLicense(key, businessName || 'Toko C-POS');
      if (res.success) {
        addToast('success', 'Selamat! Software C-POS berhasil teraktivasi permanen (LIFETIME).');
        addAuditLog({
          employeeId: 'sys-owner',
          employeeName: 'Pemilik Toko',
          employeeRole: 'owner',
          action: 'settings_change',
          details: `Aktivasi lisensi resmi C-POS (HWID: ${hwid}, Key: ${key})`,
          authorizedBy: 'Sistem Lisensi',
        });
        onActivated();
      } else {
        setErrorMsg(res.message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memverifikasi lisensi.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    setErrorMsg('');
    try {
      const res = await startInstantTrial();
      if (res.success) {
        addToast('success', 'Mode demo 7 hari aktif! Selamat mencoba C-POS.');
        addAuditLog({
          employeeId: 'sys-trial',
          employeeName: 'Pengguna Demo',
          employeeRole: 'owner',
          action: 'settings_change',
          details: `Memulai masa demo gratis 7 hari (HWID: ${hwid})`,
          authorizedBy: 'Sistem Demo',
        });
        onActivated();
      } else {
        setErrorMsg(res.message);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        if (res.trial) setTrialInfo(res.trial);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memulai mode demo.');
    } finally {
      setIsStartingTrial(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        backgroundColor: '#090D1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* ── 1. CLEAN AESTHETIC STORE BACKDROP WITH SOFT BOKEH ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${backdropImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 45%',
          transform: 'translateZ(0)',
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Warm Dark Glass Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(8, 12, 22, 0.52)',
          pointerEvents: 'none',
        }}
      />

      {/* ── 2. APPLE / macOS STYLE CENTERED FROSTED GLASS CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
          x: isShaking ? [-10, 10, -6, 6, -3, 3, 0] : 0,
        }}
        transition={{ duration: isShaking ? 0.35 : 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'rgba(16, 22, 36, 0.95)',
          transform: 'translateZ(0)',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04)',
          padding: '36px 32px 28px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* ── CLEAN LOGO & HEADER ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
          {/* Logo with Soft Breathing Glow */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: '68px',
              height: '68px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              filter: 'drop-shadow(0 8px 20px rgba(0, 184, 148, 0.25)) drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))',
            }}
          >
            <img
              src={logoImg}
              alt="C-POS"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </motion.div>

          {/* Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 800,
                color: '#F8FAFC',
                letterSpacing: '-0.02em',
              }}
            >
              Aktivasi Lisensi C-POS
            </h1>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: 'rgba(239, 68, 68, 0.16)',
                color: '#F87171',
                border: '1px solid rgba(239, 68, 68, 0.28)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Belum Aktif
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8', lineHeight: 1.4, maxWidth: '340px' }}>
            Masukkan Serial Key resmi untuk membuka akses operasional kasir di perangkat ini.
          </p>
        </div>

        {/* ── HWID TOKEN CHIP CARD ── */}
        <div
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Cpu size={13} style={{ color: '#38BDF8' }} />
              ID Perangkat (HWID)
            </span>

            <span style={{ fontSize: '0.66rem', color: '#64748B' }}>
              Terkunci ke PC Ini
            </span>
          </div>

          {/* HWID Monospace Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <span
              style={{
                fontFamily: 'Consolas, monospace',
                fontSize: '1.08rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                color: '#F8FAFC',
              }}
            >
              {hwid}
            </span>

            <button
              type="button"
              onClick={handleCopyMessage}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backgroundColor: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                color: copied ? '#10B981' : '#F1F5F9',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>

          {/* WhatsApp Action Button (Harmonious & Non-intrusive) */}
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            style={{
              width: '100%',
              padding: '9px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(37, 211, 102, 0.35)',
              backgroundColor: 'rgba(37, 211, 102, 0.12)',
              color: '#4ADE80',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(37, 211, 102, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(37, 211, 102, 0.35)';
            }}
          >
            <MessageCircle size={15} />
            <span>Kirim ID via WhatsApp (Siap Kirim)</span>
            <ExternalLink size={12} style={{ opacity: 0.7 }} />
          </button>
        </div>

        {/* ── SERIAL KEY INPUT FORM ── */}
        <form onSubmit={handleActivate} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: '#CBD5E1',
                  letterSpacing: '0.02em',
                }}
              >
                Serial Key Aktivasi:
              </label>

              <button
                type="button"
                onClick={handlePasteFromClipboard}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '5px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#94A3B8',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F8FAFC')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
              >
                <ClipboardPaste size={11} />
                <span>Tempel</span>
              </button>
            </div>

            {/* Input with Apple Style Monospace Formatting */}
            <input
              type="text"
              value={serialKeyInput}
              onChange={(e) => {
                setSerialKeyInput(e.target.value.toUpperCase());
                setErrorMsg('');
              }}
              placeholder="CPOS-LIFE-XXXX-XXXX-XXXX"
              autoFocus
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: errorMsg
                  ? '1.5px solid #EF4444'
                  : serialKeyInput.trim()
                  ? '1.5px solid #3B82F6'
                  : '1px solid rgba(255, 255, 255, 0.15)',
                backgroundColor: 'rgba(0, 0, 0, 0.45)',
                color: '#F8FAFC',
                fontFamily: 'Consolas, monospace',
                fontSize: '1.02rem',
                fontWeight: 800,
                letterSpacing: '0.08em',
                outline: 'none',
                textAlign: 'center',
                boxShadow: serialKeyInput.trim()
                  ? '0 0 16px rgba(59, 130, 246, 0.25)'
                  : 'none',
                transition: 'all 0.15s ease',
              }}
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#F87171',
                fontSize: '0.74rem',
                fontWeight: 600,
                padding: '7px 12px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
              }}
            >
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Apple-Style Primary Action Button */}
          <button
            type="submit"
            disabled={isActivating || !serialKeyInput.trim()}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: serialKeyInput.trim() ? '#3B82F6' : 'rgba(255, 255, 255, 0.08)',
              backgroundImage: serialKeyInput.trim()
                ? 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)'
                : 'none',
              color: serialKeyInput.trim() ? '#FFFFFF' : '#64748B',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: serialKeyInput.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: serialKeyInput.trim() ? '0 4px 16px rgba(37, 99, 235, 0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <span>{isActivating ? 'Memverifikasi...' : 'Aktivasi Lisensi'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* ── OR DIVIDER ── */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '18px 0 14px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
          <span style={{ fontSize: '0.66rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.08em' }}>
            ATAU COBA DULU
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)' }} />
        </div>

        {/* ── INSTANT TRIAL BUTTON OR EXPIRED NOTICE ── */}
        {trialInfo && trialInfo.isExpired ? (
          <div
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: '14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#F87171', fontSize: '0.76rem', fontWeight: 700 }}>
              <AlertCircle size={15} />
              <span>
                {trialInfo.expiredReason === 'tampering'
                  ? 'Manipulasi Jam Sistem Terdeteksi'
                  : trialInfo.expiredReason === 'transactions'
                  ? 'Batas 50 Transaksi Demo Telah Habis'
                  : 'Masa Demo 7 Hari Telah Berakhir'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8', lineHeight: 1.4 }}>
              Data toko & transaksi Anda tetap tersimpan aman. Hubungi kami via WhatsApp untuk mendapatkan Serial Key permanen.
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartTrial}
            disabled={isStartingTrial}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              backgroundColor: 'rgba(245, 158, 11, 0.12)',
              backgroundImage: 'linear-gradient(180deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.12) 100%)',
              color: '#FBBF24',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: isStartingTrial ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s ease',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.22)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.35)';
            }}
          >
            <Sparkles size={16} />
            <span>{isStartingTrial ? 'Mempersiapkan Demo...' : '🚀 Mulai Coba Demo Gratis (7 Hari)'}</span>
          </button>
        )}

        {/* ── SUBTLE FOOTER ── */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#64748B',
            fontSize: '0.68rem',
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={13} style={{ color: '#10B981' }} />
          <span>Lisensi Resmi Offline • Lifetime (Seumur Hidup)</span>
        </div>
      </motion.div>
    </div>
  );
};
