import type React from "react";

export function Badge({ style, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: "1.5rem",
        borderRadius: "999px",
        padding: "0 0.625rem",
        background: "var(--secondary)",
        color: "var(--secondary-foreground)",
        fontSize: "0.75rem",
        fontWeight: 700,
        ...style,
      }}
      {...props}
    />
  );
}
