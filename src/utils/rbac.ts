import { UserRole } from '../types';

export interface PagePermissionConfig {
  id: string;
  label: string;
  allowedRoles: UserRole[];
  requiredRoleLabel: string;
  description: string;
}

export const PAGE_PERMISSIONS: Record<string, PagePermissionConfig> = {
  pos: {
    id: 'pos',
    label: 'Kasir & Penjualan (POS)',
    allowedRoles: ['cashier', 'manager', 'owner'],
    requiredRoleLabel: 'Kasir, Manager, atau Owner',
    description: 'Operasional transaksi kasir harian',
  },
  transactions: {
    id: 'transactions',
    label: 'Riwayat Transaksi',
    allowedRoles: ['cashier', 'manager', 'owner'],
    requiredRoleLabel: 'Kasir, Manager, atau Owner',
    description: 'Pemeriksaan riwayat struk penjualan dan cetak ulang',
  },
  shifts: {
    id: 'shifts',
    label: 'Manajemen Shift & Kas',
    allowedRoles: ['cashier', 'manager', 'owner'],
    requiredRoleLabel: 'Kasir, Manager, atau Owner',
    description: 'Buka/tutup shift kasir dan rekap kas harian',
  },
  customers: {
    id: 'customers',
    label: 'Data Pelanggan & Member',
    allowedRoles: ['cashier', 'manager', 'owner'],
    requiredRoleLabel: 'Kasir, Manager, atau Owner',
    description: 'Pendaftaran member loyalitas dan pencarian pelanggan',
  },
  products: {
    id: 'products',
    label: 'Katalog Produk & Harga',
    allowedRoles: ['manager', 'owner'],
    requiredRoleLabel: 'MANAGER atau OWNER',
    description: 'Pengubahan harga jual, stok barang, barcode, dan katalog produk',
  },
  reports: {
    id: 'reports',
    label: 'Laporan Keuangan & Omset',
    allowedRoles: ['manager', 'owner'],
    requiredRoleLabel: 'MANAGER atau OWNER',
    description: 'Laporan pendapatan, laba kotor, dan ringkasan keuangan toko',
  },
  settings: {
    id: 'settings',
    label: 'Pengaturan Sistem & Toko',
    allowedRoles: ['owner'],
    requiredRoleLabel: 'OWNER (Pemilik Toko)',
    description: 'Pengaturan profil toko, pajak, akun staf, printer, dan database',
  },
};

/**
 * Checks if a given role has permission to access a specific page.
 * Temporary authorizations in `authorizedPages` are also honored.
 */
export const hasPageAccess = (
  role: UserRole | undefined,
  pageId: string,
  authorizedPages: string[] = []
): boolean => {
  if (!role) return false;
  if (role === 'owner') return true;
  if (authorizedPages.includes(pageId)) return true;

  const config = PAGE_PERMISSIONS[pageId];
  if (!config) return true;
  return config.allowedRoles.includes(role);
};
