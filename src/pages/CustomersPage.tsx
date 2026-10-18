import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { Customer } from '../types';
import { formatCurrency, formatDate, generateId } from '../utils/helpers';
import {
  getCustomerTier,
  getNextTier,
  isCustomerPointsExpired,
  getPointsExpiryDate,
  getEffectiveCustomerPoints,
} from '../utils/loyalty';
import { LoyaltySettingsModal } from '../components/customers/LoyaltySettingsModal';
import {
  Users,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  Calendar,
  X,
  FileSpreadsheet,
  Award,
  Crown,
  Settings,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingUp,
  CreditCard,
  Edit2,
  Trash2,
  ExternalLink,
  MessageCircle,
  Filter,
  Check,
  ChevronRight,
  Info,
  Coins,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const {
    customers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    loyaltySettings,
    addToast,
  } = useStore();

  const [search, setSearch] = useState('');
  const [selectedTierFilter, setSelectedTierFilter] = useState<string>('all');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    customers.length > 0 ? customers[0].id : null
  );

  // Modals
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formManualPoints, setFormManualPoints] = useState<number>(0);

  // Ensure selected customer exists
  const activeCustomer =
    customers.find((c) => c.id === selectedCustomerId) || (customers.length > 0 ? customers[0] : null);

  // Filtering
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (selectedTierFilter !== 'all') {
      const tier = getCustomerTier(c, loyaltySettings);
      return tier.id === selectedTierFilter;
    }

    return true;
  });

  // Aggregate Stats
  const totalPointsInCirculation = customers.reduce(
    (sum, c) => sum + getEffectiveCustomerPoints(c, loyaltySettings),
    0
  );
  const pointValue = loyaltySettings?.pointValueInRupiah || 100;
  const totalRupiahValueOfPoints = totalPointsInCirculation * pointValue;
  const totalSpentAll = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgSpent = customers.length > 0 ? Math.round(totalSpentAll / customers.length) : 0;

  // Open Add / Edit Modal
  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormManualPoints(loyaltySettings?.enabled ? loyaltySettings.welcomeBonusPoints || 10 : 0);
    setIsCustomerModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormName(customer.name);
    setFormPhone(customer.phone || '');
    setFormEmail(customer.email || '');
    setFormAddress(customer.address || '');
    setFormManualPoints(customer.loyaltyPoints || 0);
    setIsCustomerModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingCustomer) {
      const updated: Customer = {
        ...editingCustomer,
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        loyaltyPoints: Math.max(0, Number(formManualPoints) || 0),
      };
      updateCustomer(updated);
      addToast('success', `Data member ${updated.name} berhasil diperbarui!`);
    } else {
      const initialPoints = Math.max(0, Number(formManualPoints) || 0);
      const newCust: Customer = {
        id: generateId(),
        name: formName.trim(),
        phone: formPhone.trim(),
        email: formEmail.trim(),
        address: formAddress.trim(),
        totalSpent: 0,
        totalVisits: 0,
        loyaltyPoints: initialPoints,
        lastVisit: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      addCustomer(newCust);
      setSelectedCustomerId(newCust.id);
      addToast('success', `Member baru ${newCust.name} berhasil didaftarkan! (+${initialPoints} poin)`);
    }

    setIsCustomerModalOpen(false);
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (window.confirm(`Hapus data pelanggan "${customer.name}"? Riwayat poin akan terhapus permanen.`)) {
      deleteCustomer(customer.id);
      addToast('info', `Member ${customer.name} telah dihapus.`);
    }
  };

  // WhatsApp helper
  const handleOpenWhatsApp = (phone: string, name: string) => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    if (!clean.startsWith('62')) clean = '62' + clean;
    const msg = encodeURIComponent(`Halo Kak ${name}, terima kasih telah menjadi member setia kami!`);
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

  return (
    <div
      style={{
        padding: '22px 26px',
        height: '100%',
        overflowY: 'auto',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
      }}
    >
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
              Database Pelanggan & Member
            </h1>
            <span
              style={{
                padding: '3px 10px',
                borderRadius: '16px',
                backgroundColor: loyaltySettings?.enabled ? 'var(--primary-50)' : 'var(--bg)',
                color: loyaltySettings?.enabled ? 'var(--primary-700)' : 'var(--text-muted)',
                border: loyaltySettings?.enabled ? '1px solid var(--primary-200)' : '1px solid var(--border)',
                fontSize: '0.74rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: loyaltySettings?.enabled ? 'var(--primary-500)' : 'var(--text-muted)',
                }}
              />
              {loyaltySettings?.enabled ? 'Program Loyalitas Aktif' : 'Program Nonaktif'}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Riwayat belanja, tingkat member VIP, perolehan koin kasir, dan kartu digital pelanggan
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* PENGATURAN LOYALITAS BUTTON */}
          <button
            onClick={() => setIsLoyaltyModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '12px',
              border: '1px solid var(--primary-200)',
              backgroundColor: 'var(--primary-50)',
              color: 'var(--primary-700)',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Buka Pengaturan Aturan Poin, Tier, dan Kadaluarsa"
          >
            <Crown size={16} style={{ color: 'var(--primary-600)' }} />
            <span>Pengaturan Loyalitas</span>
            <Settings size={13} style={{ opacity: 0.75 }} />
          </button>

          <button
            onClick={() => addToast('info', 'Data member berhasil diekspor!')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 14px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileSpreadsheet size={16} style={{ color: 'var(--text-secondary)' }} />
            <span>Export</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-500)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.86rem',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(108, 92, 231, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={18} />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Metric Summary Cards (Unified to Theme) ─────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card 1: Total Pelanggan */}
        <div
          style={{
            padding: '16px 18px',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Member
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: '2px' }}>
              {customers.length} Pelanggan
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
              Basis data member aktif
            </div>
          </div>
        </div>

        {/* Card 2: Total Poin Beredar */}
        <div
          style={{
            padding: '16px 18px',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Coins size={22} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Poin Aktif Beredar
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: '2px' }}>
              {totalPointsInCirculation.toLocaleString('id-ID')} <span style={{ fontSize: '0.9rem', color: 'var(--primary-600)', fontWeight: 800 }}>Poin</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
              Setara diskon {formatCurrency(totalRupiahValueOfPoints)}
            </div>
          </div>
        </div>

        {/* Card 3: Total Akumulasi Belanja */}
        <div
          style={{
            padding: '16px 18px',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <TrendingUp size={22} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Akumulasi Belanja
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: '2px' }}>
              {formatCurrency(totalSpentAll)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Rata-rata: {formatCurrency(avgSpent)} / orang
            </div>
          </div>
        </div>

        {/* Card 4: Aturan Poin & Tier */}
        <div
          style={{
            padding: '16px 18px',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Crown size={22} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Aturan Loyalitas
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.2, marginTop: '2px' }}>
              Rp {(loyaltySettings?.spendPerPoint || 1000).toLocaleString('id-ID')} = 1 Poin
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
              1 Poin = Rp {pointValue} • {loyaltySettings?.tiers?.length || 4} Tier
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Layout: Master-Detail Split Grid ─────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: activeCustomer ? '1fr 340px' : '1fr',
          gap: '18px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Controls & Customer Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Filter & Search Bar Card */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                flex: '1 1 240px',
                maxWidth: '340px',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Cari nama, WhatsApp, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--text)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  width: '100%',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Segmented Tier Filter Tabs */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '4px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                flexWrap: 'wrap',
              }}
            >
              <button
                onClick={() => setSelectedTierFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: selectedTierFilter === 'all' ? 'var(--primary-500)' : 'transparent',
                  color: selectedTierFilter === 'all' ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: selectedTierFilter === 'all' ? 800 : 600,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: selectedTierFilter === 'all' ? '0 2px 6px rgba(108, 92, 231, 0.25)' : 'none',
                }}
              >
                Semua ({customers.length})
              </button>

              {loyaltySettings?.tiers?.map((t) => {
                const count = customers.filter((c) => getCustomerTier(c, loyaltySettings).id === t.id).length;
                const isSelected = selectedTierFilter === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTierFilter(t.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: isSelected ? 'var(--primary-500)' : 'transparent',
                      color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 2px 6px rgba(108, 92, 231, 0.25)' : 'none',
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.name}</span>
                    <span style={{ opacity: 0.8, fontSize: '0.72rem' }}>({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Table Card */}
          <div
            style={{
              backgroundColor: 'var(--surface)',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                <thead>
                  <tr
                    style={{
                      backgroundColor: 'var(--bg)',
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    <th style={{ padding: '13px 18px', fontWeight: 700 }}>Pelanggan</th>
                    <th style={{ padding: '13px 16px', fontWeight: 700 }}>Tier Level</th>
                    <th style={{ padding: '13px 16px', fontWeight: 700 }}>Kontak</th>
                    <th style={{ padding: '13px 16px', fontWeight: 700, textAlign: 'right' }}>Total Belanja</th>
                    <th style={{ padding: '13px 16px', fontWeight: 700, textAlign: 'center' }}>Saldo Poin</th>
                    <th style={{ padding: '13px 18px', fontWeight: 700, textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <Users size={32} style={{ opacity: 0.3 }} />
                          <div style={{ fontWeight: 600 }}>Tidak ada data pelanggan yang cocok.</div>
                          <div style={{ fontSize: '0.78rem' }}>Coba ubah kata kunci pencarian atau filter tier.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const tier = getCustomerTier(c, loyaltySettings);
                      const isExpired = isCustomerPointsExpired(c, loyaltySettings);
                      const effectivePoints = getEffectiveCustomerPoints(c, loyaltySettings);
                      const pointsValue = effectivePoints * pointValue;
                      const isSelected = activeCustomer?.id === c.id;

                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCustomerId(c.id)}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            backgroundColor: isSelected ? 'var(--primary-50)' : 'transparent',
                            boxShadow: isSelected ? 'inset 3px 0 0 var(--primary-500)' : 'none',
                            cursor: 'pointer',
                            transition: 'background-color 0.12s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg)';
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          {/* Name & Avatar */}
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '12px',
                                  backgroundColor: 'var(--primary-100)',
                                  color: 'var(--primary-700)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 800,
                                  fontSize: '0.92rem',
                                  flexShrink: 0,
                                }}
                              >
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.88rem' }}>
                                  {c.name}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  ID: {c.id.slice(0, 8)} • {c.totalVisits || 0}x Kunjungan
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Tier Badge */}
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '3px 9px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--surface)',
                                color: 'var(--text)',
                                fontWeight: 700,
                                fontSize: '0.76rem',
                                border: '1px solid var(--border)',
                              }}
                            >
                              <span>{tier.icon}</span>
                              <span style={{ fontWeight: 800 }}>{tier.name}</span>
                              <span style={{ color: 'var(--primary-600)', fontWeight: 800, fontSize: '0.7rem' }}>
                                ({tier.pointMultiplier}x)
                              </span>
                            </span>
                          </td>

                          {/* Contact */}
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text)', fontWeight: 600 }}>
                              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                              <span>{c.phone || '—'}</span>
                            </div>
                            {c.email && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Mail size={11} /> {c.email}
                              </div>
                            )}
                          </td>

                          {/* Total Spent */}
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '0.88rem' }}>
                              {formatCurrency(c.totalSpent || 0)}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              Terakhir: {formatDate(c.lastVisit, 'short')}
                            </div>
                          </td>

                          {/* Points */}
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            {isExpired ? (
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: 'rgba(214, 48, 49, 0.12)',
                                  color: '#D63031',
                                  fontWeight: 700,
                                  fontSize: '0.72rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <AlertTriangle size={11} /> Kadaluarsa
                              </span>
                            ) : (
                              <div>
                                <span
                                  style={{
                                    padding: '3px 9px',
                                    borderRadius: '8px',
                                    backgroundColor: 'var(--primary-50)',
                                    color: 'var(--primary-700)',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    border: '1px solid var(--primary-200)',
                                  }}
                                >
                                  <Coins size={12} style={{ color: 'var(--primary-600)' }} /> {effectivePoints} Poin
                                </span>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '2px' }}>
                                  ≈ {formatCurrency(pointsValue)}
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Action */}
                          <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(c);
                                }}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--text)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Edit Pelanggan"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCustomer(c);
                                }}
                                style={{
                                  padding: '6px 8px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border)',
                                  backgroundColor: 'var(--surface)',
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                title="Hapus Member"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Count */}
            <div
              style={{
                padding: '12px 18px',
                borderTop: '1px solid var(--border)',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
              }}
            >
              <span>
                Menampilkan <strong>{filteredCustomers.length}</strong> dari <strong>{customers.length}</strong> pelanggan
              </span>
              <span>Klik pada baris pelanggan untuk melihat kartu profil VIP & detail loyalitas.</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Customer VIP Member Card & Details */}
        {activeCustomer && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              position: 'sticky',
              top: '0',
            }}
          >
            {/* 1. VIP DIGITAL MEMBERSHIP CARD WIDGET */}
            {(() => {
              const tier = getCustomerTier(activeCustomer, loyaltySettings);
              const nextTierInfo = getNextTier(activeCustomer, loyaltySettings);
              const isExpired = isCustomerPointsExpired(activeCustomer, loyaltySettings);
              const expiryDate = getPointsExpiryDate(activeCustomer, loyaltySettings);
              const points = getEffectiveCustomerPoints(activeCustomer, loyaltySettings);
              const pointsVal = points * pointValue;

              return (
                <div
                  style={{
                    backgroundColor: 'var(--surface)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Digital VIP Card Header (Themed Deep Electric Obsidian) */}
                  <div
                    style={{
                      padding: '20px 18px',
                      background: 'linear-gradient(135deg, #2D1B69 0%, #1A1235 55%, #110B22 100%)',
                      color: '#FFFFFF',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15)',
                    }}
                  >
                    {/* Background Light Accent Circles */}
                    <div
                      style={{
                        position: 'absolute',
                        right: '-20px',
                        top: '-20px',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(108, 92, 231, 0.25)',
                        filter: 'blur(20px)',
                        pointerEvents: 'none',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '1.2px', opacity: 0.8, color: '#E0DCFE' }}>
                          C-POS VIP MEMBER
                        </div>
                        <div style={{ fontSize: '1.15rem', fontWeight: 900, marginTop: '2px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                          {activeCustomer.name}
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          backgroundColor: 'rgba(255,255,255,0.14)',
                          backdropFilter: 'blur(8px)',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: '1px solid rgba(255,255,255,0.25)',
                        }}
                      >
                        <span>{tier.icon}</span>
                        <span>{tier.name.toUpperCase()}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '0.64rem', opacity: 0.7, color: '#E0DCFE' }}>MEMBER ID / TELEPON</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>
                          {activeCustomer.phone || `CUST-${activeCustomer.id.slice(0, 8)}`}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.64rem', opacity: 0.7, color: '#E0DCFE' }}>PENGALI REWARD</div>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.15)',
                            display: 'inline-block',
                            marginTop: '2px',
                          }}
                        >
                          {tier.pointMultiplier}x Poin
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Points Balance Row */}
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '14px',
                        backgroundColor: 'var(--bg)',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          SALDO POIN AKTIF
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                          <Coins size={18} style={{ color: 'var(--primary-600)' }} />
                          <span>{points} Poin</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          NILAI DISKON KASIR
                        </div>
                        <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-600)', marginTop: '2px' }}>
                          {formatCurrency(pointsVal)}
                        </div>
                      </div>
                    </div>

                    {/* Next Tier Progression */}
                    {nextTierInfo ? (
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--primary-50)',
                          border: '1px solid var(--primary-200)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                            Menuju {nextTierInfo.nextTier.name} {nextTierInfo.nextTier.icon}
                          </span>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                            +{formatCurrency(nextTierInfo.remainingSpend)}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {(() => {
                          const currentSpend = activeCustomer.totalSpent || 0;
                          const progress = Math.min(100, Math.round((currentSpend / nextTierInfo.nextTier.minSpend) * 100));
                          return (
                            <div style={{ width: '100%', height: '7px', borderRadius: '4px', backgroundColor: 'var(--surface)', overflow: 'hidden', border: '1px solid var(--primary-200)' }}>
                              <div
                                style={{
                                  width: `${progress}%`,
                                  height: '100%',
                                  backgroundColor: 'var(--primary-500)',
                                  borderRadius: '4px',
                                  transition: 'width 0.3s ease',
                                }}
                              />
                            </div>
                          );
                        })()}

                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                          Belanja <strong>{formatCurrency(nextTierInfo.remainingSpend)}</strong> lagi untuk unlock pengali {nextTierInfo.nextTier.pointMultiplier}x poin!
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--primary-50)',
                          border: '1px solid var(--primary-200)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.75rem',
                          color: 'var(--primary-700)',
                          fontWeight: 700,
                        }}
                      >
                        <Award size={16} style={{ color: 'var(--primary-600)' }} />
                        <span>Member telah mencapai tingkatan tertinggi ({tier.name} {tier.icon})!</span>
                      </div>
                    )}

                    {/* Expiry Warning or info */}
                    {isExpired ? (
                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(214, 48, 49, 0.1)',
                          border: '1px solid rgba(214, 48, 49, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.75rem',
                          color: '#D63031',
                          fontWeight: 600,
                        }}
                      >
                        <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                        <span>Poin kadaluarsa karena tidak belanja selama {loyaltySettings?.expiryMonths} bulan.</span>
                      </div>
                    ) : expiryDate ? (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={12} style={{ color: 'var(--primary-600)' }} />
                        <span>Masa berlaku poin s/d <strong>{formatDate(expiryDate.toISOString(), 'short')}</strong></span>
                      </div>
                    ) : null}

                    {/* Contact details */}
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Total Kunjungan:</span>
                        <strong style={{ color: 'var(--text)' }}>{activeCustomer.totalVisits || 0} kali</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Total Akumulasi:</span>
                        <strong style={{ color: 'var(--text)' }}>{formatCurrency(activeCustomer.totalSpent || 0)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                        <span>Kunjungan Terakhir:</span>
                        <span style={{ color: 'var(--text)' }}>{formatDate(activeCustomer.lastVisit, 'short')}</span>
                      </div>
                      {activeCustomer.address && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                          <span>Alamat:</span>
                          <span style={{ color: 'var(--text)', textAlign: 'right', maxWidth: '180px' }}>{activeCustomer.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Fast Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      {activeCustomer.phone && (
                        <button
                          onClick={() => handleOpenWhatsApp(activeCustomer.phone, activeCustomer.name)}
                          style={{
                            flex: 1,
                            padding: '9px',
                            borderRadius: '10px',
                            border: '1px solid rgba(37, 211, 102, 0.35)',
                            backgroundColor: 'rgba(37, 211, 102, 0.1)',
                            color: '#128C7E',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <MessageCircle size={15} />
                          <span>WhatsApp</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenEditModal(activeCustomer)}
                        style={{
                          flex: 1,
                          padding: '9px',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Edit2 size={14} />
                        <span>Edit Data</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Modal Tambah / Edit Pelanggan ─────────────────────────── */}
      {isCustomerModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
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
              borderRadius: '20px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                {editingCustomer ? `Edit Member: ${editingCustomer.name}` : 'Daftar Member Pelanggan Baru'}
              </h3>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rina Anggraini"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  Nomor Telepon / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="081234567890"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="rina@example.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
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
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Alamat Domisili
                </label>
                <input
                  type="text"
                  placeholder="Jl. Merdeka No. 45"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
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

              {/* Points Adjustment / Welcome Points */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '4px' }}>
                  {editingCustomer ? 'Saldo Poin Loyalitas (Koreksi Manual)' : 'Bonus Poin Selamat Datang'}
                </label>
                <input
                  type="number"
                  min={0}
                  value={formManualPoints}
                  onChange={(e) => setFormManualPoints(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid var(--primary-200)',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-700)',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
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
                    padding: '12px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {editingCustomer ? 'Simpan Perubahan' : 'Daftarkan Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Pengaturan Loyalitas ────────────────────────────── */}
      <LoyaltySettingsModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
      />
    </div>
  );
};
