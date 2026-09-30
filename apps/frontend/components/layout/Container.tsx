import type React from "react";

export function Container({
  as: Component = "div",
  className = "",
  ...props
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "main" }) {
  return <Component className={["mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className].filter(Boolean).join(" ")} {...props} />;
}
