import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { BusinessType } from '../types';
import {
  Sparkles,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Layers,
  Percent,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import logoImg from '../assets/logo.png';

export const SetupWizard: React.FC = () => {
  const { completeSetup, addToast } = useStore();

  const [step, setStep] = useState<number>(1);

  // Form states
  const [businessName, setBusinessName] = useState('Warung Rasa Nusantara');
  const [businessAddress, setBusinessAddress] = useState('Jl. Merdeka No. 88, Jakarta Pusat');
  const [businessPhone, setBusinessPhone] = useState('0812-3456-7890');
  const [businessType, setBusinessType] = useState<BusinessType>('fnb');

  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxName, setTaxName] = useState('PPN');
  const [taxRate, setTaxRate] = useState(11);

  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);
  const [serviceChargeName, setServiceChargeName] = useState('Service Charge');
  const [serviceChargeRate, setServiceChargeRate] = useState(5);

  const [ownerName, setOwnerName] = useState('Owner Toko');
  const [ownerPin, setOwnerPin] = useState('1234');

  const handleFinish = () => {
    completeSetup({
      businessName,
      businessAddress,
      businessPhone,
      businessType,
      taxEnabled,
      taxName,
      taxRate,
      serviceChargeEnabled,
      serviceChargeName,
      serviceChargeRate,
      ownerName,
      ownerPin,
    });
    addToast('success', `Selamat datang di C-POS, ${ownerName}! Sistem siap digunakan.`);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          backgroundColor: 'var(--surface)',
          borderRadius: '28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.12)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Top Progress bar */}
        <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border)' }}>
          <div
            style={{
              height: '100%',
              width: `${(step / 4) * 100}%`,
              backgroundColor: 'var(--primary-500)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Header */}
        <div style={{ padding: '28px 36px 16px 36px', textAlign: 'center' }}>
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '20px',
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              padding: '0',
            }}
          >
            <img
              src={logoImg}
              alt="C-POS Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 16px rgba(0, 184, 148, 0.3))',
              }}
            />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text)', margin: 0 }}>
            Selamat Datang di C-POS
          </h1>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '6px 0 0 0' }}>
            Aplikasi Point of Sale Desktop Modern, Cepat & 100% Siap Offline
          </p>
        </div>

        {/* Step Content */}
        <div style={{ padding: '16px 36px 32px 36px', flex: 1 }}>
          {/* STEP 1: Store info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Langkah 1: Informasi Toko / Usaha
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Detail ini akan tercetak pada kop struk nota belanja pelanggan
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nama Toko / Resto *
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Contoh: Kopi Nusantara"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="Jl. Thamrin No. 10, Jakarta"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="0812-3456-7890"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Business Type */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Langkah 2: Pilih Jenis Usaha
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Kami akan menyesuaikan fitur POS dengan alur operasional Anda
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  {
                    type: 'fnb',
                    title: 'Food & Beverage (F&B)',
                    desc: 'Kafe, Restoran, Coffee Shop, Warung Makan',
                    icon: UtensilsCrossed,
                    tags: ['Dine-In / Takeaway', 'Modifier Add-on', 'Cetak Pesanan Dapur'],
                  },
                  {
                    type: 'retail',
                    title: 'Retail & Toko Kelontong',
                    desc: 'Minimarket, Toko Baju, Apotek, Petshop',
                    icon: ShoppingBag,
                    tags: ['Barcode Scanner', 'SKU Tracking', 'Alarm Stok Menipis'],
                  },
                  {
                    type: 'hybrid',
                    title: 'Hybrid (F&B + Retail)',
                    desc: 'Bakery + Minuman, Kafe + Merchandise, Toko + Barista',
                    icon: Layers,
                    tags: ['Dine-In & Meja', 'Barcode Retail', 'Semua Fitur Aktif'],
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSel = businessType === item.type;
                  return (
                    <div
                      key={item.type}
                      onClick={() => setBusinessType(item.type as BusinessType)}
                      style={{
                        padding: '16px',
                        borderRadius: '16px',
                        border: isSel ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                        backgroundColor: isSel ? 'var(--primary-50)' : 'var(--bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: isSel ? 'var(--primary-500)' : 'var(--surface)',
                          color: isSel ? '#FFF' : 'var(--primary-600)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={22} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {item.desc}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                          {item.tags.map((tg, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.68rem',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                fontWeight: 600,
                              }}
                            >
                              {tg}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: isSel ? '6px solid var(--primary-500)' : '2px solid var(--border)',
                          backgroundColor: '#FFF',
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Tax Settings */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Langkah 3: Pengaturan Pajak & Biaya
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Aktifkan jika harga produk belum termasuk PPN atau biaya layanan
                </p>
              </div>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Pajak Pertambahan Nilai (PPN 11%)</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Dihitung otomatis pada subtotal nota
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={taxEnabled}
                    onChange={(e) => setTaxEnabled(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)' }}
                  />
                </div>

                {taxEnabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Label Pajak</label>
                      <input
                        type="text"
                        value={taxName}
                        onChange={(e) => setTaxName(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarif (%)</label>
                      <input
                        type="number"
                        value={taxRate}
                        onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {businessType !== 'retail' && (
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'var(--bg)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Biaya Layanan (Service Charge)</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Umum digunakan pada restoran dan kafe
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={serviceChargeEnabled}
                      onChange={(e) => setServiceChargeEnabled(e.target.checked)}
                      style={{ width: '20px', height: '20px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                    />
                  </div>

                  {serviceChargeEnabled && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nama Biaya Layanan</label>
                        <input
                          type="text"
                          value={serviceChargeName}
                          onChange={(e) => setServiceChargeName(e.target.value)}
                          placeholder="Contoh: Service Charge"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tarif (%)</label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={serviceChargeRate}
                          onChange={(e) => setServiceChargeRate(Number(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            color: 'var(--text)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Owner Account */}
          {step === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                  Langkah 4: Akun Pemilik & PIN Keamanan
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  PIN ini digunakan untuk membuka laporan, void transaksi, dan pengaturan toko
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Nama Pemilik / Admin Utama *
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  PIN Rahasia (4 Digit Angka) *
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={ownerPin}
                  onChange={(e) => setOwnerPin(e.target.value)}
                  placeholder="1234"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '1.4rem',
                    fontWeight: 800,
                    letterSpacing: '8px',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(0, 184, 148, 0.12)',
                  color: '#009B7D',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  lineHeight: 1.4,
                }}
              >
                <ShieldCheck size={20} style={{ flexShrink: 0 }} />
                <span>
                  Akun kasir dan manajer staf lainnya dapat Anda tambahkan kapan saja melalui menu Pengaturan.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div
          style={{
            padding: '20px 36px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 18px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} />
              <span>Sebelumnya</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: 'var(--primary-500)',
                color: '#FFF',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(108, 92, 231, 0.3)',
              }}
            >
              <span>Lanjutkan</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#00B894',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 184, 148, 0.35)',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Selesai & Buka Kasir</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
