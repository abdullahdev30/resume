import type React from "react";

export function Navbar({ children }: { children: React.ReactNode }) {
  return <nav className="sidebar-nav">{children}</nav>;
}
