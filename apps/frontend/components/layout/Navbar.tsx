import type React from "react";

export function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <header className="app-navbar">
      {children}
    </header>
  );
}
