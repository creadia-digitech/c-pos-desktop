import React, { useState, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import { useTranslation } from '../../utils/useTranslation';
import { formatDate, formatTime } from '../../utils/helpers';
import { printViaIsolatedIframe } from '../../utils/printer';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  Globe,
  Clock,
  Printer,
  Coins,
  LogOut,
  Layers,
  ChevronDown,
  Check,
  Lock,
  Sparkles,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { UpgradeLicenseModal } from './UpgradeLicenseModal';
import { UpdateManagerModal } from './UpdateManagerModal';
import { useAutoUpdate } from '../../utils/useAutoUpdate';

interface HeaderProps {
  onOpenPinModal: () => void;
}

const HeaderClock = React.memo(() => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        fontSize: '0.78rem',
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}
    >
      <Clock size={13} style={{ color: 'var(--primary-500)' }} />
      <span>{formatDate(time, 'short')}</span>
      <span style={{ color: 'var(--border)' }}>•</span>
      <span style={{ fontWeight: 800, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        {formatTime(time)}
      </span>
    </div>
  );
});
HeaderClock.displayName = 'HeaderClock';

export const Header: React.FC<HeaderProps> = ({ onOpenPinModal }) => {
  const {
    businessName,
    businessType,
    theme,
    toggleTheme,
    language,
    setLang,
    currentEmployee,
    currentShift,
    openShiftModal,
    logout,
    addToast,
    selectedPrinter,
    setSelectedPrinter,
    lockScreen,
    addAuditLog,
    isTrial,
    trialStatus,
  } = useStore();
  const { t } = useTranslation();

  const [showEmployeeMenu, setShowEmployeeMenu] = useState(false);
  const [showPrinterPopover, setShowPrinterPopover] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [printerList, setPrinterList] = useState<string[]>([]);
  const autoUpdate = useAutoUpdate();

  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getPrinters) {
      electronAPI.getPrinters().then((printers: any[]) => {
        if (Array.isArray(printers) && printers.length > 0) {
          const names = printers.map((p) => p.name);
          setPrinterList(names);
          // If selectedPrinter not yet in list or empty, prefer POS-58 if available
          const foundPos = names.find((n) => n.toLowerCase().includes('pos') || n.toLowerCase().includes('58'));
          if (foundPos && (!selectedPrinter || selectedPrinter === '')) {
            setSelectedPrinter(foundPos);
          }
        }
      }).catch((e: any) => console.log('Get printers note:', e));
    }
  }, []);

  const activePrinterName = selectedPrinter || 'POS-58';

  const handleTestPrint = async () => {
    addToast('info', `${t('header.testPrintSending')} ${activePrinterName}...`);
    const testHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: 58mm auto; margin: 0; }
          body {
            font-family: 'Consolas', -apple-system, 'Segoe UI', Arial, sans-serif;
            width: 44mm;
            margin: 0 !important;
            padding: 2mm 0;
            font-size: 11px;
            font-weight: 700;
            color: #000;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div>================================</div>
        <div style="font-size: 13px; font-weight: 900; margin: 4px 0;">TES PRINTER POS 58MM</div>
        <div>================================</div>
        <div style="text-align: left; margin: 6px 0; font-size: 10px;">
          <div>Toko   : ${businessName || 'C-POS Store'}</div>
          <div>Printer: ${activePrinterName}</div>
          <div>Waktu  : ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')}</div>
          <div>Kasir  : ${currentEmployee?.name || 'Kasir'}</div>
          <div>Mode   : Silent Print (Tanpa Dialog)</div>
        </div>
        <div>--------------------------------</div>
        <div style="margin: 8px 0; font-weight: 900;">PRINTER THERMAL SIAP!</div>
        <div>================================</div>
        <br/><br/><br/>
      </body>
      </html>
    `;
    const res = await printViaIsolatedIframe(testHtml, activePrinterName);
    if (res) {
      addToast('success', `${t('header.testPrintSuccess')} ${activePrinterName}!`);
    }
  };

  const handleOpenDrawer = () => {
    addToast('success', t('header.openDrawerSuccess'));
    addAuditLog({
      employeeId: currentEmployee?.id || 'sys',
      employeeName: currentEmployee?.name || 'Kasir',
      employeeRole: currentEmployee?.role || 'cashier',
      action: 'drawer_opened',
      details: 'Laci kasir dibuka manual dari tombol Header (tanpa struk transaksi)',
      authorizedBy: currentEmployee?.name || 'Kasir',
    });
  };

  return (
    <header
      className="header"
      style={{
        height: '56px',
        backgroundColor: 'var(--surface)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        userSelect: 'none',
        position: 'relative',
        zIndex: 50,
      }}
    >
      {/* ── Left Island: Brand & Shift Status ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              flexShrink: 0,
            }}
          >
            <img
              src={logoImg}
              alt="C-POS"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 6px rgba(0, 184, 148, 0.25))',
              }}
            />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)', lineHeight: 1.2 }}>
              {businessName || 'C-POS Store'}
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--primary-600)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {businessType === 'fnb' ? 'F&B POS' : businessType === 'retail' ? 'Retail POS' : 'Hybrid POS'}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

        {/* Dynamic Shift Status Badge */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={openShiftModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '20px',
            border: currentShift ? '1px solid rgba(0, 184, 148, 0.4)' : '1px solid rgba(240, 180, 41, 0.4)',
            background: currentShift
              ? 'rgba(0, 184, 148, 0.08)'
              : 'rgba(253, 203, 110, 0.15)',
            color: currentShift ? '#009B7D' : '#D99E1E',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title={currentShift ? t('header.shiftActiveTooltip') : t('header.shiftClosedTooltip')}
        >
          <span
            className={currentShift ? 'radar-dot-active' : 'radar-dot-amber'}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: currentShift ? '#00B894' : '#F0B429',
              display: 'inline-block',
            }}
          />
          <span>{currentShift ? `${t('header.shiftActive')} (${currentShift.employeeName})` : t('header.shiftClosed')}</span>
        </motion.button>

        {/* Dynamic Demo Badge */}
        {isTrial && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowUpgradeModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '4px 10px',
              borderRadius: '20px',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              background: 'rgba(245, 158, 11, 0.1)',
              color: '#D97706',
              fontSize: '0.74rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Klik untuk upgrade ke Lisensi Resmi Permanen"
          >
            <Sparkles size={13} style={{ color: '#F59E0B' }} />
            <span>
              Demo: Sisa {trialStatus?.daysRemaining ?? 7} Hari ({trialStatus?.completedTransactions ?? 0}/{trialStatus?.maxTransactions ?? 50} Trx)
            </span>
            <span
              style={{
                fontSize: '0.64rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: '#F59E0B',
                color: '#FFFFFF',
                textTransform: 'uppercase',
              }}
            >
              Upgrade
            </span>
          </motion.button>
        )}

        {/* Dynamic Auto-Update Indicator Badge */}
        {autoUpdate.status === 'downloaded' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowUpdateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: '#10B981',
              backgroundImage: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 12px rgba(16, 185, 129, 0.45)',
            }}
            title="Pembaruan siap dipasang! Klik untuk restart C-POS."
          >
            <Sparkles size={12} />
            <span>Update Siap Pasang</span>
          </motion.button>
        )}

        {autoUpdate.status === 'available' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowUpdateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              color: '#60A5FA',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Versi baru tersedia! Klik untuk mengunduh."
          >
            <Sparkles size={12} />
            <span>Update v{autoUpdate.version || 'Baru'}</span>
          </motion.button>
        )}

        {autoUpdate.status === 'downloading' && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowUpdateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93C5FD',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
            }}
            title="Sedang mengunduh pembaruan di latar belakang..."
          >
            <span>Unduh: {autoUpdate.percent}%</span>
          </motion.button>
        )}
      </div>

      {/* ── Center Island: Hardware Status & Quick Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Quick Printer Status Popover Button */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPrinterPopover(!showPrinterPopover)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={t('header.printerTooltip')}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Printer size={15} style={{ color: 'var(--primary-500)' }} />
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-3px',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: '#00B894',
                }}
              />
            </div>
            <span>{t('header.printerLabel')} <strong>{activePrinterName}</strong></span>
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '5px',
                backgroundColor: 'rgba(0, 184, 148, 0.12)',
                color: '#009B7D',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Check size={11} /> {t('header.autoPrintBadge')}
            </span>
            <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
          </motion.button>

          {/* Printer Popover Menu */}
          <AnimatePresence>
            {showPrinterPopover && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '300px',
                  backgroundColor: 'var(--surface)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                  padding: '14px',
                  zIndex: 999,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>
                    {t('header.printerSettings')}
                  </span>
                  <span style={{ fontSize: '0.68rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(0,184,148,0.12)', color: '#009B7D', fontWeight: 700 }}>
                    {t('header.silentPrintActive')}
                  </span>
                </div>

                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.35 }}>
                  {t('header.printerDesc')}
                </p>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text)', marginBottom: '5px' }}>
                    {t('header.targetPrinter')}
                  </label>
                  <select
                    value={activePrinterName}
                    onChange={(e) => {
                      setSelectedPrinter(e.target.value);
                      addToast('success', `Printer tersimpan: ${e.target.value}`);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="POS-58">POS-58 (Rekomendasi Thermal 58mm)</option>
                    {printerList
                      .filter((p) => p !== 'POS-58')
                      .map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => {
                      handleTestPrint();
                    }}
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary-500)',
                      color: '#FFF',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {t('header.testPrintDirect')}
                  </button>

                  <button
                    onClick={() => setShowPrinterPopover(false)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {t('header.close')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Open Drawer Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenDrawer}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 12px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={t('header.openDrawerTooltip')}
        >
          <Coins size={15} style={{ color: '#F39C12' }} />
          <span>{t('header.openDrawer')}</span>
        </motion.button>

        {/* Quick Lock Screen Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={lockScreen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 11px',
            borderRadius: '10px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Kunci Layar Kasir (Standby)"
        >
          <Lock size={14} style={{ color: '#F59E0B' }} />
          <span>Kunci</span>
        </motion.button>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

        {/* Live Clock (Isolated self-updating component) */}
        <HeaderClock />
      </div>

      {/* ── Right Island: Controls & Profile Chip ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Language switch */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLang(language === 'id' ? 'en' : 'id')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 9px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            fontSize: '0.75rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title={t('header.changeLang')}
        >
          <Globe size={13} style={{ color: 'var(--primary-500)' }} />
          <span>{language.toUpperCase()}</span>
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          whileHover={{ scale: 1.05, rotate: 15 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={theme === 'dark' ? t('header.lightMode') : t('header.darkMode')}
        >
          {theme === 'dark' ? (
            <Sun size={15} style={{ color: '#FDCB6E' }} />
          ) : (
            <Moon size={15} style={{ color: 'var(--primary-500)' }} />
          )}
        </motion.button>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', backgroundColor: 'var(--border)' }} />

        {/* Cashier Profile Dropdown */}
        <div style={{ position: 'relative' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEmployeeMenu(!showEmployeeMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '3px 8px 3px 4px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: currentEmployee?.avatarColor || 'var(--primary-500)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.8rem',
              }}
            >
              {currentEmployee?.name?.charAt(0) || 'U'}
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1 }}>
                {currentEmployee?.name || t('header.cashierDefault')}
              </div>
            </div>

            <ChevronDown
              size={12}
              style={{
                color: 'var(--text-muted)',
                transform: showEmployeeMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            />
          </motion.button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {showEmployeeMenu && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '220px',
                  backgroundColor: 'var(--surface)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid var(--border)',
                  borderRadius: '14px',
                  boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                  padding: '8px',
                  zIndex: 999,
                }}
              >
                <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t('header.loginAs')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text)' }}>
                    {currentEmployee?.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary-600)', textTransform: 'capitalize', fontWeight: 600 }}>
                    {t('header.role')} {currentEmployee?.role}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowEmployeeMenu(false);
                    lockScreen();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Lock size={15} style={{ color: '#F59E0B' }} />
                  <span>Kunci Layar Kasir</span>
                </button>

                <button
                  onClick={() => {
                    setShowEmployeeMenu(false);
                    onOpenPinModal();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Layers size={15} style={{ color: 'var(--primary-500)' }} />
                  <span>Ganti Kasir (PIN)</span>
                </button>

                <button
                  onClick={() => {
                    setShowEmployeeMenu(false);
                    openShiftModal();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Clock size={15} style={{ color: '#00B894' }} />
                  <span>{currentShift ? t('header.recapShift') : t('shift.open')}</span>
                </button>

                <button
                  onClick={() => {
                    setShowEmployeeMenu(false);
                    setShowUpdateModal(true);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <Sparkles size={15} style={{ color: '#3B82F6' }} />
                  <span>Cek Pembaruan C-POS</span>
                </button>

                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                <button
                  onClick={() => {
                    setShowEmployeeMenu(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#D63031',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(214, 48, 49, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <LogOut size={15} />
                  <span>{t('header.logout')}</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade License Modal */}
      <UpgradeLicenseModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

      {/* Auto-Update Manager Modal */}
      <UpdateManagerModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        currentAppVersion="1.0.0"
      />
    </header>
  );
};
