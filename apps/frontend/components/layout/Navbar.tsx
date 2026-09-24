import type React from "react";

export function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {children}
    </header>
  );
}
