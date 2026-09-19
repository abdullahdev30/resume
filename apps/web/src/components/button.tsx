import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  // Variant color mapping using your CSS variables
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--primary)',
      color: 'var(--primary-foreground)',
      borderColor: 'var(--primary)',
    },
    secondary: {
      backgroundColor: 'var(--secondary)',
      color: 'var(--secondary-foreground)',
      borderColor: 'var(--border)',
    },
    error: {
      backgroundColor: 'var(--error)',
      color: 'var(--error-foreground)',
      borderColor: 'var(--error)',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--foreground)',
      borderColor: 'var(--border)',
    },
  };

  const sizeStyles = {
    sm: { padding: '0.25rem 0.6rem', fontSize: '0.75rem' },
    md: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    lg: { padding: '0.625rem 1.25rem', fontSize: '1rem' },
  };

  return (
    <button
      style={{
        borderRadius: 'var(--radius)',
        transition: 'var(--transition)',
        borderWidth: '1px',
        borderStyle: 'solid',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      disabled={disabled}
      className={`focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}