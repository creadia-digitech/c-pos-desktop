// ── Business Types ──────────────────────────────────────
export type BusinessType = 'fnb' | 'retail' | 'hybrid';
export type UserRole = 'owner' | 'manager' | 'cashier';
export type OrderType = 'dine_in' | 'takeaway';
export type PaymentMethod = 'cash' | 'debit' | 'credit' | 'qris' | 'transfer';
export type TransactionStatus = 'completed' | 'voided' | 'held' | 'refunded';
export type ShiftStatus = 'open' | 'closed';
export type StockMovementType = 'in' | 'out' | 'adjustment' | 'sale' | 'return';
export type ThemeMode = 'light' | 'dark';
export type Language = 'id' | 'en';

// ── Database Models ─────────────────────────────────────
export interface BusinessProfile {
  id: number;
  name: string;
  address: string;
  phone: string;
  logoPath: string;
  taxId: string;
  taxName: string;
  taxRate: number;
  serviceChargeName: string;
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  businessType: BusinessType;
  outletId: string;
  outletName: string;
  setupCompleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  sku: string;
  barcode: string;
  imagePath: string;
  imageEmoji: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  trackStock: boolean;
  isActive: boolean;
  stock: number;
  lowStockAlert: number;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  priceAdjustment: number;
  sku: string;
  isActive: boolean;
}

export interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  maxSelect: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  price: number;
}

export interface LoyaltyTier {
  id: string;
  name: string;
  minSpend: number;
  pointMultiplier: number;
  badgeColor: string;
  icon: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  spendPerPoint: number;
  pointValueInRupiah: number;
  minPointsToRedeem: number;
  maxDiscountPercent: number;
  welcomeBonusPoints: number;
  expiryType: 'never' | 'period_months';
  expiryMonths: number;
  tiers: LoyaltyTier[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  totalSpent: number;
  totalVisits: number;
  loyaltyPoints: number;
  lastVisit: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: UserRole;
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  modifiers: SelectedModifier[];
  notes: string;
  total: number;
}

export interface SelectedModifier {
  groupName: string;
  optionName: string;
  price: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  employeeId: string;
  employeeName: string;
  customerId?: string;
  customerName?: string;
  outletId: string;
  items: TransactionItem[];
  subtotal: number;
  discountAmount: number;
  discountLabel: string;
  taxAmount: number;
  serviceChargeAmount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  changeAmount: number;
  status: TransactionStatus;
  orderType?: OrderType;
  tableId?: string;
  pointsRedeemed?: number;
  pointsDiscountAmount?: number;
  pointsEarned?: number;
  notes: string;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  modifiers: SelectedModifier[];
  notes: string;
}

export interface Shift {
  id: string;
  employeeId: string;
  employeeName: string;
  openingCash: number;
  closingCash: number;
  expectedCash: number;
  cashDifference: number;
  totalTransactions: number;
  totalRevenue: number;
  openedAt: string;
  closedAt?: string;
  status: ShiftStatus;
}

export interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase: number;
  isActive: boolean;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  sortOrder: number;
  currentOrderId?: string;
}

export interface HeldTransaction {
  id: string;
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  orderType?: OrderType;
  tableId?: string;
  tableName?: string;
  discountId?: string;
  notes: string;
  heldAt: string;
  employeeId: string;
}

// ── App State Types ─────────────────────────────────────
export interface AppSettings {
  theme: ThemeMode;
  language: Language;
  businessProfile: BusinessProfile;
  printerEnabled: boolean;
  printerType: 'usb' | 'bluetooth' | 'network';
  printerPaperSize: '58mm' | '80mm';
  autoPrint: boolean;
  soundEnabled: boolean;
}

export interface DashboardStats {
  todayRevenue: number;
  todayTransactions: number;
  todayItemsSold: number;
  todayAvgTransaction: number;
  yesterdayRevenue: number;
  weeklyRevenue: number[];
  topProducts: { name: string; qty: number; revenue: number }[];
  paymentBreakdown: { method: string; total: number; count: number }[];
}

export type AuditAction =
  | 'void_transaction'
  | 'price_change'
  | 'stock_adjustment'
  | 'pin_change'
  | 'drawer_opened'
  | 'database_reset'
  | 'export_backup'
  | 'settings_change';

export interface AuditLog {
  id: string;
  timestamp: string;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRole;
  action: AuditAction;
  details: string;
  authorizedBy?: string;
}

