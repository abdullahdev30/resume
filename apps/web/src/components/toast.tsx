import React, { useEffect } from 'react';

export interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type = 'info',
  isOpen,
  onClose,
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const typeBackgrounds = {
    info: 'var(--foreground)',
    success: 'var(--success)',
    error: 'var(--error)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 50,
        backgroundColor: typeBackgrounds[type],
        color: 'var(--background)',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minWidth: '260px',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'inherit',
          cursor: 'pointer',
          marginLeft: '1rem',
          fontSize: '1rem',
          opacity: 0.8,
        }}
      >
        ✕
      </button>
    </div>
  );
}