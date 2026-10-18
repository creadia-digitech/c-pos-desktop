import { Customer, LoyaltySettings, LoyaltyTier } from '../types';

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  spendPerPoint: 1000,
  pointValueInRupiah: 100,
  minPointsToRedeem: 50,
  maxDiscountPercent: 50,
  welcomeBonusPoints: 10,
  expiryType: 'period_months',
  expiryMonths: 6,
  tiers: [
    {
      id: 'tier-bronze',
      name: 'Bronze',
      minSpend: 0,
      pointMultiplier: 1,
      badgeColor: '#CD7F32',
      icon: '🥉',
    },
    {
      id: 'tier-silver',
      name: 'Silver',
      minSpend: 500000,
      pointMultiplier: 1.25,
      badgeColor: '#7F8C8D',
      icon: '🥈',
    },
    {
      id: 'tier-gold',
      name: 'Gold',
      minSpend: 1500000,
      pointMultiplier: 1.5,
      badgeColor: '#F39C12',
      icon: '🥇',
    },
    {
      id: 'tier-platinum',
      name: 'Platinum',
      minSpend: 3000000,
      pointMultiplier: 2,
      badgeColor: '#2980B9',
      icon: '💎',
    },
  ],
};

/**
 * Determine customer's current tier based on totalSpent
 */
export function getCustomerTier(customer: Customer, settings?: LoyaltySettings): LoyaltyTier {
  const currentSettings = settings || DEFAULT_LOYALTY_SETTINGS;
  const tiers = currentSettings.tiers || DEFAULT_LOYALTY_SETTINGS.tiers;

  if (!tiers || tiers.length === 0) {
    return DEFAULT_LOYALTY_SETTINGS.tiers[0];
  }

  // Sort tiers by minSpend descending to find the highest threshold reached
  const sorted = [...tiers].sort((a, b) => b.minSpend - a.minSpend);
  const matched = sorted.find((t) => (customer.totalSpent || 0) >= t.minSpend);

  return matched || sorted[sorted.length - 1];
}

/**
 * Get next tier and remaining spend needed to unlock it
 */
export function getNextTier(
  customer: Customer,
  settings?: LoyaltySettings
): { nextTier: LoyaltyTier; remainingSpend: number } | null {
  const currentSettings = settings || DEFAULT_LOYALTY_SETTINGS;
  const tiers = currentSettings.tiers || DEFAULT_LOYALTY_SETTINGS.tiers;

  const currentTier = getCustomerTier(customer, currentSettings);
  // Sort ascending by minSpend
  const sorted = [...tiers].sort((a, b) => a.minSpend - b.minSpend);

  const currentIndex = sorted.findIndex((t) => t.id === currentTier.id);
  if (currentIndex === -1 || currentIndex >= sorted.length - 1) {
    return null; // Already at max tier!
  }

  const nextTier = sorted[currentIndex + 1];
  const remainingSpend = Math.max(0, nextTier.minSpend - (customer.totalSpent || 0));

  return { nextTier, remainingSpend };
}

/**
 * Check if customer's points have expired based on last visit
 */
export function isCustomerPointsExpired(customer: Customer, settings?: LoyaltySettings): boolean {
  const currentSettings = settings || DEFAULT_LOYALTY_SETTINGS;

  if (!currentSettings.enabled) return false;
  if (currentSettings.expiryType === 'never') return false;
  if (!customer.lastVisit) return false;

  const lastVisitDate = new Date(customer.lastVisit);
  if (isNaN(lastVisitDate.getTime())) return false;

  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - lastVisitDate.getFullYear()) * 12 +
    (now.getMonth() - lastVisitDate.getMonth());

  return monthsDiff >= (currentSettings.expiryMonths || 6);
}

/**
 * Calculate expected expiry date for a customer's points
 */
export function getPointsExpiryDate(customer: Customer, settings?: LoyaltySettings): Date | null {
  const currentSettings = settings || DEFAULT_LOYALTY_SETTINGS;

  if (!currentSettings.enabled || currentSettings.expiryType === 'never' || !customer.lastVisit) {
    return null;
  }

  const lastVisitDate = new Date(customer.lastVisit);
  if (isNaN(lastVisitDate.getTime())) return null;

  const expiry = new Date(lastVisitDate);
  expiry.setMonth(expiry.getMonth() + (currentSettings.expiryMonths || 6));
  return expiry;
}

/**
 * Return effective valid points (0 if expired)
 */
export function getEffectiveCustomerPoints(customer: Customer, settings?: LoyaltySettings): number {
  const currentSettings = settings || DEFAULT_LOYALTY_SETTINGS;
  if (!currentSettings.enabled) return 0;
  if (isCustomerPointsExpired(customer, currentSettings)) return 0;
  return customer.loyaltyPoints || 0;
}

/**
 * Calculate points earned from spend amount considering tier multiplier
 */
export function calculatePointsEarned(
  spendAmount: number,
  customer: Customer,
  settings?: LoyaltySettings
): number {
  const currentSettings = settings || DEFAULT_LOYALTY_SETTINGS;
  if (!currentSettings.enabled) return 0;

  const spendPerPoint = currentSettings.spendPerPoint || 1000;
  if (spendAmount < spendPerPoint) return 0;

  const tier = getCustomerTier(customer, currentSettings);
  const basePoints = Math.floor(spendAmount / spendPerPoint);
  return Math.round(basePoints * (tier?.pointMultiplier || 1));
}
