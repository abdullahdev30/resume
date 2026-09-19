import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = '',
  style,
  ...props
}: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', width: '100%' }}>
      {label && (
        <label 
          htmlFor={id} 
          style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}
        >
          {label}
        </label>
      )}
      <input
        id={id}
        style={{
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          backgroundColor: 'var(--background)',
          color: 'var(--foreground)',
          border: `1px solid ${error ? 'var(--error)' : 'var(--input)'}`,
          borderRadius: 'var(--radius)',
          outline: 'none',
          transition: 'var(--transition)',
          ...style,
        }}
        className={className}
        {...props}
      />
      {error && (
        <span style={{ fontSize: '0.75rem', color: 'var(--error)' }}>
          {error}
        </span>
      )}
    </div>
  );
}