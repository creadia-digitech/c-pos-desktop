import React, { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { useTranslation } from '../../utils/useTranslation';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import { Clock, DollarSign, X, CheckCircle, AlertTriangle, Lock } from 'lucide-react';

export const ShiftModal: React.FC = () => {
  const {
    showShiftModal,
    closeShiftModal,
    currentShift,
    currentEmployee,
    openShift,
    closeShift,
    transactions,
    addToast,
  } = useStore();
  const { t } = useTranslation();

  const [openingCash, setOpeningCash] = useState<number>(200000);
  const [closingCash, setClosingCash] = useState<number>(0);

  if (!showShiftModal) return null;

  // Calculate shift stats if shift is open
  const shiftCashSales = transactions
    .filter((tx) => tx.status === 'completed' && tx.paymentMethod === 'cash')
    .reduce((sum, tx) => sum + tx.total, 0);

  const totalShiftSales = transactions
    .filter((tx) => tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.total, 0);

  const expectedCash = (currentShift?.openingCash || 0) + shiftCashSales;
  const cashDifference = closingCash - expectedCash;

  const handleOpenShift = () => {
    if (!currentEmployee) {
      addToast('error', 'Silakan pilih kasir terlebih dahulu');
      return;
    }
    openShift(openingCash);
    addToast('success', `Shift berhasil dibuka dengan modal ${formatCurrency(openingCash)}`);
    closeShiftModal();
  };

  const handleCloseShift = () => {
    closeShift(closingCash);
    addToast('success', 'Shift kasir berhasil ditutup dan direkap');
    closeShiftModal();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 1100,
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
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(0, 184, 148, 0.15)', color: '#009B7D' }}>
              <Clock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                {currentShift ? t('shift.recapAndClose') : t('shift.openNew')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentEmployee?.name ? `${t('shift.officer')} ${currentEmployee.name}` : t('shift.drawerManagement')}
              </p>
            </div>
          </div>

          <button
            onClick={closeShiftModal}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px' }}>
          {!currentShift ? (
            /* OPEN SHIFT FORM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  {t('shift.openingCashLabel')}
                </label>
                <input
                  type="number"
                  value={openingCash || ''}
                  onChange={(e) => setOpeningCash(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Quick suggestions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[100000, 200000, 300000, 500000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setOpeningCash(amt)}
                    style={{
                      flex: 1,
                      padding: '8px 4px',
                      borderRadius: '8px',
                      border: openingCash === amt ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                      backgroundColor: openingCash === amt ? 'var(--primary-50)' : 'var(--bg)',
                      color: openingCash === amt ? 'var(--primary-700)' : 'var(--text)',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.4,
                }}
              >
                Setiap shift merekam arus kas fisik masuk dan keluar secara terisolasi untuk mencegah selisih uang pada akhir hari.
              </div>

              <button
                onClick={handleOpenShift}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#00B894',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 184, 148, 0.3)',
                }}
              >
                {t('shift.startButton')}
              </button>
            </div>
          ) : (
            /* CLOSE SHIFT FORM */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '0.82rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Waktu Shift Dimulai:</span>
                  <span style={{ fontWeight: 600 }}>{formatTime(currentShift.openedAt)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Modal Awal Kas:</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(currentShift.openingCash)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{t('shift.cashSales')}:</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(shiftCashSales)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>{t('shift.allSales')}:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>{formatCurrency(totalShiftSales)}</span>
                </div>

                <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>Uang Kas Seharusnya:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#00B894' }}>
                    {formatCurrency(expectedCash)}
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Hitung Uang Fisik di Laci Kasir:
                </label>
                <input
                  type="number"
                  placeholder="Ketik total uang fisik..."
                  value={closingCash || ''}
                  onChange={(e) => setClosingCash(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Difference Status */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: cashDifference === 0 ? 'rgba(0, 184, 148, 0.1)' : 'rgba(214, 48, 49, 0.1)',
                  color: cashDifference === 0 ? '#009B7D' : '#D63031',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{t('shift.cashDifference')}</span>
                <span>
                  {cashDifference === 0 ? t('shift.perfectMatch') : `${cashDifference > 0 ? '+' : ''}${formatCurrency(cashDifference)}`}
                </span>
              </div>

              <button
                onClick={handleCloseShift}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#D63031',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.98rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(214, 48, 49, 0.3)',
                }}
              >
                {t('shift.closeButton')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
