import type React from "react";

export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <aside className="w-64 h-screen bg-slate-900 text-white flex flex-col justify-between border-r border-slate-800">
      {children}
    </aside>
  );
}
