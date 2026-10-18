import React, { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { Discount } from '../../types';
import { formatCurrency, generateId } from '../../utils/helpers';
import { Tag, X, Check, Plus, Percent } from 'lucide-react';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ isOpen, onClose }) => {
  const { discounts, cartDiscount, setCartDiscount, addToast } = useStore();

  const [isCustom, setIsCustom] = useState(false);
  const [customType, setCustomType] = useState<'percentage' | 'fixed'>('percentage');
  const [customValue, setCustomValue] = useState<number>(10);
  const [customName, setCustomName] = useState<string>('Diskon Khusus');

  if (!isOpen) return null;

  const handleSelectDiscount = (disc: Discount) => {
    setCartDiscount(disc);
    addToast('success', `Diskon "${disc.name}" diterapkan`);
    onClose();
  };

  const handleRemoveDiscount = () => {
    setCartDiscount(null);
    addToast('info', 'Diskon dibatalkan');
    onClose();
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const newDisc: Discount = {
      id: generateId(),
      name: customName || `Diskon ${customType === 'percentage' ? customValue + '%' : formatCurrency(customValue)}`,
      type: customType,
      value: customValue,
      minPurchase: 0,
      isActive: true,
    };
    setCartDiscount(newDisc);
    addToast('success', `Diskon "${newDisc.name}" diterapkan`);
    setIsCustom(false);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
              <Tag size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>Diskon & Promo</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pilih promo toko atau buat potongan khusus</p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px' }}>
          {!isCustom ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {cartDiscount && (
                <button
                  onClick={handleRemoveDiscount}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1px solid #D63031',
                    backgroundColor: 'rgba(214, 48, 49, 0.08)',
                    color: '#D63031',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    marginBottom: '8px',
                  }}
                >
                  Hapus Diskon Aktif ({cartDiscount.name})
                </button>
              )}

              {discounts.map((disc) => {
                const isSelected = cartDiscount?.id === disc.id;
                return (
                  <div
                    key={disc.id}
                    onClick={() => handleSelectDiscount(disc)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>{disc.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {disc.type === 'percentage' ? `Potongan ${disc.value}%` : `Potongan ${formatCurrency(disc.value)}`}
                        {disc.minPurchase > 0 && ` • Min. belanja ${formatCurrency(disc.minPurchase)}`}
                      </div>
                    </div>

                    {isSelected && (
                      <div style={{ color: 'var(--primary-600)' }}>
                        <Check size={18} />
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => setIsCustom(true)}
                style={{
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '1px dashed var(--primary-500)',
                  backgroundColor: 'transparent',
                  color: 'var(--primary-600)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <Plus size={16} />
                <span>Buat Diskon Manual / Khusus</span>
              </button>
            </div>
          ) : (
            /* Custom discount form */
            <form onSubmit={handleApplyCustom} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Label Diskon
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Tipe Potongan
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setCustomType('percentage')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: customType === 'percentage' ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                      backgroundColor: customType === 'percentage' ? 'var(--primary-50)' : 'var(--bg)',
                      color: customType === 'percentage' ? 'var(--primary-700)' : 'var(--text)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Persentase (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('fixed')}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: customType === 'fixed' ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                      backgroundColor: customType === 'fixed' ? 'var(--primary-50)' : 'var(--bg)',
                      color: customType === 'fixed' ? 'var(--primary-700)' : 'var(--text)',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Nominal Rupiah (Rp)
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                  Nilai Potongan {customType === 'percentage' ? '(%)' : '(Rp)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={customValue || ''}
                  onChange={(e) => setCustomValue(Number(e.target.value) || 0)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCustom(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Terapkan Diskon
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
