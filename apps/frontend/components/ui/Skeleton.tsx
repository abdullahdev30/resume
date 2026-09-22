import type React from "react";

export function Skeleton({ style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: "1rem",
        borderRadius: "var(--radius)",
        background: "var(--muted)",
        ...style,
      }}
      {...props}
    />
  );
}
