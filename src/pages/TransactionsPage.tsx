import React, { useState } from 'react';
import { useStore } from '../stores/useStore';
import { Transaction } from '../types';
import { formatCurrency, formatDate, formatTime } from '../utils/helpers';
import { generateThermalReceiptHtml, printViaIsolatedIframe } from '../utils/printer';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  Ban,
  CheckCircle2,
  XCircle,
  Eye,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    voidTransaction,
    addToast,
    businessName,
    businessAddress,
    businessPhone,
    transactionsPageSize,
    setTransactionsPageSize,
    employees,
    currentEmployee,
  } = useStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = transactionsPageSize || 8;
  const setPageSize = setTransactionsPageSize;

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      (tx.customerName && tx.customerName.toLowerCase().includes(search.toLowerCase())) ||
      tx.employeeName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Math
  const totalItems = filteredTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (safePage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (safePage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const [voidTargetTx, setVoidTargetTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState<string>('Pelanggan Batal Beli');
  const [voidCustomReason, setVoidCustomReason] = useState<string>('');
  const [voidSupervisorPin, setVoidSupervisorPin] = useState<string>('');
  const [voidPinError, setVoidPinError] = useState<string>('');

  const handleOpenVoidModal = (tx: Transaction) => {
    setVoidTargetTx(tx);
    setVoidReason('Pelanggan Batal Beli');
    setVoidCustomReason('');
    setVoidSupervisorPin('');
    setVoidPinError('');
  };

  const authorizedSupervisor = employees.find(
    (e) => e.isActive && (e.role === 'owner' || e.role === 'manager') && e.pin === voidSupervisorPin
  );

  const handleExecuteVoid = () => {
    if (!voidTargetTx) return;
    const finalReason = voidReason === 'Lainnya' ? voidCustomReason.trim() : voidReason;
    if (!finalReason) {
      addToast('error', 'Alasan pembatalan transaksi wajib diisi!');
      return;
    }
    if (!authorizedSupervisor) {
      setVoidPinError('PIN Supervisor / Manager tidak valid!');
      return;
    }

    voidTransaction(voidTargetTx.id, finalReason, authorizedSupervisor.name);
    addToast('warning', `Transaksi #${voidTargetTx.receiptNumber} dibatalkan oleh ${authorizedSupervisor.name}. Stok telah dikembalikan.`);
    setVoidTargetTx(null);
    setSelectedTx(null);
  };

  const handlePrint = (tx: Transaction) => {
    addToast('success', `Mencetak ulang struk #${tx.receiptNumber}`);
    const html = generateThermalReceiptHtml(tx, {
      businessName,
      businessAddress,
      businessPhone,
      paperWidth: '58mm',
    });
    printViaIsolatedIframe(html);
  };

  return (
    <div
      style={{
        padding: '20px 24px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg)',
        overflow: 'hidden',
      }}
    >
      {/* Page Title & Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          flexShrink: 0,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
            Riwayat Transaksi Penjualan
          </h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Daftar lengkap seluruh transaksi offline lokal kasir
          </p>
        </div>

        <button
          onClick={() => addToast('info', 'Data transaksi berhasil diexport ke CSV/Excel lokal')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 15px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <FileSpreadsheet size={16} />
          <span>Export Excel</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '14px',
          backgroundColor: 'var(--surface)',
          padding: '10px 14px',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '7px 12px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari nomor nota, nama kasir, atau pelanggan..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              border: 'none',
              backgroundColor: 'transparent',
              color: 'var(--text)',
              fontSize: '0.85rem',
              outline: 'none',
              width: '100%',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'completed', 'voided'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: statusFilter === status ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                backgroundColor: statusFilter === status ? 'var(--primary-50)' : 'var(--bg)',
                color: statusFilter === status ? 'var(--primary-700)' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {status === 'all' ? 'Semua Status' : status === 'completed' ? 'Selesai' : 'Void / Batal'}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container with Embedded Pagination */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        {/* Scrollable Table Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
              <tr style={{ backgroundColor: 'var(--bg)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>No. Struk</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Waktu</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Kasir</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Pelanggan</th>
                <th style={{ padding: '11px 16px', fontWeight: 600 }}>Metode</th>
                <th style={{ padding: '11px 16px', fontWeight: 600, textAlign: 'right' }}>Total</th>
                <th style={{ padding: '11px 16px', fontWeight: 600, textAlign: 'center' }}>Status</th>
                <th style={{ padding: '11px 16px', fontWeight: 600, textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Tidak ada transaksi yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: 'var(--text)' }}>
                      #{tx.receiptNumber}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>
                      {formatDate(tx.createdAt, 'short')} {formatTime(tx.createdAt)}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text)' }}>
                      {tx.employeeName}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>
                      {tx.customerName || '— Umum —'}
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '16px',
                          backgroundColor: 'var(--bg)',
                          border: '1px solid var(--border)',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-600)' }}>
                      {formatCurrency(tx.total)}
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '16px',
                          fontSize: '0.73rem',
                          fontWeight: 700,
                          backgroundColor: tx.status === 'completed' ? 'rgba(0, 184, 148, 0.12)' : 'rgba(214, 48, 49, 0.12)',
                          color: tx.status === 'completed' ? '#009B7D' : '#D63031',
                        }}
                      >
                        {tx.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                        <button
                          onClick={() => setSelectedTx(tx)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '7px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            cursor: 'pointer',
                            color: 'var(--text)',
                          }}
                          title="Lihat Detail"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => handlePrint(tx)}
                          style={{
                            padding: '5px 8px',
                            borderRadius: '7px',
                            border: '1px solid var(--border)',
                            backgroundColor: 'var(--surface)',
                            cursor: 'pointer',
                            color: 'var(--text)',
                          }}
                          title="Cetak Struk"
                        >
                          <Printer size={14} />
                        </button>

                        {tx.status === 'completed' && (
                          <button
                            onClick={() => handleOpenVoidModal(tx)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '7px',
                              border: '1px solid #D63031',
                              backgroundColor: 'rgba(214, 48, 49, 0.08)',
                              color: '#D63031',
                              cursor: 'pointer',
                            }}
                            title="Batalkan (Void)"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Embedded Pagination Footer (Always Visible at bottom of table) */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 18px',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          {/* Info & Rows per page */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span>
              Menampilkan <strong>{totalItems === 0 ? 0 : startIndex + 1}</strong> -{' '}
              <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> dari <strong>{totalItems}</strong> transaksi
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{
                  padding: '3px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  color: 'var(--text)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value={8}>8 (Pas Layar)</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage <= 1 ? 'transparent' : 'var(--bg)',
                color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.4 : 1,
              }}
              title="Halaman Pertama"
            >
              <ChevronsLeft size={16} />
            </button>

            <button
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage <= 1 ? 'transparent' : 'var(--bg)',
                color: safePage <= 1 ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
                opacity: safePage <= 1 ? 0.4 : 1,
              }}
              title="Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} style={{ padding: '0 6px', color: 'var(--text-muted)' }}>
                    ...
                  </span>
                );
              }
              const isCurrent = p === safePage;
              return (
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(p as number)}
                  style={{
                    minWidth: '30px',
                    height: '30px',
                    padding: '0 6px',
                    borderRadius: '8px',
                    border: isCurrent ? 'none' : '1px solid var(--border)',
                    backgroundColor: isCurrent ? 'var(--primary-500)' : 'var(--bg)',
                    color: isCurrent ? '#FFFFFF' : 'var(--text)',
                    fontWeight: isCurrent ? 800 : 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: isCurrent ? '0 2px 6px rgba(108, 92, 231, 0.3)' : 'none',
                  }}
                >
                  {p}
                </button>
              );
            })}

            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage >= totalPages ? 'transparent' : 'var(--bg)',
                color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: safePage >= totalPages ? 0.4 : 1,
              }}
              title="Berikutnya"
            >
              <ChevronRight size={16} />
            </button>

            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage(totalPages)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: safePage >= totalPages ? 'transparent' : 'var(--bg)',
                color: safePage >= totalPages ? 'var(--text-muted)' : 'var(--text)',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
                opacity: safePage >= totalPages ? 0.4 : 1,
              }}
              title="Halaman Terakhir"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Slideout / Modal */}
      {selectedTx && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
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
              border: '1px solid var(--border)',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Detail Struk #{selectedTx.receiptNumber}</h3>
              <button
                onClick={() => setSelectedTx(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Waktu:</span>
                <span>{formatDate(selectedTx.createdAt, 'long')} {formatTime(selectedTx.createdAt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kasir:</span>
                <span>{selectedTx.employeeName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pelanggan:</span>
                <span>{selectedTx.customerName || 'Umum'}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginBottom: '16px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '8px' }}>Rincian Item:</div>
              {selectedTx.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px' }}>
                  <span>{it.quantity}x {it.productName}</span>
                  <span style={{ fontWeight: 600 }}>{formatCurrency(it.total)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedTx.subtotal)}</span>
              </div>
              {selectedTx.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00B894' }}>
                  <span>Diskon:</span>
                  <span>-{formatCurrency(selectedTx.discountAmount)}</span>
                </div>
              )}
              {selectedTx.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>PPN:</span>
                  <span>{formatCurrency(selectedTx.taxAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', marginTop: '6px' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--primary-600)' }}>{formatCurrency(selectedTx.total)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => handlePrint(selectedTx)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Printer size={15} /> Cetak
              </button>

              {selectedTx.status === 'completed' && (
                <button
                  onClick={() => handleOpenVoidModal(selectedTx)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #D63031',
                    backgroundColor: 'rgba(214, 48, 49, 0.08)',
                    color: '#D63031',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                  title="Batalkan Transaksi (VOID)"
                >
                  <Ban size={15} /> VOID
                </button>
              )}

              <button
                onClick={() => setSelectedTx(null)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: 'var(--primary-500)',
                  color: '#FFF',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Otorisasi VOID Transaksi Anti-Fraud ── */}
      {voidTargetTx && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setVoidTargetTx(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              backgroundColor: 'var(--surface)',
              borderRadius: '22px',
              border: '1px solid var(--border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.45)',
              overflow: 'hidden',
            }}
          >
            {/* Top Red Security Accent Line */}
            <div style={{ height: '4px', width: '100%', background: 'linear-gradient(90deg, #DC2626 0%, #EF4444 60%, #F87171 100%)' }} />

            {/* Header */}
            <div
              style={{
                padding: '20px 22px 16px 22px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)' }}>
                    Otorisasi VOID Transaksi
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Pembatalan nota & pengembalian stok barang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setVoidTargetTx(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '1.1rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Receipt Info Card */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text)' }}>
                    Struk #{voidTargetTx.receiptNumber}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Kasir: {voidTargetTx.employeeName} • {formatDate(voidTargetTx.createdAt, 'short')} {formatTime(voidTargetTx.createdAt)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#EF4444' }}>
                    {formatCurrency(voidTargetTx.total)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    {voidTargetTx.items.length} jenis item
                  </div>
                </div>
              </div>

              {/* Security Warning Notice */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.75rem',
                  color: '#DC2626',
                  lineHeight: 1.4,
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Perlindungan Anti-Fraud:</strong> Stok seluruh item produk akan otomatis dikembalikan ke katalog dan tercatat permanen di <strong>Audit Log</strong> dengan nama Supervisor yang menyetujui.
                </div>
              </div>

              {/* Step 1: Alasan Pembatalan */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                  1. Alasan Pembatalan (Wajib):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px', marginBottom: '8px' }}>
                  {[
                    'Pelanggan Batal Beli',
                    'Salah Input Menu / Jumlah',
                    'Double Input Transaksi',
                    'Lainnya',
                  ].map((r) => {
                    const isSelected = voidReason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVoidReason(r)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border)',
                          backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg)',
                          color: isSelected ? 'var(--primary-700)' : 'var(--text-secondary)',
                          fontSize: '0.76rem',
                          fontWeight: isSelected ? 800 : 600,
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.12s ease',
                        }}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>

                {voidReason === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Tuliskan alasan rinci pembatalan transaksi..."
                    value={voidCustomReason}
                    onChange={(e) => setVoidCustomReason(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '0.82rem',
                      outline: 'none',
                    }}
                  />
                )}
              </div>

              {/* Step 2: Otorisasi PIN Supervisor / Manager */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text)' }}>
                    2. PIN Supervisor / Manager / Owner:
                  </label>
                  {authorizedSupervisor && (
                    <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Disetujui: {authorizedSupervisor.name} ({authorizedSupervisor.role.toUpperCase()})
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    maxLength={6}
                    placeholder="Ketik 4-6 angka PIN Supervisor..."
                    value={voidSupervisorPin}
                    onChange={(e) => {
                      setVoidSupervisorPin(e.target.value.replace(/\D/g, ''));
                      setVoidPinError('');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '10px',
                      border: authorizedSupervisor
                        ? '2px solid #10B981'
                        : voidPinError
                        ? '2px solid #EF4444'
                        : '1px solid var(--border)',
                      backgroundColor: 'var(--bg)',
                      color: 'var(--text)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      letterSpacing: '4px',
                      outline: 'none',
                    }}
                  />
                  <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--text-muted)' }} />
                </div>

                {voidPinError && (
                  <div style={{ color: '#EF4444', fontSize: '0.73rem', fontWeight: 700, marginTop: '4px' }}>
                    {voidPinError}
                  </div>
                )}
                {!authorizedSupervisor && voidSupervisorPin.length >= 4 && (
                  <div style={{ color: '#EF4444', fontSize: '0.73rem', fontWeight: 700, marginTop: '4px' }}>
                    PIN tidak cocok dengan akun Manager atau Owner aktif.
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setVoidTargetTx(null)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecuteVoid}
                  disabled={!authorizedSupervisor || (voidReason === 'Lainnya' && !voidCustomReason.trim())}
                  style={{
                    flex: 1.6,
                    padding: '11px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: authorizedSupervisor ? '#EF4444' : 'var(--border)',
                    color: authorizedSupervisor ? '#FFF' : 'var(--text-muted)',
                    fontSize: '0.84rem',
                    fontWeight: 800,
                    cursor: authorizedSupervisor ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: authorizedSupervisor ? '0 4px 14px rgba(239, 68, 68, 0.35)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Ban size={15} />
                  <span>Eksekusi VOID & Balikkan Stok</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
