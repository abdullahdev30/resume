import type React from "react";

type AlertVariant = "info" | "success" | "warning" | "error";

export function Alert({
  variant = "info",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={[
        "alert",
        `alert-${variant}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
