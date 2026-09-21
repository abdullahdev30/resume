"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authApi } from "../auth/api";
import type { User } from "../auth/types";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/onboarding", label: "Onboarding" },
  { href: "/settings", label: "Settings" },
];

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("onboarding_state");
      localStorage.removeItem(`onboarding_state:${user.id}`);
      router.push("/auth/login");
      router.refresh();
    }
  };

  const title =
    pathname === "/settings"
      ? "Settings"
      : pathname === "/onboarding"
        ? "Onboarding"
        : "Dashboard";

  return (
    <div className="app-shell">
      <aside
        className={`app-sidebar ${sidebarOpen ? "is-open" : "is-closed"}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <Link
            href="/dashboard"
            className="brand-mark"
            aria-label="Resume Builder dashboard"
          >
            RB
          </Link>
          <button
            type="button"
            className="icon-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            x
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? "sidebar-link is-active"
                  : "sidebar-link"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="app-main">
        <header className="top-navbar">
          <div className="navbar-left">
            {!sidebarOpen && (
              <button
                type="button"
                className="icon-button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open sidebar"
                title="Open sidebar"
              >
                =
              </button>
            )}
            <div>
              <p className="eyebrow">Resume Builder</p>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="navbar-actions">
            <div className="user-chip" aria-label="Current user">
              <span>{user.name || user.email}</span>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut ? "Signing out" : "Logout"}
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
