import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../stores/useStore';
import { Customer } from '../../types';
import { generateId, formatCurrency } from '../../utils/helpers';
import { getCustomerTier, getEffectiveCustomerPoints, isCustomerPointsExpired } from '../../utils/loyalty';
import { Users, Search, Plus, X, Phone, Star, Check, UserPlus } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({ isOpen, onClose }) => {
  const { customers, addCustomer, setSelectedCustomer, selectedCustomer, loyaltySettings, addToast } = useStore();

  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Auto focus field when switching to add mode
  useEffect(() => {
    if (isAdding) {
      if (newPhone && !newName) {
        nameInputRef.current?.focus();
      } else if (newName && !newPhone) {
        phoneInputRef.current?.focus();
      } else {
        nameInputRef.current?.focus();
      }
    }
  }, [isAdding, newPhone, newName]);

  if (!isOpen) return null;

  const cleanSearch = search.trim();
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(cleanSearch.toLowerCase()) ||
      c.phone.includes(cleanSearch)
  );

  const isNumericPhone = /^(\+?\d[\d\s-]{3,})$/.test(cleanSearch) || (/^\d+$/.test(cleanSearch) && cleanSearch.length >= 4);

  const openAddFormWithSearch = () => {
    if (isNumericPhone) {
      setNewPhone(cleanSearch);
      setNewName('');
    } else {
      setNewName(cleanSearch);
      setNewPhone('');
    }
    setIsAdding(true);
  };

  const handleSelect = (cust: Customer) => {
    setSelectedCustomer(cust);
    addToast('success', `Pelanggan ${cust.name} dipilih`);
    setSearch('');
    onClose();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCustomers.length === 1) {
        handleSelect(filteredCustomers[0]);
      } else if (filteredCustomers.length === 0 && cleanSearch) {
        openAddFormWithSearch();
      }
    }
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const welcomePoints = loyaltySettings?.enabled ? (loyaltySettings.welcomeBonusPoints || 0) : 0;
    const newCust: Customer = {
      id: generateId(),
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      address: '',
      totalSpent: 0,
      totalVisits: 0,
      loyaltyPoints: welcomePoints,
      lastVisit: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    addCustomer(newCust);
    setSelectedCustomer(newCust);
    addToast('success', `Pelanggan baru ${newName} (${newPhone || 'tanpa HP'}) berhasil didaftarkan!`);
    setIsAdding(false);
    setNewName('');
    setNewPhone('');
    setNewEmail('');
    setSearch('');
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
          maxWidth: '520px',
          backgroundColor: 'var(--surface)',
          borderRadius: '20px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
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
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-600)' }}>
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text)' }}>
                {isAdding ? 'Daftar Pelanggan Baru' : 'Pilih Pelanggan'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {isAdding ? 'Data nomor telepon otomatis terisi dari pencarian' : 'Hubungkan nota dengan akun member & poin loyalitas'}
              </p>
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
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          {!isAdding ? (
            <>
              {/* Search & Add New Button */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Search size={16} style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Cari nama atau nomor HP..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    autoFocus
                    style={{
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text)',
                      fontSize: '0.88rem',
                      outline: 'none',
                      width: '100%',
                    }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <button
                  onClick={openAddFormWithSearch}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 8px rgba(108, 92, 231, 0.3)',
                  }}
                >
                  <Plus size={16} />
                  <span>Tambah Baru</span>
                </button>
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredCustomers.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '30px 20px',
                      backgroundColor: 'var(--bg)',
                      borderRadius: '16px',
                      border: '1px dashed var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                      {cleanSearch ? (
                        <>
                          Nomor / Nama <strong>"{cleanSearch}"</strong> belum ada di database.
                        </>
                      ) : (
                        'Belum ada data pelanggan yang terdaftar.'
                      )}
                    </div>

                    {cleanSearch && (
                      <button
                        onClick={openAddFormWithSearch}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 20px',
                          borderRadius: '12px',
                          backgroundColor: 'var(--primary-500)',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          border: 'none',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(108, 92, 231, 0.35)',
                        }}
                      >
                        <UserPlus size={16} />
                        <span>Daftarkan Langsung dengan "{cleanSearch}"</span>
                      </button>
                    )}
                  </div>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    const tier = getCustomerTier(cust, loyaltySettings);
                    const isExpired = isCustomerPointsExpired(cust, loyaltySettings);
                    const points = getEffectiveCustomerPoints(cust, loyaltySettings);

                    return (
                      <div
                        key={cust.id}
                        onClick={() => handleSelect(cust)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text)' }}>{cust.name}</span>
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: '6px',
                                backgroundColor: `${tier.badgeColor}20`,
                                color: tier.badgeColor,
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                border: `1px solid ${tier.badgeColor}40`,
                              }}
                            >
                              {tier.icon} {tier.name} ({tier.pointMultiplier}x)
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {cust.phone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Phone size={12} /> {cust.phone}
                              </span>
                            )}
                            {isExpired ? (
                              <span style={{ color: '#D63031', fontWeight: 600, fontSize: '0.72rem' }}>
                                ⚠️ Poin Kadaluarsa
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#D97706', fontWeight: 700 }}>
                                <Star size={12} fill="#D97706" /> {points} Poin (≈ {formatCurrency(points * (loyaltySettings?.pointValueInRupiah || 100))})
                              </span>
                            )}
                          </div>
                        </div>

                        {isSelected && (
                          <div style={{ color: 'var(--primary-600)', display: 'flex', alignItems: 'center' }}>
                            <Check size={18} />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            /* ADD NEW CUSTOMER FORM WITH PREFILLED VALUES */
            <form onSubmit={handleAddNew} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Nama Lengkap Pelanggan *
                </label>
                <input
                  ref={nameInputRef}
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                  Nomor WhatsApp / HP
                  {newPhone && cleanSearch && (
                    <span style={{ fontSize: '0.72rem', color: '#00B894', fontWeight: 600, marginLeft: '6px' }}>
                      (Otomatis terisi dari pencarian ✓)
                    </span>
                  )}
                </label>
                <input
                  ref={phoneInputRef}
                  type="tel"
                  placeholder="081234567890"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.92rem',
                    outline: 'none',
                    fontWeight: newPhone ? 700 : 400,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Alamat Email (Opsional)
                </label>
                <input
                  type="email"
                  placeholder="budi@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
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
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: 'var(--primary-500)',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
                  }}
                >
                  Simpan & Pilih Pelanggan
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
