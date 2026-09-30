import type React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "primary" | "info" | "success" | "warning" | "error";
}

export function Badge({ variant = "neutral", className = "", ...props }: BadgeProps) {
  return <span className={["badge", `badge-${variant}`, className].filter(Boolean).join(" ")} {...props} />;
}
