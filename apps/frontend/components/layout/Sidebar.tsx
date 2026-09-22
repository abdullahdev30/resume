import type React from "react";

export function Sidebar({ children }: { children: React.ReactNode }) {
  return <aside className="app-sidebar">{children}</aside>;
}
