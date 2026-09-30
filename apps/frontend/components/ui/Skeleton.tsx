import type React from "react";

export function Skeleton({ style, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={["skeleton", className].filter(Boolean).join(" ")}
      style={{
        minHeight: "1rem",
        ...style,
      }}
      {...props}
    />
  );
}
