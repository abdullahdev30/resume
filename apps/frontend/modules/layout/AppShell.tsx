"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Layout, Settings, LogOut, Menu, X, User as UserIcon, Sparkles, FileText } from "lucide-react";

import { authApi } from "../auth/api";
import type { User } from "../auth/types";

interface AppShellProps {
  user: User;
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user_avatar");
      if (saved) setAvatarUrl(saved);
    }
  }, []);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("onboarding_state");
      if (user?.id) localStorage.removeItem(`onboarding_state:${user.id}`);
      router.push("/auth/login");
      router.refresh();
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/resumes", label: "My Resumes", icon: FileText },
    { href: "/templates", label: "Resume Templates", icon: Layout },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const displayName = user?.name || "Jane Doe";
  const userEmail = user?.email || "";
  const username = `@${userEmail.split("@")[0]?.toLowerCase() || "janedoe"}`;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col font-sans text-[var(--text)]">
      {/* 1. Professional Navbar: Logo on Left, User Avatar, Username & Name on Right */}
      <header className="h-16 bg-[var(--surface)] border-b border-[var(--border)] px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left Side: Logo & Mobile Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--primary-tint)] transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center space-x-3 group text-decoration-none">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-extrabold text-base shadow-sm group-hover:bg-[var(--primary-hover)] transition">
              RB
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-[var(--text)] tracking-tight leading-tight">
                Resume Builder
              </span>
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                Docs & Studio Editor
              </span>
            </div>
          </Link>
        </div>

        {/* Right Side: User Profile Pill with Avatar, Name, and Username */}
        <div className="flex items-center space-x-3">
          <Link
            href="/settings"
            className="flex items-center space-x-3 bg-[var(--bg)] hover:bg-[var(--primary-tint)] border border-[var(--border)] px-3.5 py-1.5 rounded-full transition text-decoration-none"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-[var(--on-primary)] flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0 shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span>{(displayName[0] || "U").toUpperCase()}</span>
              )}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[var(--text)] leading-tight">
                {displayName}
              </span>
              <span className="text-[10px] font-semibold text-[var(--primary)] leading-tight">
                {username}
              </span>
            </div>
          </Link>

          {/* Logout button */}
          <button
            onClick={logout}
            disabled={loggingOut}
            className="p-2 text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container with Sidebar & Content */}
      <div className="flex-1 flex min-h-0">
        {/* 2. Functional Sidebar */}
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-60 bg-[var(--surface)] border-r border-[var(--border)] p-4 flex flex-col justify-between transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <nav className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Main Menu
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition text-decoration-none ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                      : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)]"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[var(--border)] space-y-2">
            <div className="p-3 bg-[var(--primary-tint)] rounded-xl text-xs text-[var(--primary)] font-semibold flex items-center space-x-2">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>Theme System Active</span>
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
