import React, { useState } from 'react';
import { useStore } from '../../stores/useStore';
import { useTranslation } from '../../utils/useTranslation';
import { hasPageAccess, PAGE_PERMISSIONS } from '../../utils/rbac';
import { PageLockModal } from './PageLockModal';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  Receipt,
  BarChart3,
  Package,
  Users,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    sidebarExpanded,
    toggleSidebar,
    heldTransactions,
    currentEmployee,
    authorizedPages,
  } = useStore();
  const { t } = useTranslation();

  const [lockedTargetPage, setLockedTargetPage] = useState<string | null>(null);

  const navItems = [
    { id: 'pos', label: t('nav.pos'), icon: ShoppingCart, shortcut: '1', badge: heldTransactions.length > 0 ? heldTransactions.length : null },
    { id: 'transactions', label: t('nav.transactions'), icon: Receipt, shortcut: '2' },
    { id: 'reports', label: t('nav.reports'), icon: BarChart3, shortcut: '3' },
    { id: 'products', label: t('nav.products'), icon: Package, shortcut: '4' },
    { id: 'customers', label: t('nav.customers'), icon: Users, shortcut: '5' },
    { id: 'shifts', label: t('nav.shifts'), icon: Clock, shortcut: '6' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, shortcut: '7' },
  ];

  const width = sidebarExpanded ? '230px' : '78px';

  return (
    <aside
      className="sidebar"
      style={{
        width,
        transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 10px',
        userSelect: 'none',
        flexShrink: 0,
        height: 'calc(100vh - 68px)',
        position: 'relative',
        zIndex: 30,
      }}
    >
      {/* ── Navigation Links with Gliding Animated Pill ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          const isAllowed = hasPageAccess(currentEmployee?.role, item.id, authorizedPages);

          return (
            <motion.button
              key={item.id}
              onClick={() => {
                if (!isAllowed) {
                  setLockedTargetPage(item.id);
                } else {
                  setCurrentPage(item.id);
                }
              }}
              whileHover={{ x: sidebarExpanded ? 4 : 0, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: sidebarExpanded ? '11px 14px' : '12px',
                borderRadius: '14px',
                border: 'none',
                backgroundColor: 'transparent',
                color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                cursor: 'pointer',
                position: 'relative',
                justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                outline: 'none',
                zIndex: 1,
              }}
              title={
                !isAllowed
                  ? `${item.label} (Terkunci - Butuh PIN ${PAGE_PERMISSIONS[item.id]?.requiredRoleLabel || 'Supervisor'})`
                  : `${item.label} (${item.shortcut})`
              }
            >
              {/* Animated Gliding Active Background Pill */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                    boxShadow: '0 6px 18px rgba(108, 92, 231, 0.38)',
                    zIndex: -1,
                  }}
                />
              )}

              {/* Glowing active edge indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  style={{
                    position: 'absolute',
                    left: '-6px',
                    width: '4px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 0 10px #FFFFFF',
                  }}
                />
              )}

              {/* Icon Container with micro-bounce & lock indicator */}
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'transform 0.18s ease',
                  color: isActive ? '#FFFFFF' : 'inherit',
                }}
              >
                <Icon size={21} style={{ flexShrink: 0, opacity: isAllowed ? 1 : 0.65 }} />
                {!isAllowed && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-6px',
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      backgroundColor: '#F59E0B',
                      color: '#FFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  >
                    <Lock size={8} />
                  </span>
                )}
              </div>

              {/* Label */}
              {sidebarExpanded && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: isActive ? 800 : 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: isActive ? '#FFFFFF' : 'var(--text)',
                      opacity: isAllowed ? 1 : 0.75,
                    }}
                  >
                    {item.label}
                  </span>
                  {!isAllowed && (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 5px',
                        borderRadius: '5px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#F59E0B',
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        gap: '3px',
                        flexShrink: 0,
                      }}
                      title={`Terkunci untuk Kasir. Butuh PIN ${PAGE_PERMISSIONS[item.id]?.requiredRoleLabel || 'Supervisor'}`}
                    >
                      <Lock size={10} />
                    </span>
                  )}
                </div>
              )}

              {/* Shortcut Tag */}
              {sidebarExpanded && !item.badge && (
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'rgba(255,255,255,0.18)' : 'var(--bg)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    border: isActive ? 'none' : '1px solid var(--border)',
                  }}
                >
                  {item.shortcut}
                </span>
              )}

              {/* Badge for held bills (Only shown when badge is a positive number) */}
              {typeof item.badge === 'number' && item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  style={{
                    position: sidebarExpanded ? 'relative' : 'absolute',
                    top: sidebarExpanded ? 'auto' : '6px',
                    right: sidebarExpanded ? 'auto' : '6px',
                    marginLeft: sidebarExpanded ? 'auto' : 0,
                    backgroundColor: '#FD79A8',
                    color: '#FFF',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderRadius: '12px',
                    padding: '2px 7px',
                    minWidth: '20px',
                    textAlign: 'center',
                    boxShadow: '0 2px 6px rgba(253, 121, 168, 0.5)',
                  }}
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Bottom Toggle & System Status ─────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleSidebar}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            gap: '12px',
            padding: sidebarExpanded ? '10px 14px' : '11px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            transition: 'all 0.15s ease',
          }}
          title={sidebarExpanded ? t('nav.collapse') : t('nav.expand')}
        >
          {sidebarExpanded ? (
            <>
              <ChevronLeft size={18} />
              <span>{t('nav.collapse')}</span>
            </>
          ) : (
            <ChevronRight size={18} />
          )}
        </motion.button>

        {sidebarExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '10px 12px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary-50) 0%, rgba(108, 92, 231, 0.05) 100%)',
              border: '1px solid var(--primary-100)',
              color: 'var(--primary-700)',
              fontSize: '0.74rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <img
              src={logoImg}
              alt="C-POS"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                objectFit: 'contain',
                flexShrink: 0,
                filter: 'drop-shadow(0 2px 4px rgba(0, 184, 148, 0.2))',
              }}
            />
            <span>{t('nav.offlineDesktop')}</span>
          </motion.div>
        )}
      </div>

      {/* ── RBAC Page Lock Modal ── */}
      <PageLockModal
        isOpen={!!lockedTargetPage}
        pageId={lockedTargetPage}
        onClose={() => setLockedTargetPage(null)}
        onSuccess={(unlockedPageId) => {
          setCurrentPage(unlockedPageId);
          setLockedTargetPage(null);
        }}
      />
    </aside>
  );
};
