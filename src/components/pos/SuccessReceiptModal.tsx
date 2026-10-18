import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import { formatCurrency, formatDate, formatTime } from '../../utils/helpers';
import {
  generateThermalReceiptHtml,
  printViaIsolatedIframe,
  generateWhatsAppReceiptText,
  formatPhoneNumberForWa,
} from '../../utils/printer';
import { Printer, CheckCircle2, Plus, X, Send } from 'lucide-react';

export const SuccessReceiptModal: React.FC = () => {
  const {
    showSuccessModal,
    closeSuccessModal,
    lastTransaction,
    businessName,
    businessAddress,
    businessPhone,
    addToast,
    customers,
    paperWidth,
    selectedPrinter,
    autoSilentPrint,
  } = useStore();

  const receiptRef = useRef<HTMLDivElement>(null);
  const [showWaModal, setShowWaModal] = useState(false);
  const [waPhone, setWaPhone] = useState('');

  const handlePrint = async () => {
    if (!lastTransaction) return;
    addToast('success', `Mencetak struk kasir (${paperWidth || '58mm'})...`);

    const currentPaperWidth = paperWidth || '58mm';
    const targetPrinter = selectedPrinter || undefined;

    // Check if Electron native silent print is available
    if ((window as any).electronAPI?.printReceipt) {
      try {
        const html = generateThermalReceiptHtml(lastTransaction, {
          businessName,
          businessAddress,
          businessPhone,
          paperWidth: currentPaperWidth,
        });
        await (window as any).electronAPI.printReceipt(html, targetPrinter);
        return;
      } catch (err) {
        console.error('Electron print error:', err);
      }
    }

    // Direct isolated thermal print
    const html = generateThermalReceiptHtml(lastTransaction, {
      businessName,
      businessAddress,
      businessPhone,
      paperWidth: currentPaperWidth,
    });
    await printViaIsolatedIframe(html, targetPrinter);
  };

  // Auto-print upon transaction completion if enabled
  useEffect(() => {
    if (showSuccessModal && lastTransaction && autoSilentPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, lastTransaction?.id, autoSilentPrint]);

  if (!showSuccessModal || !lastTransaction) return null;

  const handleOpenWaModal = () => {
    // Detect customer phone from store
    const matchingCustomer = customers.find(
      (c) =>
        (lastTransaction.customerId && c.id === lastTransaction.customerId) ||
        (lastTransaction.customerName && c.name.toLowerCase() === lastTransaction.customerName.toLowerCase())
    );
    setWaPhone(matchingCustomer?.phone || '');
    setShowWaModal(true);
  };

  const handleSendWhatsApp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!waPhone.trim()) {
      addToast('warning', 'Masukkan nomor WhatsApp pelanggan');
      return;
    }

    const cleanPhone = formatPhoneNumberForWa(waPhone.trim());
    if (cleanPhone.length < 8) {
      addToast('warning', 'Nomor WhatsApp tidak valid (terlalu pendek)');
      return;
    }

    const message = generateWhatsAppReceiptText(lastTransaction, {
      businessName,
      businessAddress,
      businessPhone,
    });

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    // Try Electron openExternal if available
    if ((window as any).electronAPI?.openExternal) {
      (window as any).electronAPI.openExternal(waUrl);
    } else {
      window.open(waUrl, '_blank');
    }

    addToast('success', `Struk digital disiapkan untuk WhatsApp ${cleanPhone}!`);
    setShowWaModal(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94vh',
          position: 'relative',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            backgroundColor: '#00B894',
            color: '#FFFFFF',
            padding: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Transaksi Berhasil!</h2>
          <div style={{ fontSize: '0.82rem', opacity: 0.9 }}>
            Kembalian: <strong>{formatCurrency(lastTransaction.changeAmount)}</strong>
          </div>
        </div>

        {/* Thermal Receipt Simulation Paper */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--bg)' }}>
          <div
            ref={receiptRef}
            id="thermal-receipt-print"
            className="thermal-receipt"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#000000',
              padding: '24px 20px',
              borderRadius: '12px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
              fontFamily: "'Consolas', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, monospace, sans-serif",
              fontSize: '0.84rem',
              fontWeight: 700,
              lineHeight: 1.35,
              border: '1px solid #D1D5DB',
            }}
          >
            {/* Header info */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 900, letterSpacing: '-0.2px' }}>{businessName || 'C-POS STORE'}</div>
              {businessAddress && <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{businessAddress}</div>}
              {businessPhone && <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>Telp: {businessPhone}</div>}
              <div style={{ borderBottom: '1.5px dashed #000000', margin: '8px 0' }} />
            </div>

            {/* Meta info */}
            <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>No. Struk</span>
                <span>#{lastTransaction.receiptNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Waktu</span>
                <span>
                  {formatDate(lastTransaction.createdAt, 'short')} {formatTime(lastTransaction.createdAt)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Kasir</span>
                <span>{lastTransaction.employeeName}</span>
              </div>
              {lastTransaction.customerName && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pelanggan</span>
                  <span>{lastTransaction.customerName}</span>
                </div>
              )}
              {lastTransaction.orderType && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tipe</span>
                  <span>{lastTransaction.orderType === 'dine_in' ? 'Dine In (Makan di Tempat)' : 'Takeaway'}</span>
                </div>
              )}
              <div style={{ borderBottom: '1.5px dashed #000000', margin: '8px 0' }} />
            </div>

            {/* Items table */}
            <div style={{ marginBottom: '10px' }}>
              {lastTransaction.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: '5px' }}>
                  <div style={{ fontWeight: 900, fontSize: '0.86rem' }}>{item.productName}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                    <span>
                      {item.quantity} x {formatCurrency(item.unitPrice)}
                    </span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                </div>
              ))}
              <div style={{ borderBottom: '1.5px dashed #000000', margin: '8px 0' }} />
            </div>

            {/* Financial summary */}
            <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>{formatCurrency(lastTransaction.subtotal)}</span>
              </div>

              {lastTransaction.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Diskon</span>
                  <span>-{formatCurrency(lastTransaction.discountAmount)}</span>
                </div>
              )}

              {lastTransaction.pointsDiscountAmount && lastTransaction.pointsDiscountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#000' }}>
                  <span>Tukar Poin ({lastTransaction.pointsRedeemed || 0} Poin)</span>
                  <span>-{formatCurrency(lastTransaction.pointsDiscountAmount)}</span>
                </div>
              )}

              {lastTransaction.serviceChargeAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Service Charge</span>
                  <span>{formatCurrency(lastTransaction.serviceChargeAmount)}</span>
                </div>
              )}

              {lastTransaction.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PPN</span>
                  <span>{formatCurrency(lastTransaction.taxAmount)}</span>
                </div>
              )}

              <div style={{ borderBottom: '2px solid #000000', margin: '6px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '1rem' }}>
                <span>TOTAL</span>
                <span>{formatCurrency(lastTransaction.total)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span style={{ textTransform: 'capitalize' }}>Bayar ({lastTransaction.paymentMethod})</span>
                <span>{formatCurrency(lastTransaction.paymentAmount)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900 }}>
                <span>Kembali</span>
                <span>{formatCurrency(lastTransaction.changeAmount)}</span>
              </div>

              {lastTransaction.pointsEarned && lastTransaction.pointsEarned > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, marginTop: '3px' }}>
                  <span>Poin Didapat (+)</span>
                  <span>+{lastTransaction.pointsEarned} Poin</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '0.75rem', fontWeight: 700, color: '#000000' }}>
              <div>Terima kasih atas kunjungan Anda!</div>
              <div style={{ fontSize: '0.68rem', marginTop: '2px' }}>Powered by C-POS Offline Desktop</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handlePrint}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              <Printer size={18} />
              <span>Cetak Struk</span>
            </button>

            {/* WhatsApp Digital Receipt Button */}
            <button
              onClick={handleOpenWaModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid rgba(37, 211, 102, 0.35)',
                backgroundColor: 'rgba(37, 211, 102, 0.12)',
                color: '#128C7E',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Kirim Struk Digital via WhatsApp"
            >
              <img
                src="/whatsapp.png"
                alt="WhatsApp"
                style={{ width: '22px', height: '22px', objectFit: 'contain' }}
              />
              <span>WhatsApp</span>
            </button>
          </div>

          <button
            onClick={closeSuccessModal}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'var(--primary-500)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(108, 92, 231, 0.3)',
            }}
          >
            <Plus size={18} />
            <span>Transaksi Baru</span>
          </button>
        </div>

        {/* WhatsApp Popup Dialog */}
        {showWaModal && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 1300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '400px',
                backgroundColor: 'var(--surface)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/whatsapp.png" alt="WhatsApp" style={{ width: '26px', height: '26px' }} />
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                    Kirim Struk WhatsApp
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWaModal(false)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSendWhatsApp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                    Nomor WhatsApp Pelanggan {lastTransaction.customerName ? `(${lastTransaction.customerName})` : ''}
                  </label>
                  <input
                    type="tel"
                    required
                    autoFocus
                    placeholder="Contoh: 081234567890"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Format: 08xxx atau 628xxx (Otomatis diarahkan ke WhatsApp Web/App)
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowWaModal(false)}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: '12px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    style={{
                      flex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '11px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: '#25D366',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)',
                    }}
                  >
                    <Send size={16} />
                    <span>Kirim Sekarang</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
