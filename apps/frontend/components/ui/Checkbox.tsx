import React from 'react';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export function Checkbox({ label, id, style, className = '', ...props }: CheckboxProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="checkbox"
        id={id}
        style={{
          width: '1rem',
          height: '1rem',
          accentColor: 'var(--primary)',
          cursor: 'pointer',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          ...style,
        }}
        className={className}
        {...props}
      />
      {label && (
        <label 
          htmlFor={id} 
          style={{ fontSize: '0.875rem', color: 'var(--foreground)', cursor: 'pointer' }}
        >
          {label}
        </label>
      )}
    </div>
  );
}