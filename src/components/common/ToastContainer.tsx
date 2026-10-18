import React from 'react';
import { useStore } from '../../stores/useStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((toast) => {
        let Icon = Info;
        let bg = 'var(--surface)';
        let border = 'var(--border)';
        let textCol = 'var(--text)';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bg = '#00B894';
          border = '#00B894';
          textCol = '#FFFFFF';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bg = '#D63031';
          border = '#D63031';
          textCol = '#FFFFFF';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bg = '#F0B429';
          border = '#F0B429';
          textCol = '#2D3436';
        }

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 18px',
              borderRadius: '12px',
              backgroundColor: bg,
              color: textCol,
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              border: `1px solid ${border}`,
              minWidth: '280px',
              maxWidth: '420px',
              animation: 'slideUp 0.25s ease',
              fontWeight: 500,
              fontSize: '0.9rem',
            }}
          >
            <Icon size={20} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: textCol,
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                opacity: 0.8,
              }}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
