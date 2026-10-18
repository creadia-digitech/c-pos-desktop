/**
 * Format number as Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(amount));
}

/**
 * Format number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Short currency format (e.g., 25K, 1.2M)
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}

/**
 * Generate receipt number format: YYYYMMDD-XXXX
 */
export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${date}-${random}`;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'time' | 'datetime' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const opts: Record<string, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: 'short', year: 'numeric' },
    long: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit', hour12: false },
    datetime: { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false },
  };
  return d.toLocaleDateString('id-ID', opts[format]);
}

/**
 * Format time only
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Calculate quick payment amounts based on total
 */
export function getQuickAmounts(total: number): number[] {
  const amounts: number[] = [];
  const rounded = Math.ceil(total / 1000) * 1000;
  
  if (rounded > total) amounts.push(rounded);
  
  const steps = [5000, 10000, 20000, 50000, 100000];
  for (const step of steps) {
    const quick = Math.ceil(total / step) * step;
    if (quick > total && !amounts.includes(quick)) {
      amounts.push(quick);
    }
  }
  
  return amounts.slice(0, 4);
}

/**
 * Generate random pastel color
 */
const AVATAR_COLORS = [
  '#6C5CE7', '#00B894', '#FD79A8', '#0984E3', '#FDCB6E',
  '#E17055', '#A29BFE', '#55EFC4', '#74B9FF', '#FF7675',
  '#81ECEC', '#FAB1A0', '#DFE6E9', '#636E72', '#B2BEC3',
];

export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Generate a valid 13-digit EAN-13 Barcode with Indonesian country prefix (899) and mathematical check digit
 */
export function generateEan13Barcode(existingBarcodes?: Set<string>): string {
  let finalBarcode = '';
  let attempts = 0;
  do {
    const randomBody = Math.floor(100000000 + Math.random() * 900000000).toString();
    const prefix12 = '899' + randomBody;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(prefix12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    finalBarcode = prefix12 + checkDigit.toString();
    attempts++;
  } while (existingBarcodes && existingBarcodes.has(finalBarcode) && attempts < 100);

  return finalBarcode;
}
