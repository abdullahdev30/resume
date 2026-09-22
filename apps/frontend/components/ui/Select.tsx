import type React from "react";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ label, id, style, children, ...props }: SelectProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
      {label && <label htmlFor={id} style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</label>}
      <select
        id={id}
        style={{
          minHeight: "2.5rem",
          padding: "0.5rem 0.75rem",
          border: "1px solid var(--input)",
          borderRadius: "var(--radius)",
          background: "var(--background)",
          color: "var(--foreground)",
          ...style,
        }}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
