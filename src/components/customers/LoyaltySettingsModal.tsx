import React, { useState, useEffect } from 'react';
import { useStore } from '../../stores/useStore';
import { LoyaltySettings, LoyaltyTier } from '../../types';
import { formatCurrency, generateId } from '../../utils/helpers';
import { DEFAULT_LOYALTY_SETTINGS } from '../../utils/loyalty';
import {
  X,
  Award,
  Coins,
  Crown,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  Sparkles,
  Percent,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Gift,
  ArrowRight,
} from 'lucide-react';

interface LoyaltySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_ICONS = ['🥉', '🥈', '🥇', '💎', '👑', '⭐', '🔥', '🎖️', '🦁', '🚀', '🌟', '🏆'];
const PRESET_COLORS = [
  '#6C5CE7', // Primary Purple
  '#CD7F32', // Bronze
  '#7F8C8D', // Silver
  '#F39C12', // Gold
  '#2980B9', // Platinum
  '#8E44AD', // Purple
  '#00B894', // Mint
  '#16A085', // Teal
  '#E17055', // Orange
  '#2C3E50', // Navy
];

export const LoyaltySettingsModal: React.FC<LoyaltySettingsModalProps> = ({ isOpen, onClose }) => {
  const { loyaltySettings, updateLoyaltySettings, addToast, customers } = useStore();

  const [activeTab, setActiveTab] = useState<'rules' | 'tiers' | 'expiry'>('rules');
  const [formData, setFormData] = useState<LoyaltySettings>(() => {
    return loyaltySettings ? { ...loyaltySettings } : { ...DEFAULT_LOYALTY_SETTINGS };
  });

  // Sub-modal for Add/Edit Tier
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [tierName, setTierName] = useState('');
  const [tierMinSpend, setTierMinSpend] = useState<number>(0);
  const [tierMultiplier, setTierMultiplier] = useState<number>(1);
  const [tierColor, setTierColor] = useState('#6C5CE7');
  const [tierIcon, setTierIcon] = useState('⭐');

  // Sync state with store on open
  useEffect(() => {
    if (isOpen) {
      setFormData(loyaltySettings ? { ...loyaltySettings } : { ...DEFAULT_LOYALTY_SETTINGS });
    }
  }, [isOpen, loyaltySettings]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (formData.spendPerPoint <= 0) {
      addToast('error', 'Nominal belanja per 1 poin harus lebih besar dari Rp 0');
      return;
    }
    if (formData.pointValueInRupiah <= 0) {
      addToast('error', 'Nilai tukar 1 poin ke rupiah harus lebih besar dari Rp 0');
      return;
    }

    updateLoyaltySettings(formData);
    addToast('success', 'Pengaturan program loyalitas & tier berhasil disimpan!');
    onClose();
  };

  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan seluruh aturan loyalitas dan tingkatan tier ke konfigurasi standar aplikasi?')) {
      setFormData({ ...DEFAULT_LOYALTY_SETTINGS });
      addToast('info', 'Pengaturan direset ke default. Klik "Simpan Pengaturan" untuk menerapkan.');
    }
  };

  const handleOpenTierEditor = (tier?: LoyaltyTier) => {
    if (tier) {
      setEditingTier(tier);
      setTierName(tier.name);
      setTierMinSpend(tier.minSpend);
      setTierMultiplier(tier.pointMultiplier);
      setTierColor(tier.badgeColor);
      setTierIcon(tier.icon);
    } else {
      setEditingTier(null);
      setTierName('');
      const highestSpend = formData.tiers.reduce((max, t) => Math.max(max, t.minSpend), 0);
      setTierMinSpend(highestSpend + 1500000);
      setTierMultiplier(2.5);
      setTierColor('#6C5CE7');
      setTierIcon('👑');
    }
    setIsTierModalOpen(true);
  };

  const handleSaveTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierName.trim()) {
      addToast('error', 'Nama tier wajib diisi');
      return;
    }

    const currentTiers = [...(formData.tiers || [])];

    if (editingTier) {
      const updatedTiers = currentTiers.map((t) =>
        t.id === editingTier.id
          ? {
              ...t,
              name: tierName.trim(),
              minSpend: Number(tierMinSpend) || 0,
              pointMultiplier: Number(tierMultiplier) || 1,
              badgeColor: tierColor,
              icon: tierIcon,
            }
          : t
      );
      updatedTiers.sort((a, b) => a.minSpend - b.minSpend);
      setFormData({ ...formData, tiers: updatedTiers });
      addToast('success', `Tingkatan "${tierName}" berhasil diperbarui`);
    } else {
      const newTier: LoyaltyTier = {
        id: `tier-${generateId()}`,
        name: tierName.trim(),
        minSpend: Number(tierMinSpend) || 0,
        pointMultiplier: Number(tierMultiplier) || 1,
        badgeColor: tierColor,
        icon: tierIcon,
      };
      const updatedTiers = [...currentTiers, newTier];
      updatedTiers.sort((a, b) => a.minSpend - b.minSpend);
      setFormData({ ...formData, tiers: updatedTiers });
      addToast('success', `Tingkatan baru "${tierName}" berhasil ditambahkan`);
    }

    setIsTierModalOpen(false);
  };

  const handleDeleteTier = (tierId: string) => {
    if (formData.tiers.length <= 1) {
      addToast('error', 'Minimal harus ada 1 tingkatan tier dalam program loyalitas!');
      return;
    }

    const target = formData.tiers.find((t) => t.id === tierId);
    if (window.confirm(`Hapus tingkatan tier "${target?.name}"?`)) {
      const updatedTiers = formData.tiers.filter((t) => t.id !== tierId);
      setFormData({ ...formData, tiers: updatedTiers });
      addToast('info', `Tier "${target?.name}" telah dihapus.`);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: '840px',
          backgroundColor: 'var(--surface)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* ── MODAL HEADER (Harmonized to App Theme) ─────────────── */}
        <div
          style={{
            padding: '20px 26px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(108, 92, 231, 0.35)',
                flexShrink: 0,
              }}
            >
              <Award size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' }}>
                  Pengaturan Program Loyalitas & Member
                </h2>
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: '12px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    backgroundColor: formData.enabled ? 'var(--primary-100)' : 'var(--bg)',
                    color: formData.enabled ? 'var(--primary-700)' : 'var(--text-muted)',
                    border: formData.enabled ? '1px solid var(--primary-200)' : '1px solid var(--border)',
                  }}
                >
                  {formData.enabled ? '● AKTIF' : '○ NONAKTIF'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Konfigurasi perolehan poin, nilai tukar diskon, level tier belanja, dan masa berlaku
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* ── SUBHEADER: TABS & PROGRAM TOGGLE ────────────────────── */}
        <div
          style={{
            padding: '12px 26px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Segmented Tab Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'var(--bg)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
            }}
          >
            <button
              onClick={() => setActiveTab('rules')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === 'rules' ? 'var(--primary-500)' : 'transparent',
                color: activeTab === 'rules' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: activeTab === 'rules' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Coins size={16} />
              <span>Aturan Poin & Diskon</span>
            </button>

            <button
              onClick={() => setActiveTab('tiers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === 'tiers' ? 'var(--primary-500)' : 'transparent',
                color: activeTab === 'tiers' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: activeTab === 'tiers' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Crown size={16} />
              <span>Tingkatan Tier ({formData.tiers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('expiry')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === 'expiry' ? 'var(--primary-500)' : 'transparent',
                color: activeTab === 'expiry' ? '#FFFFFF' : 'var(--text-secondary)',
                fontWeight: activeTab === 'expiry' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Clock size={16} />
              <span>Masa Berlaku</span>
            </button>
          </div>

          {/* Program Toggle Switch (Themed to Primary Electric Purple) */}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, enabled: !formData.enabled })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 14px',
              borderRadius: '12px',
              backgroundColor: formData.enabled ? 'var(--primary-50)' : 'var(--bg)',
              border: formData.enabled ? '1.5px solid var(--primary-400)' : '1px solid var(--border)',
              cursor: 'pointer',
              color: formData.enabled ? 'var(--primary-700)' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                backgroundColor: formData.enabled ? 'var(--primary-500)' : 'var(--border)',
                position: 'relative',
                transition: 'background-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  position: 'absolute',
                  top: '2px',
                  left: formData.enabled ? '18px' : '2px',
                  transition: 'left 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              />
            </div>
            <span>{formData.enabled ? 'Program Aktif' : 'Program Nonaktif'}</span>
          </button>
        </div>

        {/* ── TAB CONTENT BODY ────────────────────────────────────── */}
        <div style={{ padding: '24px 26px', overflowY: 'auto', flex: 1, backgroundColor: 'var(--surface)' }}>
          {/* ══════════════ TAB 1: ATURAN POIN & DISKON ══════════════ */}
          {activeTab === 'rules' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Section 1: Perolehan Poin */}
              <div
                style={{
                  padding: '20px',
                  borderRadius: '18px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                    <Coins size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text)' }}>
                      Rasio Perolehan Poin Belanja
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      Pelanggan mendapatkan 1 poin untuk setiap kelipatan nominal belanja berikut
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginTop: '14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: '520px',
                  }}
                >
                  <span
                    style={{
                      padding: '11px 16px',
                      backgroundColor: 'var(--bg)',
                      borderRight: '1px solid var(--border)',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    Setiap Belanja Rp
                  </span>

                  <input
                    type="number"
                    min={100}
                    step={500}
                    value={formData.spendPerPoint}
                    onChange={(e) => setFormData({ ...formData, spendPerPoint: Math.max(1, Number(e.target.value)) })}
                    style={{
                      flex: 1,
                      minWidth: '90px',
                      padding: '11px 14px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      outline: 'none',
                    }}
                  />

                  <span
                    style={{
                      padding: '11px 16px',
                      backgroundColor: 'var(--primary-50)',
                      color: 'var(--primary-700)',
                      borderLeft: '1px solid var(--primary-200)',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    = 1 Poin Reward
                  </span>
                </div>

                <div
                  style={{
                    marginTop: '10px',
                    fontSize: '0.76rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--primary-500)' }} />
                  <span>
                    Contoh: Belanja Rp 50.000 akan otomatis menghasilkan{' '}
                    <strong style={{ color: 'var(--text)' }}>
                      {Math.floor(50000 / (formData.spendPerPoint || 1000))} Poin dasar
                    </strong>{' '}
                    (dikalikan dengan tier member pelanggan saat transaksi).
                  </span>
                </div>
              </div>

              {/* Section 2: Penukaran Poin & Minimal Redeem (2 Kolom Harmonis) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Nilai Diskon per 1 Poin */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '18px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                        <TrendingUp size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                          Nilai Diskon per 1 Poin
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Potongan harga saat poin dicairkan kasir
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '12px',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg)',
                          borderRight: '1px solid var(--border)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        1 Poin = Rp
                      </span>

                      <input
                        type="number"
                        min={1}
                        step={10}
                        value={formData.pointValueInRupiah}
                        onChange={(e) =>
                          setFormData({ ...formData, pointValueInRupiah: Math.max(1, Number(e.target.value)) })
                        }
                        style={{
                          flex: 1,
                          minWidth: '60px',
                          padding: '10px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          fontWeight: 800,
                          outline: 'none',
                        }}
                      />

                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--primary-50)',
                          color: 'var(--primary-700)',
                          borderLeft: '1px solid var(--primary-200)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Potongan Diskon
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    💡 Tukar 100 poin = diskon <strong>{formatCurrency(100 * (formData.pointValueInRupiah || 100))}</strong>
                  </div>
                </div>

                {/* Minimal Poin Penukaran */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '18px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                        <ShieldCheck size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                          Syarat Minimal Poin
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Batas saldo poin agar kasir bisa mencairkan
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '12px',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg)',
                          borderRight: '1px solid var(--border)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Minimal
                      </span>

                      <input
                        type="number"
                        min={0}
                        step={10}
                        value={formData.minPointsToRedeem}
                        onChange={(e) =>
                          setFormData({ ...formData, minPointsToRedeem: Math.max(0, Number(e.target.value)) })
                        }
                        style={{
                          flex: 1,
                          minWidth: '60px',
                          padding: '10px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          fontWeight: 800,
                          outline: 'none',
                        }}
                      />

                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg)',
                          borderLeft: '1px solid var(--border)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Poin
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    💡 Setara diskon minimal <strong>{formatCurrency((formData.minPointsToRedeem || 0) * (formData.pointValueInRupiah || 100))}</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Maksimal Diskon & Bonus Selamat Datang (2 Kolom Harmonis) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '16px',
                }}
              >
                {/* Maksimal Diskon dari Poin (%) */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '18px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                        <Percent size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                          Batas Maksimal Diskon Poin
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Maksimal pemotongan dari subtotal tagihan
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '12px',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg)',
                          borderRight: '1px solid var(--border)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Maksimal
                      </span>

                      <input
                        type="number"
                        min={5}
                        max={100}
                        step={5}
                        value={formData.maxDiscountPercent}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDiscountPercent: Math.min(100, Math.max(1, Number(e.target.value))),
                          })
                        }
                        style={{
                          flex: 1,
                          minWidth: '60px',
                          padding: '10px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          fontWeight: 800,
                          outline: 'none',
                        }}
                      />

                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--primary-50)',
                          borderLeft: '1px solid var(--primary-200)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: 'var(--primary-700)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        % dari Tagihan
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    💡 Mencegah tagihan bernilai 0 jika pelanggan memiliki saldo poin sangat besar
                  </div>
                </div>

                {/* Bonus Member Baru (Welcome Points) */}
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '18px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
                        <Gift size={16} />
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: 'var(--text)' }}>
                          Bonus Member Baru (Welcome)
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Poin cuma-cuma saat pelanggan pertama didaftarkan
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginTop: '12px',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        backgroundColor: 'var(--surface)',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg)',
                          borderRight: '1px solid var(--border)',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Hadiah
                      </span>

                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={formData.welcomeBonusPoints}
                        onChange={(e) =>
                          setFormData({ ...formData, welcomeBonusPoints: Math.max(0, Number(e.target.value)) })
                        }
                        style={{
                          flex: 1,
                          minWidth: '60px',
                          padding: '10px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--text)',
                          fontSize: '1rem',
                          fontWeight: 800,
                          outline: 'none',
                        }}
                      />

                      <span
                        style={{
                          padding: '10px 14px',
                          backgroundColor: 'var(--primary-50)',
                          borderLeft: '1px solid var(--primary-200)',
                          color: 'var(--primary-700)',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Poin Bonus
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                    💡 Member baru langsung menerima saldo awal saat bergabung
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════ TAB 2: TINGKATAN TIER DINAMIS ══════════════ */}
          {activeTab === 'tiers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)' }}>
                    Level Tingkatan Member Toko
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Pelanggan otomatis naik level berdasarkan akumulasi belanja. Setiap tier memiliki pengali poin yang lebih tinggi!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenTierEditor()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFFFFF',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(108, 92, 231, 0.3)',
                  }}
                >
                  <Plus size={16} />
                  <span>Tambah Tier Baru</span>
                </button>
              </div>

              {/* Tiers Vertical Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formData.tiers.map((tier, idx) => {
                  const memberCount = customers.filter((c) => {
                    const sorted = [...formData.tiers].sort((a, b) => b.minSpend - a.minSpend);
                    const matched = sorted.find((t) => (c.totalSpent || 0) >= t.minSpend);
                    return matched?.id === tier.id;
                  }).length;

                  return (
                    <div
                      key={tier.id}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '16px',
                        backgroundColor: 'var(--bg)',
                        border: `1.5px solid ${tier.badgeColor}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Left: Badge & Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            backgroundColor: `${tier.badgeColor}20`,
                            border: `2px solid ${tier.badgeColor}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            flexShrink: 0,
                          }}
                        >
                          {tier.icon}
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                              {tier.name}
                            </span>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '8px',
                                backgroundColor: tier.badgeColor,
                                color: '#FFFFFF',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                              }}
                            >
                              Tier #{idx + 1}
                            </span>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              marginTop: '4px',
                              fontSize: '0.8rem',
                              color: 'var(--text-secondary)',
                            }}
                          >
                            <span>
                              Min. Belanja: <strong>{formatCurrency(tier.minSpend)}</strong>
                            </span>
                            <span>•</span>
                            <span style={{ color: tier.badgeColor, fontWeight: 800 }}>
                              Pengali: {tier.pointMultiplier}x Poin
                            </span>
                            <span>•</span>
                            <span style={{ color: 'var(--text-muted)' }}>
                              {memberCount} Pelanggan Terdaftar
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenTierEditor(tier)}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Edit3 size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTier(tier.id)}
                          disabled={formData.tiers.length <= 1}
                          style={{
                            padding: '8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(214, 48, 49, 0.2)',
                            backgroundColor: 'rgba(214, 48, 49, 0.08)',
                            color: '#D63031',
                            cursor: formData.tiers.length <= 1 ? 'not-allowed' : 'pointer',
                            opacity: formData.tiers.length <= 1 ? 0.35 : 1,
                          }}
                          title="Hapus Tier"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════ TAB 3: MASA BERLAKU & KADALUARSA ══════════════ */}
          {activeTab === 'expiry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--text)' }}>
                  Kebijakan Masa Aktif Poin
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Tentukan apakah saldo poin yang dikumpulkan pelanggan dapat hangus jika pelanggan tidak aktif berbelanja
                </p>
              </div>

              {/* 2-Column Policy Selection Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {/* Option 1: Poin Abadi */}
                <div
                  onClick={() => setFormData({ ...formData, expiryType: 'never' })}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    border: formData.expiryType === 'never' ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                    backgroundColor: formData.expiryType === 'never' ? 'var(--primary-50)' : 'var(--bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: formData.expiryType === 'never' ? 'var(--primary-100)' : 'var(--surface)',
                          color: 'var(--primary-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <ShieldCheck size={20} />
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: formData.expiryType === 'never' ? '5px solid var(--primary-500)' : '2px solid var(--border)',
                          backgroundColor: formData.expiryType === 'never' ? '#FFFFFF' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text)' }}>
                        Poin Selamanya Aktif
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--surface)',
                          color: 'var(--primary-700)',
                          border: '1px solid var(--primary-200)',
                        }}
                      >
                        Permanen
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Poin yang dikumpulkan pelanggan tersimpan permanen dan tidak akan pernah hangus, kapanpun pelanggan kembali berbelanja.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ✓ Paling disukai pelanggan
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      • Bebas komplain
                    </span>
                  </div>
                </div>

                {/* Option 2: Rolling Expiry */}
                <div
                  onClick={() => setFormData({ ...formData, expiryType: 'period_months' })}
                  style={{
                    padding: '18px 20px',
                    borderRadius: '16px',
                    border: formData.expiryType === 'period_months' ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                    backgroundColor: formData.expiryType === 'period_months' ? 'var(--primary-50)' : 'var(--bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '10px',
                          backgroundColor: formData.expiryType === 'period_months' ? 'var(--primary-100)' : 'var(--surface)',
                          color: 'var(--primary-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Clock size={20} />
                      </div>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: formData.expiryType === 'period_months' ? '5px solid var(--primary-500)' : '2px solid var(--border)',
                          backgroundColor: formData.expiryType === 'period_months' ? '#FFFFFF' : 'transparent',
                          transition: 'all 0.15s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text)' }}>
                        Kadaluarsa Bergulir
                      </span>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor: 'var(--surface)',
                          color: 'var(--primary-700)',
                          border: '1px solid var(--primary-200)',
                        }}
                      >
                        Rolling Expiry
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                      Poin diperpanjang otomatis setiap ada belanja baru. Hangus jika pelanggan pasif selama periode bulan tertentu.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px dashed var(--border)' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      ✓ Pacu repeat order kasir
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      • Proteksi liabilitas
                    </span>
                  </div>
                </div>
              </div>

              {/* Rolling Expiry Configuration Details */}
              {formData.expiryType === 'period_months' ? (
                <div
                  style={{
                    padding: '20px 22px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface)',
                    border: '1.5px solid var(--primary-200)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text)' }}>
                        Batas Waktu Pasif Pelanggan
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Poin dinyatakan hangus jika tidak ada transaksi baru selama periode ini
                      </div>
                    </div>

                    {/* Precision Input Addon */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        backgroundColor: 'var(--bg)',
                        overflow: 'hidden',
                      }}
                    >
                      <span
                        style={{
                          padding: '9px 14px',
                          backgroundColor: 'var(--surface)',
                          borderRight: '1px solid var(--border)',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Hangus jika pasif:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={formData.expiryMonths}
                        onChange={(e) =>
                          setFormData({ ...formData, expiryMonths: Math.max(1, Number(e.target.value)) })
                        }
                        style={{
                          width: '60px',
                          padding: '9px 10px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: 'var(--primary-600)',
                          fontSize: '0.98rem',
                          fontWeight: 800,
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                      <span
                        style={{
                          padding: '9px 14px',
                          backgroundColor: 'var(--primary-50)',
                          borderLeft: '1px solid var(--primary-200)',
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          color: 'var(--primary-700)',
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        Bulan
                      </span>
                    </div>
                  </div>

                  {/* Preset Quick Select Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '4px' }}>
                      Pilihan Standar:
                    </span>
                    {[3, 6, 12, 24].map((months) => {
                      const isSelected = formData.expiryMonths === months;
                      return (
                        <button
                          key={months}
                          type="button"
                          onClick={() => setFormData({ ...formData, expiryMonths: months })}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '10px',
                            border: isSelected ? '1.5px solid var(--primary-500)' : '1px solid var(--border)',
                            backgroundColor: isSelected ? 'var(--primary-500)' : 'var(--bg)',
                            color: isSelected ? '#FFFFFF' : 'var(--text)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {months} Bulan {months === 6 ? '(Standar)' : months === 12 ? '(1 Tahun)' : months === 24 ? '(2 Tahun)' : ''}
                        </button>
                      );
                    })}
                  </div>

                  {/* Visual 3-Step Principle Workflow */}
                  <div style={{ paddingTop: '14px', borderTop: '1px dashed var(--border)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                      Cara Kerja Kadaluarsa Bergulir (Rolling Principle)
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-100)',
                              color: 'var(--primary-700)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            1
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)' }}>
                            Belanja di Kasir
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Pelanggan berbelanja dan saldo poin otomatis bertambah ke akun.
                        </p>
                      </div>

                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-100)',
                              color: 'var(--primary-700)',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            2
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text)' }}>
                            Timer {formData.expiryMonths} Bulan
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                          Masa aktif berjalan selama {formData.expiryMonths} bulan sejak belanja terakhir.
                        </p>
                      </div>

                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--primary-50)',
                          border: '1px solid var(--primary-200)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--primary-500)',
                              color: '#FFFFFF',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            3
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                            Reset Otomatis
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text)', lineHeight: 1.4 }}>
                          Tiap belanja lagi, <strong>seluruh poin</strong> diperpanjang {formData.expiryMonths} bulan ke depan!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--primary-100)',
                      color: 'var(--primary-600)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheck size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text)' }}>
                      Status Kebijakan: Saldo Poin Pelanggan Aktif Selamanya
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.45 }}>
                      Semua poin yang dikumpulkan pelanggan aman dan tidak akan pernah hangus oleh sistem. Pelanggan bebas menukarkan poin mereka kapan saja di kasir tanpa batas waktu kedaluwarsa.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MODAL FOOTER ────────────────────────────────────────── */}
        <div
          style={{
            padding: '16px 26px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            type="button"
            onClick={handleResetToDefault}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Default</span>
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '0.86rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--primary-500)',
                color: '#FFFFFF',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(108, 92, 231, 0.35)',
              }}
            >
              <Check size={16} />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SUB-MODAL: TAMBAH / EDIT TINGKATAN TIER ───────────────── */}
      {isTierModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(8px)',
            zIndex: 1400,
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
              borderRadius: '22px',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Sub-modal Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg)',
              }}
            >
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                {editingTier ? `Edit Tingkatan: ${editingTier.name}` : 'Tambah Tingkatan Tier Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTierModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTier} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Live Preview Card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: `${tierColor}15`,
                  border: `2px solid ${tierColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <div style={{ fontSize: '2.2rem' }}>{tierIcon}</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
                    {tierName || 'Nama Tingkatan...'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: tierColor, fontWeight: 800, marginTop: '2px' }}>
                    Pengali: {tierMultiplier}x Poin • Minimal Belanja: {formatCurrency(tierMinSpend)}
                  </div>
                </div>
              </div>

              {/* Field 1: Nama Tier */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Nama Tingkatan (Tier) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Diamond, VIP, Sultan..."
                  value={tierName}
                  onChange={(e) => setTierName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Field 2: Minimal Belanja */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Minimal Akumulasi Belanja (Rp) *
                </label>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  required
                  value={tierMinSpend}
                  onChange={(e) => setTierMinSpend(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Field 3: Pengali Multiplier */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Pengali Poin (Multiplier):
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 1.25, 1.5, 2, 2.5, 3].map((val) => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => setTierMultiplier(val)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        borderRadius: '8px',
                        border: tierMultiplier === val ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                        backgroundColor: tierMultiplier === val ? 'var(--primary-100)' : 'var(--bg)',
                        color: tierMultiplier === val ? 'var(--primary-700)' : 'var(--text)',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 4: Emoji Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Pilih Emoji / Simbol Badge:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_ICONS.map((ico) => (
                    <button
                      type="button"
                      key={ico}
                      onClick={() => setTierIcon(ico)}
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '9px',
                        border: tierIcon === ico ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                        backgroundColor: tierIcon === ico ? 'var(--primary-100)' : 'var(--bg)',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {ico}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 5: Color Picker */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Pilih Warna Badge:
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_COLORS.map((clr) => (
                    <button
                      type="button"
                      key={clr}
                      onClick={() => setTierColor(clr)}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: clr,
                        border: tierColor === clr ? '3px solid #FFFFFF' : 'none',
                        boxShadow: tierColor === clr ? '0 0 0 2px var(--primary-500)' : 'none',
                        cursor: 'pointer',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsTierModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
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
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Simpan Tingkatan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
