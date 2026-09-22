import type React from "react";

export function Card({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: "var(--card-bg-primary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "1rem",
        ...style,
      }}
      {...props}
    />
  );
}
