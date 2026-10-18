import React, { useState, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import { PaymentMethod } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Building,
  CheckCircle2,
  Printer,
  Delete,
  Sparkles,
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    showPaymentModal,
    closePaymentModal,
    getCartTotal,
    completeTransaction,
    currentShift,
    openShiftModal,
  } = useStore();

  const total = getCartTotal();

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(total);
  const [printReceipt, setPrintReceipt] = useState<boolean>(true);
  const [qrisPaid, setQrisPaid] = useState<boolean>(false);
  const [cardRef, setCardRef] = useState<string>('');

  useEffect(() => {
    if (showPaymentModal) {
      setCashGiven(total);
      setMethod('cash');
      setQrisPaid(false);
      setCardRef('');
    }
  }, [showPaymentModal, total]);

  if (!showPaymentModal) return null;

  // Suggest quick cash values
  const getQuickCashSuggestions = (amt: number) => {
    const suggestions = [amt]; // Uang Pas
    const roundTo10k = Math.ceil(amt / 10000) * 10000;
    const roundTo20k = Math.ceil(amt / 20000) * 20000;
    const roundTo50k = Math.ceil(amt / 50000) * 50000;
    const roundTo100k = Math.ceil(amt / 100000) * 100000;

    [roundTo10k, roundTo20k, roundTo50k, roundTo100k].forEach((val) => {
      if (val > amt && !suggestions.includes(val)) {
        suggestions.push(val);
      }
    });

    // Fallbacks
    if (!suggestions.includes(50000) && 50000 > amt) suggestions.push(50000);
    if (!suggestions.includes(100000) && 100000 > amt) suggestions.push(100000);
    return suggestions.slice(0, 5);
  };

  const quickAmounts = getQuickCashSuggestions(total);
  const change = Math.max(0, cashGiven - total);
  const isCashSufficient = cashGiven >= total;

  const handleComplete = () => {
    if (method === 'cash' && !isCashSufficient) return;
    completeTransaction(method, method === 'cash' ? cashGiven : total);
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
          maxWidth: '750px',
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
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
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
              Pembayaran Transaksi
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Pilih metode dan masukkan jumlah bayar pelanggan
            </div>
          </div>

          <button
            onClick={closePaymentModal}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Content Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', flex: 1, overflowY: 'auto' }}>
          {/* Method Selector Tabs */}
          <div
            style={{
              padding: '16px',
              borderRight: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '4px' }}>
              METODE PEMBAYARAN:
            </div>

            {[
              { id: 'cash', label: 'Tunai (Cash)', icon: Banknote },
              { id: 'qris', label: 'QRIS Statis / Dinamis', icon: QrCode },
              { id: 'debit', label: 'Kartu Debit', icon: CreditCard },
              { id: 'credit', label: 'Kartu Kredit', icon: CreditCard },
              { id: 'transfer', label: 'Transfer Bank', icon: Building },
            ].map((m) => {
              const Icon = m.icon;
              const isSelected = method === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id as PaymentMethod)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                    backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--surface)',
                    color: isSelected ? '#FFFFFF' : 'var(--text)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={18} />
                  <span>{m.label}</span>
                </button>
              );
            })}

            {/* Total tagihan card on sidebar */}
            <div
              style={{
                marginTop: 'auto',
                padding: '14px',
                borderRadius: '14px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                Total Harus Dibayar
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
                {formatCurrency(total)}
              </div>
            </div>
          </div>

          {/* Method Detail Area */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* CASH PAYMENT SECTION */}
            {method === 'cash' && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  PILIHAN CEPAT UANG DITERIMA:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
                  {quickAmounts.map((amt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCashGiven(amt)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: cashGiven === amt ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                        backgroundColor: cashGiven === amt ? 'var(--primary-50)' : 'var(--bg)',
                        color: cashGiven === amt ? 'var(--primary-700)' : 'var(--text)',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {amt === total ? 'Uang Pas' : formatCurrency(amt)}
                    </button>
                  ))}
                </div>

                {/* Input Display */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Uang Diterima:</span>
                    <input
                      type="number"
                      value={cashGiven || ''}
                      onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                      style={{
                        fontSize: '1.3rem',
                        fontWeight: 800,
                        color: 'var(--text)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'right',
                        width: '200px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '8px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>Kembalian:</span>
                    <span
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color: isCashSufficient ? '#00B894' : '#D63031',
                      }}
                    >
                      {isCashSufficient ? formatCurrency(change) : 'Uang Kurang'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* QRIS PAYMENT SECTION */}
            {method === 'qris' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '10px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', marginBottom: '4px' }}>
                  Scan QRIS Standard Nasional
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Mendukung BCA, GoPay, OVO, Dana, ShopeePay, LinkAja, Livin, dll.
                </div>

                {/* QR Box */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '180px',
                      height: '180px',
                      backgroundColor: '#2D3436',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <QrCode size={110} />
                    <span style={{ fontSize: '0.72rem', letterSpacing: '1px', fontWeight: 700 }}>QRIS DINAMIS</span>
                  </div>
                </div>

                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-600)', marginBottom: '14px' }}>
                  {formatCurrency(total)}
                </div>

                <button
                  onClick={() => setQrisPaid(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: '1px solid #00B894',
                    backgroundColor: qrisPaid ? '#00B894' : 'rgba(0, 184, 148, 0.1)',
                    color: qrisPaid ? '#FFF' : '#009B7D',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{qrisPaid ? 'Pembayaran QRIS Berhasil Terverifikasi' : 'Konfirmasi Pembayaran Diterima'}</span>
                </button>
              </div>
            )}

            {/* DEBIT / CREDIT / TRANSFER */}
            {(method === 'debit' || method === 'credit' || method === 'transfer') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                  Informasi {method === 'transfer' ? 'Bukti Transfer' : 'Mesin EDC'}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                    Nomor Referensi / Trace EDC (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 8392182749"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.9rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.82rem',
                  }}
                >
                  <Sparkles size={18} style={{ color: 'var(--primary-500)', flexShrink: 0 }} />
                  <span>Pastikan transaksi pada mesin EDC eksternal atau m-banking sudah berstatus APPROVED.</span>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={printReceipt}
                  onChange={(e) => setPrintReceipt(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-500)' }}
                />
                <Printer size={16} />
                <span>Cetak Struk Thermal Otomatis setelah Selesai</span>
              </label>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={closePaymentModal}
                  style={{
                    flex: 1,
                    padding: '14px',
                    borderRadius: '14px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>

                <button
                  onClick={handleComplete}
                  disabled={method === 'cash' && !isCashSufficient}
                  style={{
                    flex: 2,
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: method === 'cash' && !isCashSufficient ? 'not-allowed' : 'pointer',
                    opacity: method === 'cash' && !isCashSufficient ? 0.5 : 1,
                    boxShadow: '0 6px 16px rgba(108, 92, 231, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>Selesaikan & Bayar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
