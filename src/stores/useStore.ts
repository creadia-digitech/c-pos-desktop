import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  BusinessType, ThemeMode, Language, Employee, Product, Category,
  CartItem, Customer, Transaction, Shift, HeldTransaction,
  Discount, Table, SelectedModifier, TransactionStatus, PaymentMethod,
  LoyaltySettings, LoyaltyTier, AuditLog, AuditAction,
} from '../types';
import { generateId, generateReceiptNumber, formatCurrency } from '../utils/helpers';
import { setLanguage } from '../utils/i18n';
import { DEFAULT_LOYALTY_SETTINGS, calculatePointsEarned, isCustomerPointsExpired } from '../utils/loyalty';
import { TrialStatus, evaluateTrialStatus } from '../utils/license';

// ── Sample Data ─────────────────────────────────────────
const SAMPLE_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Makanan', color: '#E17055', icon: '🍚', sortOrder: 0, isActive: true },
  { id: 'cat-2', name: 'Minuman', color: '#0984E3', icon: '🥤', sortOrder: 1, isActive: true },
  { id: 'cat-3', name: 'Snack', color: '#FDCB6E', icon: '🍪', sortOrder: 2, isActive: true },
  { id: 'cat-4', name: 'Paket', color: '#6C5CE7', icon: '🎁', sortOrder: 3, isActive: true },
  { id: 'cat-5', name: 'Dessert', color: '#FD79A8', icon: '🍰', sortOrder: 4, isActive: true },
];

