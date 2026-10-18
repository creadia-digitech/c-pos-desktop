import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ArrowRight,
  ShieldCheck,
  HardDrive,
  Info,
  Rocket,
} from 'lucide-react';
import { useAutoUpdate } from '../../utils/useAutoUpdate';

interface UpdateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAppVersion?: string;
}

export const UpdateManagerModal: React.FC<UpdateManagerModalProps> = ({
  isOpen,
  onClose,
  currentAppVersion = '1.0.0',
}) => {
  const {
    status,
    version: newVersion,
    releaseDate,
    releaseNotes,
    percent,
    bytesPerSecond,
    transferred,
    total,
    errorMessage,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useAutoUpdate();

  if (!isOpen) return null;

  const formatSpeed = (bytesPerSec: number) => {
    if (!bytesPerSec || bytesPerSec <= 0) return '';
    if (bytesPerSec > 1024 * 1024) {
      return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
    }
    return `${Math.round(bytesPerSec / 1024)} KB/s`;
  };

  const formatMb = (bytes: number) => {
    if (!bytes) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(5, 8, 16, 0.75)',
          backdropFilter: 'blur(12px)',
          padding: '16px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: '520px',
            backgroundColor: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '24px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(0, 184, 148, 0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            color: '#F8FAFC',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 184, 148, 0.12)',
                  border: '1px solid rgba(0, 184, 148, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00B894',
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  Pembaruan Sistem C-POS
                </h3>
                <p style={{ fontSize: '0.74rem', color: '#94A3B8', margin: '2px 0 0 0' }}>
                  Layanan pembaruan otomatis tanpa menghapus data transaksi
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94A3B8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Version Status Box */}
            <div
              style={{
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Versi Terpasang
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F8FAFC', marginTop: '2px' }}>
                  v{currentAppVersion}
                </div>
              </div>

              <ArrowRight size={18} style={{ color: '#475569' }} />

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                  Versi Server Rilis
                </span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: newVersion ? '#00B894' : '#94A3B8', marginTop: '2px' }}>
                  {newVersion ? `v${newVersion}` : 'Terbaru'}
                </div>
              </div>
            </div>

            {/* Dynamic Status States */}
            {status === 'checking' && (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <RefreshCw size={28} className="animate-spin" style={{ color: '#3B82F6' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#93C5FD' }}>
                    Menghubungi Server Pembaruan...
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#60A5FA', marginTop: '3px' }}>
                    Memeriksa paket patch & pembaruan resmi C-POS
                  </div>
                </div>
              </div>
            )}

            {status === 'available' && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(0, 184, 148, 0.08)',
                  border: '1px solid rgba(0, 184, 148, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} style={{ color: '#00B894' }} />
                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#00B894' }}>
                    Versi Baru Tersedia: v{newVersion}!
                  </div>
                </div>

                {releaseNotes ? (
                  <div
                    style={{
                      maxHeight: '100px',
                      overflowY: 'auto',
                      fontSize: '0.76rem',
                      color: '#CBD5E1',
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    {releaseNotes}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.76rem', color: '#94A3B8', margin: 0 }}>
                    Pembaruan mencakup peningkatan performa cetak thermal, stabilitas database SQLite, dan optimasi antarmuka kasir.
                  </p>
                )}

                <button
                  onClick={downloadUpdate}
                  style={{
                    marginTop: '4px',
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#00B894',
                    color: '#080C16',
                    fontWeight: 800,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0, 184, 148, 0.4)',
                  }}
                >
                  <DownloadCloud size={16} />
                  <span>Unduh Pembaruan Sekarang</span>
                </button>
              </div>
            )}

            {status === 'downloading' && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <DownloadCloud size={18} style={{ color: '#3B82F6' }} />
                    <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#93C5FD' }}>
                      Mengunduh Pembaruan di Latar Belakang...
                    </span>
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#60A5FA' }}>
                    {percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    borderRadius: '99px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${percent}%`,
                      borderRadius: '99px',
                      backgroundColor: '#3B82F6',
                      backgroundImage: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                      boxShadow: '0 0 10px #3B82F6',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94A3B8' }}>
                  <span>{formatMb(transferred)} / {formatMb(total)}</span>
                  <span>{formatSpeed(bytesPerSecond)}</span>
                </div>
              </div>
            )}

            {status === 'downloaded' && (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={22} style={{ color: '#10B981' }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#10B981' }}>
                      Pembaruan Siap Dipasang!
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#6EE7B7' }}>
                      C-POS akan restart singkat untuk mengaplikasikan pembaruan.
                    </div>
                  </div>
                </div>

                <button
                  onClick={installUpdate}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    backgroundImage: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Rocket size={17} />
                  <span>Pasang Sekarang & Mulai Ulang C-POS</span>
                </button>
              </div>
            )}

            {status === 'not-available' && (
              <div
                style={{
                  padding: '18px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <CheckCircle2 size={20} style={{ color: '#10B981', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#F8FAFC' }}>
                    Sistem Anda Menggunakan Versi Terbaru
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#94A3B8', marginTop: '2px' }}>
                    Belum ada versi yang lebih baru dari v{currentAppVersion}.
                  </div>
                </div>
              </div>
            )}

            {(status === 'error' || status === 'dev-mode') && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  backgroundColor: status === 'dev-mode' ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: status === 'dev-mode' ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}
              >
                <Info size={18} style={{ color: status === 'dev-mode' ? '#F59E0B' : '#EF4444', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.76rem', color: status === 'dev-mode' ? '#FDE68A' : '#FCA5A5' }}>
                  {errorMessage || 'Tidak dapat menghubungi server pembaruan saat ini.'}
                </div>
              </div>
            )}

            {/* Offline Update Note */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.72rem',
                color: '#64748B',
              }}
            >
              <HardDrive size={16} style={{ color: '#94A3B8', flexShrink: 0 }} />
              <div>
                <strong>Toko Tanpa Koneksi Internet?</strong> Anda dapat memperbarui aplikasi secara manual dengan menimpa installer dari USB Flashdisk tanpa khawatir data hilang.
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748B' }}>
              <ShieldCheck size={14} style={{ color: '#10B981' }} />
              <span>Database & Lisensi 100% Aman</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={checkForUpdates}
                disabled={status === 'checking' || status === 'downloading'}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#F8FAFC',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={12} className={status === 'checking' ? 'animate-spin' : ''} />
                <span>Periksa Lagi</span>
              </button>

              <button
                onClick={onClose}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#3B82F6',
                  color: '#FFF',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
