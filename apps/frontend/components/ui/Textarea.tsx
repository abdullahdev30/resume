import type React from "react";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, id, style, ...props }: TextareaProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", width: "100%" }}>
      {label && <label htmlFor={id} style={{ fontSize: "0.875rem", fontWeight: 500 }}>{label}</label>}
      <textarea
        id={id}
        style={{
          minHeight: "6rem",
          padding: "0.5rem 0.75rem",
          border: `1px solid ${error ? "var(--error)" : "var(--input)"}`,
          borderRadius: "var(--radius)",
          background: "var(--background)",
          color: "var(--foreground)",
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ color: "var(--error)", fontSize: "0.75rem" }}>{error}</span>}
    </div>
  );
}
