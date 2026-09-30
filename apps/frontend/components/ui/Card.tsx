import type React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

export function Card({
  className = "",
  padding = "md",
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "card",
        padding !== "none" ? `card-padding-${padding}` : "",
        interactive ? "card-interactive" : "",
        className,
      ].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