const SAMPLE_PRODUCTS: Product[] = [
  { id: 'p1', categoryId: 'cat-1', name: 'Nasi Goreng Spesial', sku: 'NG001', barcode: '8991001000018', imagePath: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍚', costPrice: 12000, sellPrice: 25000, unit: 'porsi', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p2', categoryId: 'cat-1', name: 'Ayam Bakar Madu', sku: 'AB001', barcode: '8991001000025', imagePath: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍗', costPrice: 18000, sellPrice: 35000, unit: 'porsi', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p3', categoryId: 'cat-1', name: 'Mie Goreng Jawa', sku: 'MG001', barcode: '8991001000032', imagePath: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍜', costPrice: 10000, sellPrice: 20000, unit: 'porsi', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p4', categoryId: 'cat-1', name: 'Sate Ayam Madura', sku: 'SA001', barcode: '8991001000049', imagePath: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍢', costPrice: 15000, sellPrice: 28000, unit: 'porsi', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p5', categoryId: 'cat-1', name: 'Soto Ayam Lamongan', sku: 'SO001', barcode: '8991001000056', imagePath: 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍲', costPrice: 10000, sellPrice: 22000, unit: 'porsi', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p6', categoryId: 'cat-1', name: 'Gado-Gado Komplit', sku: 'GG001', barcode: '8991001000063', imagePath: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80', imageEmoji: '🥗', costPrice: 8000, sellPrice: 18000, unit: 'porsi', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p7', categoryId: 'cat-2', name: 'Es Teh Manis', sku: 'ET001', barcode: '8991001000070', imagePath: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80', imageEmoji: '🧊', costPrice: 2000, sellPrice: 6000, unit: 'gelas', trackStock: false, isActive: true, stock: 999, lowStockAlert: 20, createdAt: new Date().toISOString() },
  { id: 'p8', categoryId: 'cat-2', name: 'Kopi Susu Gula Aren', sku: 'KS001', barcode: '8991001000087', imagePath: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=400&auto=format&fit=crop&q=80', imageEmoji: '☕', costPrice: 5000, sellPrice: 15000, unit: 'gelas', trackStock: false, isActive: true, stock: 999, lowStockAlert: 20, createdAt: new Date().toISOString() },
  { id: 'p9', categoryId: 'cat-2', name: 'Jus Alpukat Kocok', sku: 'JA001', barcode: '8991001000094', imagePath: 'https://images.unsplash.com/photo-1638176066666-ffb2f5d0d644?w=400&auto=format&fit=crop&q=80', imageEmoji: '🥑', costPrice: 6000, sellPrice: 18000, unit: 'gelas', trackStock: false, isActive: true, stock: 999, lowStockAlert: 20, createdAt: new Date().toISOString() },
  { id: 'p10', categoryId: 'cat-2', name: 'Es Jeruk Peras', sku: 'EJ001', barcode: '8991001000100', imagePath: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍊', costPrice: 3000, sellPrice: 8000, unit: 'gelas', trackStock: false, isActive: true, stock: 999, lowStockAlert: 20, createdAt: new Date().toISOString() },
  { id: 'p11', categoryId: 'cat-2', name: 'Milkshake Coklat', sku: 'MC001', barcode: '8991001000117', imagePath: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&auto=format&fit=crop&q=80', imageEmoji: '🥤', costPrice: 7000, sellPrice: 20000, unit: 'gelas', trackStock: false, isActive: true, stock: 999, lowStockAlert: 20, createdAt: new Date().toISOString() },
  { id: 'p12', categoryId: 'cat-2', name: 'Teh Tarik Klasik', sku: 'TT001', barcode: '8991001000124', imagePath: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80', imageEmoji: '🫖', costPrice: 4000, sellPrice: 12000, unit: 'gelas', trackStock: false, isActive: true, stock: 999, lowStockAlert: 20, createdAt: new Date().toISOString() },
  { id: 'p13', categoryId: 'cat-3', name: 'Kentang Goreng', sku: 'KG001', barcode: '8991001000131', imagePath: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍟', costPrice: 6000, sellPrice: 15000, unit: 'porsi', trackStock: true, isActive: true, stock: 50, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p14', categoryId: 'cat-3', name: 'Pisang Goreng Keju', sku: 'PG001', barcode: '8991001000148', imagePath: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍌', costPrice: 4000, sellPrice: 10000, unit: 'porsi', trackStock: true, isActive: true, stock: 30, lowStockAlert: 5, createdAt: new Date().toISOString() },
  { id: 'p15', categoryId: 'cat-3', name: 'Tahu Crispy Pedas', sku: 'TC001', barcode: '8991001000155', imagePath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80', imageEmoji: '🧈', costPrice: 3000, sellPrice: 8000, unit: 'porsi', trackStock: true, isActive: true, stock: 40, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p16', categoryId: 'cat-4', name: 'Paket Hemat Kenyang', sku: 'PH001', barcode: '8991001000162', imagePath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80', imageEmoji: '🎁', costPrice: 18000, sellPrice: 35000, unit: 'paket', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p17', categoryId: 'cat-4', name: 'Paket Barbeque Spesial', sku: 'PH002', barcode: '8991001000179', imagePath: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80', imageEmoji: '📦', costPrice: 22000, sellPrice: 45000, unit: 'paket', trackStock: false, isActive: true, stock: 999, lowStockAlert: 10, createdAt: new Date().toISOString() },
  { id: 'p18', categoryId: 'cat-5', name: 'Es Krim Vanilla Choco', sku: 'EK001', barcode: '8991001000186', imagePath: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍦', costPrice: 5000, sellPrice: 12000, unit: 'cup', trackStock: true, isActive: true, stock: 25, lowStockAlert: 5, createdAt: new Date().toISOString() },
  { id: 'p19', categoryId: 'cat-5', name: 'Brownies Fudgy Coklat', sku: 'BR001', barcode: '8991001000193', imagePath: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍫', costPrice: 8000, sellPrice: 18000, unit: 'potong', trackStock: true, isActive: true, stock: 15, lowStockAlert: 3, createdAt: new Date().toISOString() },
  { id: 'p20', categoryId: 'cat-5', name: 'Pudding Karamel Silky', sku: 'PD001', barcode: '8991001000209', imagePath: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80', imageEmoji: '🍮', costPrice: 4000, sellPrice: 10000, unit: 'cup', trackStock: true, isActive: true, stock: 20, lowStockAlert: 5, createdAt: new Date().toISOString() },
];

// ── App Store ───────────────────────────────────────────
interface AppState {
  // ─ App Meta
  setupCompleted: boolean;
  theme: ThemeMode;
  language: Language;
  businessType: BusinessType;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeName: string;
  serviceChargeRate: number;
  sidebarExpanded: boolean;

  // ─ Auth
  currentEmployee: Employee | null;
  employees: Employee[];

  // ─ Shift
  currentShift: Shift | null;

  // ─ Products
  categories: Category[];
  products: Product[];
  
  // ─ Cart
  cart: CartItem[];
  selectedCustomer: Customer | null;
  orderType: 'dine_in' | 'takeaway';
  selectedTable: Table | null;
  cartDiscount: Discount | null;

  // ─ Held
  heldTransactions: HeldTransaction[];

  // ─ Transactions
  transactions: Transaction[];

  // ─ Customers
  customers: Customer[];

  // ─ Discounts
  discounts: Discount[];

  // ─ UI State
  currentPage: string;
  productsPageSize: number;
  transactionsPageSize: number;
  printerType: 'usb' | 'bluetooth' | 'network';
  selectedPrinter: string;
  paperWidth: '58mm' | '80mm';
  autoSilentPrint: boolean;
  bluetoothDeviceName: string;
  networkPrinterIp: string;
  networkPrinterPort: number;
  loyaltySettings: LoyaltySettings;
  redeemedPoints: number;
  showPaymentModal: boolean;
  showShiftModal: boolean;
  showSuccessModal: boolean;
  lastTransaction: Transaction | null;
  toasts: { id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string }[];
  auditLogs: AuditLog[];
  isScreenLocked: boolean;
  authorizedPages: string[];
  isTrial: boolean;
  trialStatus: TrialStatus | null;
  setTrialStatus: (status: TrialStatus | null) => void;
  setIsTrial: (isTrial: boolean) => void;

  // ─ Actions: Setup
  completeSetup: (data: {
    businessName: string;
    businessAddress: string;
    businessPhone: string;
    businessType: BusinessType;
    taxEnabled: boolean;
    taxName: string;
    taxRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeName: string;
    serviceChargeRate: number;
    ownerName: string;
    ownerPin: string;
  }) => void;

  // ─ Actions: Theme & Language
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setLang: (lang: Language) => void;
  toggleSidebar: () => void;

  // ─ Actions: Auth
  login: (employee: Employee) => void;
  logout: () => void;

  // ─ Actions: Shift
  openShift: (openingCash: number) => void;
  closeShift: (closingCash: number) => void;

  // ─ Actions: Cart
  addToCart: (product: Product, modifiers?: SelectedModifier[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQty: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setOrderType: (type: 'dine_in' | 'takeaway') => void;
  setCartDiscount: (discount: Discount | null) => void;

  // ─ Actions: Hold
  holdCurrentTransaction: () => void;
  resumeHeldTransaction: (id: string) => void;

  // ─ Actions: Payment
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  completeTransaction: (paymentMethod: PaymentMethod, paymentAmount: number) => void;

  // ─ Actions: Navigation
  setCurrentPage: (page: string) => void;

  // ─ Actions: Toast
  addToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  removeToast: (id: string) => void;

  // ─ Actions: Products
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  updateProductsBatch: (products: Product[]) => void;
  deleteProduct: (id: string) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;

  // ─ Actions: Customers
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;

  // ─ Actions: Employees
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;
  resetEmployeePin: (id: string, newPin: string) => void;

  // ─ Actions: Transactions
  voidTransaction: (id: string, reason?: string, supervisorName?: string) => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  lockScreen: () => void;
  unlockScreen: (pin: string) => boolean;
  authorizePage: (pageId: string) => void;
  revokeAuthorizedPages: () => void;

  // ─ Computed helpers
  getCartSubtotal: () => number;
  getCartDiscount: () => number;
  getPointsDiscount: () => number;
  getCartTax: () => number;
  getCartServiceCharge: () => number;
  getCartTotal: () => number;

  // ─ Loyalty Actions
  updateLoyaltySettings: (settings: Partial<LoyaltySettings>) => void;
  addLoyaltyTier: (tier: LoyaltyTier) => void;
  updateLoyaltyTier: (tier: LoyaltyTier) => void;
  deleteLoyaltyTier: (tierId: string) => void;
  setRedeemedPoints: (points: number) => void;

  // ─ Misc
  resetSetupWizard: () => void;
  resetDatabasePreserveAccounts: () => void;
  closeSuccessModal: () => void;
  openShiftModal: () => void;
  closeShiftModal: () => void;
  setProductsPageSize: (size: number) => void;
  setTransactionsPageSize: (size: number) => void;
  setSelectedPrinter: (printer: string) => void;
  setAutoSilentPrint: (val: boolean) => void;
  setPrinterSettings: (settings: {
    printerType?: 'usb' | 'bluetooth' | 'network';
    selectedPrinter?: string;
    paperWidth?: '58mm' | '80mm';
    autoSilentPrint?: boolean;
    bluetoothDeviceName?: string;
    networkPrinterIp?: string;
    networkPrinterPort?: number;
  }) => void;
}

const DEFAULT_EMPLOYEES: Employee[] = [
  { id: 'emp-owner', name: 'Owner Toko', pin: '1234', role: 'owner', avatarColor: '#6C5CE7', isActive: true, createdAt: new Date().toISOString() },
  { id: 'emp-kasir', name: 'Ahmad Kasir', pin: '1234', role: 'cashier', avatarColor: '#00B894', isActive: true, createdAt: new Date().toISOString() },
  { id: 'emp-mgr', name: 'Siti Manager', pin: '5678', role: 'manager', avatarColor: '#FD79A8', isActive: true, createdAt: new Date().toISOString() },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Defaults ────────────────────────────────────────
      setupCompleted: true,
      theme: 'light',
      language: 'id',
      businessType: 'fnb',
      businessName: 'Warung Rasa Nusantara',
      businessAddress: 'Jl. Merdeka No. 88, Jakarta Pusat',
      businessPhone: '0812-3456-7890',
      taxEnabled: true,
      taxName: 'PPN',
      taxRate: 11,
      serviceChargeEnabled: false,
      serviceChargeName: 'Service Charge',
      serviceChargeRate: 5,
      sidebarExpanded: true,

      currentEmployee: DEFAULT_EMPLOYEES[0],
      employees: DEFAULT_EMPLOYEES,

  currentShift: null,

  categories: SAMPLE_CATEGORIES,
  products: SAMPLE_PRODUCTS,

  cart: [],
  selectedCustomer: null,
  orderType: 'dine_in',
  selectedTable: null,
  cartDiscount: null,

  heldTransactions: [],
  transactions: [],
  customers: [],
  auditLogs: [],
  isScreenLocked: false,
  authorizedPages: [],
  discounts: [
    { id: 'd1', name: 'Diskon 10%', type: 'percentage', value: 10, minPurchase: 0, isActive: true },
    { id: 'd2', name: 'Diskon 20%', type: 'percentage', value: 20, minPurchase: 50000, isActive: true },
    { id: 'd3', name: 'Potongan 5K', type: 'fixed', value: 5000, minPurchase: 25000, isActive: true },
    { id: 'd4', name: 'Potongan 10K', type: 'fixed', value: 10000, minPurchase: 50000, isActive: true },
  ],

  currentPage: 'pos',
  productsPageSize: 8,
  transactionsPageSize: 8,
  printerType: 'usb',
  selectedPrinter: 'POS-58',
  paperWidth: '58mm',
  autoSilentPrint: true,
  bluetoothDeviceName: '',
  networkPrinterIp: '192.168.1.200',
  networkPrinterPort: 9100,
  loyaltySettings: DEFAULT_LOYALTY_SETTINGS,
  redeemedPoints: 0,
  showPaymentModal: false,
  showShiftModal: false,
  showSuccessModal: false,
  lastTransaction: null,
  toasts: [],
  isTrial: false,
  trialStatus: null,
  setTrialStatus: (status) => set({ trialStatus: status, isTrial: !!status?.isTrial }),
  setIsTrial: (isTrial) => set({ isTrial }),

  // ── Actions ─────────────────────────────────────────
  completeSetup: (data) => {
    const owner: Employee = {
      id: generateId(),
      name: data.ownerName,
      pin: data.ownerPin,
      role: 'owner',
      avatarColor: '#6C5CE7',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    // Add sample employees
    const sampleEmployees: Employee[] = [
      owner,
      { id: generateId(), name: 'Ahmad Kasir', pin: '1234', role: 'cashier', avatarColor: '#00B894', isActive: true, createdAt: new Date().toISOString() },
      { id: generateId(), name: 'Siti Manager', pin: '5678', role: 'manager', avatarColor: '#FD79A8', isActive: true, createdAt: new Date().toISOString() },
    ];

    set({
      setupCompleted: true,
      businessName: data.businessName,
      businessAddress: data.businessAddress,
      businessPhone: data.businessPhone,
      businessType: data.businessType,
      taxEnabled: data.taxEnabled,
      taxName: data.taxName,
      taxRate: data.taxRate,
      serviceChargeEnabled: data.serviceChargeEnabled,
      serviceChargeName: data.serviceChargeName,
      serviceChargeRate: data.serviceChargeRate,
      employees: sampleEmployees,
    });
  },

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    set({ theme: newTheme });
  },

  setLang: (lang) => {
    setLanguage(lang);
    set({ language: lang });
  },

  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),

  // ── Auth ──────────────────────────────────────────
  login: (employee) => set({ currentEmployee: employee, authorizedPages: [] }),
  logout: () => set({ currentEmployee: null, currentShift: null, authorizedPages: [] }),

  // ── Shift ─────────────────────────────────────────
  openShift: (openingCash) => {
    const emp = get().currentEmployee;
    if (!emp) return;
    const shift: Shift = {
      id: generateId(),
      employeeId: emp.id,
      employeeName: emp.name,
      openingCash,
      closingCash: 0,
      expectedCash: openingCash,
      cashDifference: 0,
      totalTransactions: 0,
      totalRevenue: 0,
      openedAt: new Date().toISOString(),
      status: 'open',
    };
    set({ currentShift: shift, showShiftModal: false });
  },

  closeShift: (closingCash) => {
    const shift = get().currentShift;
    if (!shift) return;
    set({
      currentShift: {
        ...shift,
        closingCash,
        cashDifference: closingCash - shift.expectedCash,
        closedAt: new Date().toISOString(),
        status: 'closed',
      },
      showShiftModal: false,
    });
    // After showing summary, clear shift
    setTimeout(() => set({ currentShift: null }), 0);
  },

  // ── Cart ──────────────────────────────────────────
  addToCart: (product, modifiers = []) => {
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.price, 0);
    const unitPrice = product.sellPrice + modifierTotal;
    
    // Check if same product with same modifiers exists
    const existingIdx = get().cart.findIndex(
      (item) => item.productId === product.id &&
        JSON.stringify(item.modifiers) === JSON.stringify(modifiers)
    );

    if (existingIdx >= 0) {
      // Increment quantity
      const updated = [...get().cart];
      updated[existingIdx] = {
        ...updated[existingIdx],
        quantity: updated[existingIdx].quantity + 1,
        total: (updated[existingIdx].quantity + 1) * unitPrice,
      };
      set({ cart: updated });
    } else {
      const newItem: CartItem = {
        id: generateId(),
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice,
        discount: 0,
        modifiers,
        notes: '',
        total: unitPrice,
      };
      set({ cart: [...get().cart, newItem] });
    }
  },

  removeFromCart: (cartItemId) => {
    set({ cart: get().cart.filter((item) => item.id !== cartItemId) });
  },

  updateCartItemQty: (cartItemId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }
    set({
      cart: get().cart.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity: qty, total: qty * item.unitPrice }
          : item
      ),
    });
  },

  clearCart: () => set({ cart: [], selectedCustomer: null, cartDiscount: null, redeemedPoints: 0 }),

  setSelectedCustomer: (customer) => set({ selectedCustomer: customer, redeemedPoints: 0 }),
  setOrderType: (type) => set({ orderType: type }),
  setCartDiscount: (discount) => set({ cartDiscount: discount }),

  // ── Hold ──────────────────────────────────────────
  holdCurrentTransaction: () => {
    const state = get();
    if (state.cart.length === 0) return;
    
    const held: HeldTransaction = {
      id: generateId(),
      items: [...state.cart],
      customerId: state.selectedCustomer?.id,
      customerName: state.selectedCustomer?.name,
      orderType: state.orderType,
      discountId: state.cartDiscount?.id,
      notes: '',
      heldAt: new Date().toISOString(),
      employeeId: state.currentEmployee?.id || '',
    };
    
    set({
      heldTransactions: [...state.heldTransactions, held],
      cart: [],
      selectedCustomer: null,
      cartDiscount: null,
    });
    
    get().addToast('info', 'Transaksi ditahan');
  },

  resumeHeldTransaction: (id) => {
    const held = get().heldTransactions.find((h) => h.id === id);
    if (!held) return;
    
    set({
      cart: held.items,
      heldTransactions: get().heldTransactions.filter((h) => h.id !== id),
    });
    
    get().addToast('success', 'Transaksi dilanjutkan');
  },

  // ── Payment ───────────────────────────────────────
  openPaymentModal: () => set({ showPaymentModal: true }),
  closePaymentModal: () => set({ showPaymentModal: false }),

  completeTransaction: (paymentMethod, paymentAmount) => {
    const state = get();
    const subtotal = state.getCartSubtotal();
    const discountAmount = state.getCartDiscount();
    const taxAmount = state.getCartTax();
    const serviceChargeAmount = state.getCartServiceCharge();
    const total = state.getCartTotal();

    // Compute Loyalty Points Earned & Redeemed
    const pointsDiscount = state.getPointsDiscount();
    const redeemedPoints = state.redeemedPoints;
    const settings = state.loyaltySettings;

    let pointsEarned = 0;
    if (state.selectedCustomer && settings.enabled) {
      pointsEarned = calculatePointsEarned(total, state.selectedCustomer, settings);
    }

    const tx: Transaction = {
      id: generateId(),
      receiptNumber: generateReceiptNumber(),
      employeeId: state.currentEmployee?.id || 'emp-unknown',
      employeeName: state.currentEmployee?.name || 'Kasir',
      customerId: state.selectedCustomer?.id,
      customerName: state.selectedCustomer?.name,
      outletId: 'outlet-main',
      items: state.cart.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.name,
        variantName: item.variantName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
        modifiers: item.modifiers,
        notes: item.notes,
      })),
      subtotal,
      discountAmount,
      discountLabel: state.cartDiscount?.name || '',
      taxAmount,
      serviceChargeAmount,
      total,
      paymentMethod,
      paymentAmount,
      changeAmount: paymentAmount - total,
      status: 'completed' as TransactionStatus,
      orderType: state.orderType,
      pointsRedeemed: redeemedPoints > 0 ? redeemedPoints : undefined,
      pointsDiscountAmount: pointsDiscount > 0 ? pointsDiscount : undefined,
      pointsEarned: pointsEarned > 0 ? pointsEarned : undefined,
      notes: '',
      createdAt: new Date().toISOString(),
    };

    // Update shift
    let updatedShift = state.currentShift;
    if (updatedShift) {
      updatedShift = {
        ...updatedShift,
        totalTransactions: updatedShift.totalTransactions + 1,
        totalRevenue: updatedShift.totalRevenue + total,
        expectedCash: paymentMethod === 'cash'
          ? updatedShift.expectedCash + total
          : updatedShift.expectedCash,
      };
    }

    // Update customer
    let updatedCustomers = state.customers;
    if (state.selectedCustomer) {
      updatedCustomers = state.customers.map((c) => {
        if (c.id === state.selectedCustomer!.id) {
          const currentValidPoints = isCustomerPointsExpired(c, settings) ? 0 : c.loyaltyPoints;
          const newPoints = Math.max(0, currentValidPoints - redeemedPoints + pointsEarned);
          return {
            ...c,
            totalSpent: c.totalSpent + total,
            totalVisits: c.totalVisits + 1,
            loyaltyPoints: newPoints,
            lastVisit: new Date().toISOString(),
          };
        }
        return c;
      });
    }

    // ── Check Trial Transaction Limit ──
    if (state.isTrial) {
      if (state.transactions.length >= 50) {
        state.addToast('error', 'Batas 50 transaksi demo telah tercapai. Data Anda tetap aman! Silakan beli Lisensi Resmi C-POS.');
        set({ showPaymentModal: false });
        return;
      }
    }

    set({
      transactions: [tx, ...state.transactions],
      cart: [],
      selectedCustomer: null,
      cartDiscount: null,
      redeemedPoints: 0,
      showPaymentModal: false,
      showSuccessModal: true,
      lastTransaction: tx,
      currentShift: updatedShift,
      customers: updatedCustomers,
    });

    // Update trial status if in demo mode
    if (state.isTrial) {
      const nextCount = state.transactions.length + 1;
      evaluateTrialStatus(nextCount).then((updatedTrial) => {
        set({ trialStatus: updatedTrial });
        if (nextCount >= 50) {
          state.addToast('warning', 'Ini adalah transaksi demo ke-50 (terakhir). Silakan beli Lisensi Resmi untuk terus berjualan.');
        }
      });
    }
  },

  // ── Navigation ────────────────────────────────────
  setCurrentPage: (page) => set({ currentPage: page }),

  // ── Toast ─────────────────────────────────────────
  addToast: (type, message) => {
    const id = generateId();
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().removeToast(id), 3000);
  },
  removeToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  // ── Products ──────────────────────────────────────
  addProduct: (product) => set({ products: [...get().products, product] }),
  updateProduct: (product) => set({
    products: get().products.map((p) => (p.id === product.id ? product : p)),
  }),
  updateProductsBatch: (updatedBatch) => {
    const map = new Map(updatedBatch.map((p) => [p.id, p]));
    set({
      products: get().products.map((p) => map.get(p.id) || p),
    });
  },
  deleteProduct: (id) => set({ products: get().products.filter((p) => p.id !== id) }),
  addCategory: (category) => set({ categories: [...get().categories, category] }),
  updateCategory: (category) =>
    set({
      categories: get().categories.map((c) => (c.id === category.id ? category : c)),
    }),
  deleteCategory: (id) => {
    const cats = get().categories.filter((c) => c.id !== id);
    const fallbackId = cats[0]?.id || 'cat-1';
    const updatedProducts = get().products.map((p) =>
      p.categoryId === id ? { ...p, categoryId: fallbackId } : p
    );
    set({ categories: cats, products: updatedProducts });
  },

  // ── Customers ─────────────────────────────────────
  addCustomer: (customer) => set({ customers: [...get().customers, customer] }),
  updateCustomer: (customer) =>
    set({
      customers: get().customers.map((c) => (c.id === customer.id ? customer : c)),
      selectedCustomer: get().selectedCustomer?.id === customer.id ? customer : get().selectedCustomer,
    }),
  deleteCustomer: (id) =>
    set({
      customers: get().customers.filter((c) => c.id !== id),
      selectedCustomer: get().selectedCustomer?.id === id ? null : get().selectedCustomer,
    }),

  // ── Employees ─────────────────────────────────────
  addEmployee: (employee) => set({ employees: [...get().employees, employee] }),
  updateEmployee: (employee) =>
    set({
      employees: get().employees.map((e) => (e.id === employee.id ? employee : e)),
      currentEmployee: get().currentEmployee?.id === employee.id ? employee : get().currentEmployee,
    }),
  deleteEmployee: (id) =>
    set({
      employees: get().employees.filter((e) => e.id !== id),
      currentEmployee: get().currentEmployee?.id === id ? null : get().currentEmployee,
    }),
  resetEmployeePin: (id, newPin) =>
    set({
      employees: get().employees.map((e) => (e.id === id ? { ...e, pin: newPin } : e)),
    }),

  // ── Transactions ──────────────────────────────────
  voidTransaction: (id, reason, supervisorName) => {
    const tx = get().transactions.find((t) => t.id === id);
    if (!tx) return;

    // 1. Mark transaction as voided
    const updatedTxs = get().transactions.map((t) =>
      t.id === id ? { ...t, status: 'voided' as TransactionStatus } : t
    );

    // 2. Restore inventory stock for tracked items
    const currentProducts = get().products;
    const productMap = new Map(currentProducts.map((p) => [p.id, p]));
    let stockRestored = false;
    tx.items.forEach((item) => {
      const p = productMap.get(item.productId);
      if (p && p.trackStock) {
        productMap.set(p.id, { ...p, stock: p.stock + item.quantity });
        stockRestored = true;
      }
    });

    // 3. Log to Audit Trail
    const emp = get().currentEmployee;
    const newAudit: AuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      employeeId: emp?.id || 'sys',
      employeeName: emp?.name || 'Kasir',
      employeeRole: emp?.role || 'cashier',
      action: 'void_transaction',
      details: `Void Struk #${tx.receiptNumber} (${formatCurrency(tx.total)}). Alasan: ${reason || 'Pembatalan transaksi'}`,
      authorizedBy: supervisorName || emp?.name || 'Owner',
    };

    set({
      transactions: updatedTxs,
      products: stockRestored ? Array.from(productMap.values()) : currentProducts,
      auditLogs: [newAudit, ...get().auditLogs].slice(0, 500),
    });
  },

  addAuditLog: (log) => {
    const newEntry: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    set({ auditLogs: [newEntry, ...get().auditLogs].slice(0, 500) });
  },

  lockScreen: () => set({ isScreenLocked: true, authorizedPages: [] }),

  unlockScreen: (pin) => {
    const emps = get().employees.filter((e) => e.isActive);
    const matched = emps.find((e) => e.pin === pin);
    if (matched) {
      set({ isScreenLocked: false, currentEmployee: matched, authorizedPages: [] });
      return true;
    }
    return false;
  },

  authorizePage: (pageId) => {
    const current = get().authorizedPages;
    if (!current.includes(pageId)) {
      set({ authorizedPages: [...current, pageId] });
    }
  },

  revokeAuthorizedPages: () => set({ authorizedPages: [] }),

  // ── Computed ──────────────────────────────────────
  getCartSubtotal: () => get().cart.reduce((sum, item) => sum + item.total, 0),

  getCartDiscount: () => {
    const { cart, cartDiscount } = get();
    if (!cartDiscount) return 0;
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    if (cartDiscount.type === 'percentage') {
      return Math.round(subtotal * cartDiscount.value / 100);
    }
    return cartDiscount.value;
  },

  getCartTax: () => {
    const state = get();
    if (!state.taxEnabled) return 0;
    const subtotal = state.getCartSubtotal();
    const discount = state.getCartDiscount();
    return Math.round((subtotal - discount) * state.taxRate / 100);
  },

  getCartServiceCharge: () => {
    const state = get();
    if (!state.serviceChargeEnabled) return 0;
    const subtotal = state.getCartSubtotal();
    const discount = state.getCartDiscount();
    return Math.round((subtotal - discount) * state.serviceChargeRate / 100);
  },

  getPointsDiscount: () => {
    const state = get();
    const { redeemedPoints, loyaltySettings } = state;
    if (!loyaltySettings?.enabled || !redeemedPoints) return 0;
    const rawDiscount = redeemedPoints * (loyaltySettings.pointValueInRupiah || 100);
    const subtotal = state.getCartSubtotal();
    const discount = state.getCartDiscount();
    const eligibleAmount = Math.max(0, subtotal - discount);
    const maxPercent = loyaltySettings.maxDiscountPercent ?? 50;
    const maxDiscountAllowed = Math.round((eligibleAmount * maxPercent) / 100);
    return Math.min(rawDiscount, maxDiscountAllowed);
  },

  getCartTotal: () => {
    const state = get();
    const subtotal = state.getCartSubtotal();
    const discount = state.getCartDiscount();
    const pointsDiscount = state.getPointsDiscount();
    const tax = state.getCartTax();
    const sc = state.getCartServiceCharge();
    return Math.max(0, subtotal - discount - pointsDiscount + tax + sc);
  },

  updateLoyaltySettings: (newSettings) =>
    set({
      loyaltySettings: {
        ...get().loyaltySettings,
        ...newSettings,
      },
    }),

  addLoyaltyTier: (tier) =>
    set({
      loyaltySettings: {
        ...get().loyaltySettings,
        tiers: [...(get().loyaltySettings.tiers || []), tier],
      },
    }),

  updateLoyaltyTier: (tier) =>
    set({
      loyaltySettings: {
        ...get().loyaltySettings,
        tiers: (get().loyaltySettings.tiers || []).map((t) => (t.id === tier.id ? tier : t)),
      },
    }),

  deleteLoyaltyTier: (tierId) =>
    set({
      loyaltySettings: {
        ...get().loyaltySettings,
        tiers: (get().loyaltySettings.tiers || []).filter((t) => t.id !== tierId),
      },
    }),

  setRedeemedPoints: (points) => set({ redeemedPoints: points }),

    resetSetupWizard: () => set({ setupCompleted: false }),
    resetDatabasePreserveAccounts: () => {
      set({
        transactions: [],
        currentShift: null,
        cart: [],
        selectedCustomer: null,
        selectedTable: null,
        cartDiscount: null,
        heldTransactions: [],
        products: [],
        categories: [],
        customers: [],
        discounts: [],
        lastTransaction: null,
        redeemedPoints: 0,
      });
    },
    closeSuccessModal: () => set({ showSuccessModal: false, lastTransaction: null }),
    openShiftModal: () => set({ showShiftModal: true }),
    closeShiftModal: () => set({ showShiftModal: false }),
    setProductsPageSize: (size: number) => set({ productsPageSize: size }),
    setTransactionsPageSize: (size: number) => set({ transactionsPageSize: size }),
    setSelectedPrinter: (printer: string) => set({ selectedPrinter: printer }),
    setAutoSilentPrint: (val: boolean) => set({ autoSilentPrint: val }),
    setPrinterSettings: (settings) => set((s) => ({ ...s, ...settings })),
  }),
  {
    name: 'c-pos-storage',
    partialize: (state) => ({
      setupCompleted: state.setupCompleted,
      theme: state.theme,
      language: state.language,
      businessType: state.businessType,
      businessName: state.businessName,
      businessAddress: state.businessAddress,
      businessPhone: state.businessPhone,
      taxEnabled: state.taxEnabled,
      taxName: state.taxName,
      taxRate: state.taxRate,
      serviceChargeEnabled: state.serviceChargeEnabled,
      serviceChargeName: state.serviceChargeName,
      serviceChargeRate: state.serviceChargeRate,
      currentEmployee: state.currentEmployee,
      employees: state.employees,
      currentShift: state.currentShift,
      categories: state.categories,
      products: state.products,
      transactions: state.transactions,
      customers: state.customers,
      discounts: state.discounts,
      productsPageSize: state.productsPageSize,
      transactionsPageSize: state.transactionsPageSize,
      printerType: state.printerType,
      selectedPrinter: state.selectedPrinter,
      paperWidth: state.paperWidth,
      autoSilentPrint: state.autoSilentPrint,
      bluetoothDeviceName: state.bluetoothDeviceName,
      networkPrinterIp: state.networkPrinterIp,
      networkPrinterPort: state.networkPrinterPort,
      loyaltySettings: state.loyaltySettings,
    }),
  }
));
