import React, { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { useTranslation } from '../../utils/useTranslation';
import { formatCurrency } from '../../utils/helpers';
import {
  getCustomerTier,
  getEffectiveCustomerPoints,
  isCustomerPointsExpired,
  calculatePointsEarned,
} from '../../utils/loyalty';
import {
  Trash2,
  Plus,
  Minus,
  User,
  Tag,
  Clock,
  ArrowRight,
  Utensils,
  ShoppingBag,
  RotateCcw,
  Percent,
  X,
  Star,
  Sparkles,
  Award,
  Check,
} from 'lucide-react';

interface CartPanelProps {
  onOpenCustomerModal: () => void;
  onOpenDiscountModal: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  onOpenCustomerModal,
  onOpenDiscountModal,
}) => {
  const {
    cart,
    removeFromCart,
    updateCartItemQty,
    clearCart,
    orderType,
    setOrderType,
    selectedCustomer,
    setSelectedCustomer,
    cartDiscount,
    setCartDiscount,
    holdCurrentTransaction,
    heldTransactions,
    resumeHeldTransaction,
    openPaymentModal,
    getCartSubtotal,
    getCartDiscount,
    getCartTax,
    getCartServiceCharge,
    getCartTotal,
    businessType,
    loyaltySettings,
    redeemedPoints,
    setRedeemedPoints,
    getPointsDiscount,
    taxName,
    taxRate,
    serviceChargeName,
    serviceChargeRate,
  } = useStore();
  const { t } = useTranslation();

  const [showHeldList, setShowHeldList] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);

  const subtotal = getCartSubtotal();
  const discountAmount = getCartDiscount();
  const pointsDiscount = getPointsDiscount();
  const tax = getCartTax();
  const serviceCharge = getCartServiceCharge();
  const total = getCartTotal();

  // Loyalty calculations for selected customer
  const customerTier = selectedCustomer ? getCustomerTier(selectedCustomer, loyaltySettings) : null;
  const isPointsExpired = selectedCustomer ? isCustomerPointsExpired(selectedCustomer, loyaltySettings) : false;
  const validPoints = selectedCustomer ? getEffectiveCustomerPoints(selectedCustomer, loyaltySettings) : 0;
  const potentialPointsEarned = selectedCustomer ? calculatePointsEarned(subtotal, selectedCustomer, loyaltySettings) : 0;

  // Max points redeemable allowed by maxDiscountPercent
  const eligibleNetSubtotal = Math.max(0, subtotal - discountAmount);
  const maxDiscountValueAllowed = Math.round(
    (eligibleNetSubtotal * (loyaltySettings?.maxDiscountPercent || 50)) / 100
  );
  const pointValue = loyaltySettings?.pointValueInRupiah || 100;
  const maxPointsByDiscountCap = Math.floor(maxDiscountValueAllowed / pointValue);
  const maxRedeemablePoints = Math.min(validPoints, maxPointsByDiscountCap);

  return (
    <div
      className="cart-panel"
      style={{
        width: '380px',
        height: '100%',
        backgroundColor: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {/* ── Top Header: Order Type & Customer ──────────────── */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
        {/* Order Type Toggle (Dine In / Takeaway) */}
        {businessType !== 'retail' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--bg)',
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '12px',
            }}
          >
            <button
              onClick={() => setOrderType('dine_in')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: orderType === 'dine_in' ? 'var(--primary-500)' : 'transparent',
                color: orderType === 'dine_in' ? '#FFF' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Utensils size={15} />
              <span>{t('pos.dineIn')}</span>
            </button>

            <button
              onClick={() => setOrderType('takeaway')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: orderType === 'takeaway' ? 'var(--primary-500)' : 'transparent',
                color: orderType === 'takeaway' ? '#FFF' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <ShoppingBag size={15} />
              <span>{t('pos.takeaway')}</span>
            </button>
          </div>
        )}

        {/* Customer Badge & Held Bill Button */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenCustomerModal}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px dashed var(--border)',
              backgroundColor: selectedCustomer ? 'var(--primary-50)' : 'var(--bg)',
              color: selectedCustomer ? 'var(--primary-700)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} />
              <span>{selectedCustomer ? selectedCustomer.name : `+ ${t('pos.selectCustomer')}`}</span>
            </div>
            {selectedCustomer && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedCustomer(null);
                }}
                style={{ cursor: 'pointer', padding: '2px' }}
              >
                <X size={14} />
              </span>
            )}
          </button>

          {/* Held Orders quick button */}
          <button
            onClick={() => setShowHeldList(!showHeldList)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              backgroundColor: heldTransactions.length > 0 ? 'rgba(253, 121, 168, 0.12)' : 'var(--bg)',
              color: heldTransactions.length > 0 ? '#FD79A8' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            title={t('pos.heldOrders')}
          >
            <Clock size={15} />
            <span>{t('pos.hold')} ({heldTransactions.length})</span>
          </button>
        </div>

        {/* Selected Customer Loyalty & Points Card */}
        {selectedCustomer && loyaltySettings?.enabled && customerTier && (
          <div
            style={{
              marginTop: '8px',
              padding: '10px 12px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg)',
              border: `1px solid ${customerTier.badgeColor}35`,
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: `${customerTier.badgeColor}20`,
                  color: customerTier.badgeColor,
                  fontWeight: 800,
                  fontSize: '0.72rem',
                }}
              >
                <span>{customerTier.icon}</span>
                <span>{customerTier.name} ({customerTier.pointMultiplier}x)</span>
              </span>

              {isPointsExpired ? (
                <span style={{ fontSize: '0.7rem', color: '#D63031', fontWeight: 700 }}>
                  ⚠️ Poin Kadaluarsa
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706' }}>
                  ⭐ {validPoints} Poin
                </span>
              )}
            </div>

            {/* Loyalty Redeem Actions or Earn Preview */}
            {!isPointsExpired && validPoints >= (loyaltySettings.minPointsToRedeem || 50) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                {redeemedPoints > 0 ? (
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'rgba(240, 180, 41, 0.15)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      border: '1px solid rgba(240, 180, 41, 0.4)',
                    }}
                  >
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#D97706' }}>
                      Tukar {redeemedPoints} Poin (-{formatCurrency(pointsDiscount)})
                    </span>
                    <button
                      onClick={() => setRedeemedPoints(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#D63031',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                    <button
                      onClick={() => {
                        const redeemAmt = Math.min(validPoints, maxRedeemablePoints);
                        if (redeemAmt >= (loyaltySettings.minPointsToRedeem || 50)) {
                          setRedeemedPoints(redeemAmt);
                        }
                      }}
                      disabled={maxRedeemablePoints < (loyaltySettings.minPointsToRedeem || 50)}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        borderRadius: '8px',
                        border: '1px solid #F39C12',
                        backgroundColor: 'rgba(243, 156, 18, 0.1)',
                        color: '#D97706',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: maxRedeemablePoints < (loyaltySettings.minPointsToRedeem || 50) ? 'not-allowed' : 'pointer',
                        opacity: maxRedeemablePoints < (loyaltySettings.minPointsToRedeem || 50) ? 0.6 : 1,
                      }}
                    >
                      Tukar Poin ({Math.min(validPoints, maxRedeemablePoints)} Poin = -{formatCurrency(Math.min(validPoints, maxRedeemablePoints) * pointValue)})
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {validPoints < (loyaltySettings.minPointsToRedeem || 50)
                    ? `Min. ${loyaltySettings.minPointsToRedeem || 50} poin utk ditukar`
                    : ''}
                </span>
                {potentialPointsEarned > 0 && (
                  <span style={{ color: '#00B894', fontWeight: 600 }}>
                    +{potentialPointsEarned} Poin didapat
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Held transactions dropdown modal */}
        {showHeldList && heldTransactions.length > 0 && (
          <div
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '180px',
              overflowY: 'auto',
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              PILIH PESANAN TERTUNDA:
            </div>
            {heldTransactions.map((ht) => (
              <div
                key={ht.id}
                onClick={() => {
                  resumeHeldTransaction(ht.id);
                  setShowHeldList(false);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  backgroundColor: 'var(--surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>
                    {ht.customerName || 'Pelanggan Umum'} ({ht.items.length} item)
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {new Date(ht.heldAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div style={{ color: 'var(--primary-600)', fontWeight: 700 }}>Ambil &rarr;</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cart Items Scrollable List ────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        {cart.length === 0 ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              gap: '8px',
              textAlign: 'center',
              padding: '20px',
            }}
          >
            <ShoppingBag size={48} style={{ opacity: 0.3 }} />
            <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{t('pos.emptyCart')}</div>
            <div style={{ fontSize: '0.78rem' }}>{t('pos.emptyCartDesc')}</div>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
                gap: '10px',
              }}
            >
              {/* Product Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={item.name}
                >
                  {item.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {formatCurrency(item.unitPrice)}
                </div>
              </div>

              {/* Quantity Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => updateCartItemQty(item.id, item.quantity - 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                >
                  <Minus size={13} />
                </button>

                <span style={{ fontWeight: 700, fontSize: '0.88rem', minWidth: '22px', textAlign: 'center' }}>
                  {item.quantity}
                </span>

                <button
                  onClick={() => updateCartItemQty(item.id, item.quantity + 1)}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text)',
                  }}
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Item Total */}
              <div style={{ minWidth: '70px', textAlign: 'right', fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>
                {formatCurrency(item.total)}
              </div>

              {/* Delete button */}
              <button
                onClick={() => removeFromCart(item.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Hapus"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Bottom Section: Discounts, Totals & Pay ───────── */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
        {/* Quick Tools: Diskon & Hold */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={onOpenDiscountModal}
            disabled={cart.length === 0}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '8px',
              border: cartDiscount ? '1px solid #00B894' : '1px solid var(--border)',
              backgroundColor: cartDiscount ? 'rgba(0, 184, 148, 0.1)' : 'var(--bg)',
              color: cartDiscount ? '#009B7D' : 'var(--text)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
            }}
          >
            <Tag size={14} />
            <span>{cartDiscount ? cartDiscount.name : `+ ${t('pos.discount')}`}</span>
          </button>

          <button
            onClick={holdCurrentTransaction}
            disabled={cart.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
            }}
            title={t('pos.hold')}
          >
            <Clock size={14} />
            <span>{t('pos.hold')}</span>
          </button>

          <button
            onClick={clearCart}
            disabled={cart.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: '#D63031',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
              opacity: cart.length === 0 ? 0.6 : 1,
            }}
            title={t('pos.clear')}
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Calculation Summary Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px', fontSize: '0.82rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>{t('pos.subtotal')}</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00B894', fontWeight: 600 }}>
              <span>{t('pos.discount')} ({cartDiscount?.name})</span>
              <span>-{formatCurrency(discountAmount)}</span>
            </div>
          )}

          {pointsDiscount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#D97706', fontWeight: 700 }}>
              <span>{t('pos.pointsDiscount')} ({redeemedPoints} {t('pos.pointsBalance')})</span>
              <span>-{formatCurrency(pointsDiscount)}</span>
            </div>
          )}

          {serviceCharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{serviceChargeName || t('pos.serviceCharge')} ({serviceChargeRate}%)</span>
              <span>{formatCurrency(serviceCharge)}</span>
            </div>
          )}

          {tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>{taxName || t('pos.tax')} ({taxRate}%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
          )}

          <div
            style={{
              height: '1px',
              backgroundColor: 'var(--border)',
              margin: '6px 0',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{t('pos.total')}</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-600)' }}>
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Big Checkout Button */}
        <button
          onClick={openPaymentModal}
          disabled={cart.length === 0}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            border: 'none',
            backgroundColor: 'var(--primary-500)',
            color: '#FFFFFF',
            fontSize: '1.05rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
            opacity: cart.length === 0 ? 0.6 : 1,
            boxShadow: cart.length > 0 ? '0 6px 18px rgba(108, 92, 231, 0.35)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <span>{t('pos.pay')}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{formatCurrency(total)}</span>
            <ArrowRight size={18} />
          </div>
        </button>
      </div>
    </div>
  );
};
