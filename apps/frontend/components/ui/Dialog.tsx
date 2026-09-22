import type React from "react";

export type DialogProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function Dialog({ open, title, children, onClose }: DialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        background: "rgb(17 24 39 / 45%)",
        padding: "1rem",
      }}
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: "100%",
          maxWidth: "32rem",
          background: "var(--card-bg-primary)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "1rem",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {title && <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>{title}</h2>}
        {children}
      </section>
    </div>
  );
}
