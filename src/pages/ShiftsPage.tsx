import React from 'react';
import { useStore } from '../stores/useStore';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { Clock, DollarSign, AlertTriangle, CheckCircle2, Lock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { currentShift, openShiftModal, transactions, addToast } = useStore();

  // Mock historical shifts + current state
  const mockHistoricalShifts = [
    {
      id: 'sh-101',
      employeeName: 'Ahmad Kasir',
      openedAt: new Date(Date.now() - 86400000).toISOString(),
      closedAt: new Date(Date.now() - 57600000).toISOString(),
      openingCash: 200000,
      totalRevenue: 1450000,
      closingCash: 1650000,
      cashDifference: 0,
      status: 'closed',
    },
    {
      id: 'sh-100',
      employeeName: 'Siti Manager',
      openedAt: new Date(Date.now() - 172800000).toISOString(),
      closedAt: new Date(Date.now() - 144000000).toISOString(),
      openingCash: 200000,
      totalRevenue: 2100000,
      closingCash: 2295000,
      cashDifference: -5000,
      status: 'closed',
    },
  ];

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', backgroundColor: 'var(--bg)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Manajemen Shift & Laci Kasir
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Rekap setoran uang fisik, pencatatan modal awal kas, dan audit selisih kas
          </p>
        </div>

        <button
          onClick={openShiftModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '12px',
            backgroundColor: currentShift ? '#D63031' : '#00B894',
            color: '#FFF',
            fontWeight: 800,
            fontSize: '0.88rem',
            border: 'none',
            cursor: 'pointer',
            boxShadow: currentShift ? '0 4px 14px rgba(214, 48, 49, 0.3)' : '0 4px 14px rgba(0, 184, 148, 0.3)',
          }}
        >
          <Clock size={18} />
          <span>{currentShift ? 'Tutup & Rekap Shift Sekarang' : 'Buka Shift Baru'}</span>
        </button>
      </div>

      {/* Active Shift Card Banner */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '20px',
          border: currentShift ? '2px solid #00B894' : '1px solid var(--border)',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: currentShift ? '#00B894' : '#FDCB6E',
                }}
              />
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                {currentShift ? `Shift Sedang Berjalan: ${currentShift.employeeName}` : 'Tidak Ada Shift yang Aktif'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {currentShift
                ? `Dibuka sejak ${formatDate(currentShift.openedAt, 'long')} pukul ${formatTime(currentShift.openedAt)}`
                : 'Buka shift terlebih dahulu untuk mulai melayani transaksi pelanggan.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => addToast('info', 'Kas Keluar kecil (Petty Cash) berhasil dicatat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowDownLeft size={14} style={{ color: '#D63031' }} />
              <span>Kas Keluar (Biaya)</span>
            </button>

            <button
              onClick={() => addToast('info', 'Kas Masuk tambahan berhasil dicatat')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowUpRight size={14} style={{ color: '#00B894' }} />
              <span>Kas Masuk Tambahan</span>
            </button>
          </div>
        </div>

        {currentShift && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginTop: '16px' }}>
            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modal Kas Awal</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
                {formatCurrency(currentShift.openingCash)}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Transaksi Shift Ini</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)', marginTop: '2px' }}>
                {transactions.length} Nota
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'var(--bg)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Penjualan Shift</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '2px' }}>
                {formatCurrency(transactions.reduce((s, t) => s + t.total, 0))}
              </div>
            </div>

            <div style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(0, 184, 148, 0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#009B7D', fontWeight: 600 }}>Status Laci Kasir</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#009B7D', marginTop: '2px' }}>
                Siap Melayani
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Shift History Table */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 800, fontSize: '0.98rem' }}>
          Riwayat Shift Terdahulu (Audit Log)
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>Kasir</th>
              <th style={{ padding: '14px 18px', fontWeight: 600 }}>Waktu Buka & Tutup</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Modal Awal</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Total Penjualan</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'right' }}>Kas Akhir Dihitung</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>Selisih</th>
              <th style={{ padding: '14px 18px', fontWeight: 600, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockHistoricalShifts.map((sh) => (
              <tr key={sh.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 18px', fontWeight: 700, color: 'var(--text)' }}>
                  {sh.employeeName}
                </td>
                <td style={{ padding: '14px 18px', color: 'var(--text-secondary)' }}>
                  <div>{formatDate(sh.openedAt, 'short')} {formatTime(sh.openedAt)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    s/d {formatTime(sh.closedAt)}
                  </div>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                  {formatCurrency(sh.openingCash)}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 700 }}>
                  {formatCurrency(sh.totalRevenue)}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-600)' }}>
                  {formatCurrency(sh.closingCash)}
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      backgroundColor: sh.cashDifference === 0 ? 'rgba(0, 184, 148, 0.12)' : 'rgba(214, 48, 49, 0.12)',
                      color: sh.cashDifference === 0 ? '#009B7D' : '#D63031',
                    }}
                  >
                    {sh.cashDifference === 0 ? 'Cocok (Rp 0)' : formatCurrency(sh.cashDifference)}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--bg)',
                      border: '1px solid var(--border)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                    }}
                  >
                    Selesai
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
