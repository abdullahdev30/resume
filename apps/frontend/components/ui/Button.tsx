import type React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  iconOnly?: boolean;
  children: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  loadingLabel,
  fullWidth = false,
  iconOnly = false,
  type = "button",
  ...props
}: ButtonProps) {
  const classes = [
    "button",
    `button-${variant}`,
    size !== "md" ? `button-${size}` : "",
    fullWidth ? "button-full" : "",
    iconOnly ? "button-icon-only" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
