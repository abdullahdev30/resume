"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Home, Layout, Settings, LogOut, Menu, X } from "lucide-react";

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
      localStorage.removeItem(`onboarding_state:${user.id}`);
      router.push("/auth/login");
      router.refresh();
    }
  };

  const navItems = [
    { href: "/dashboard", label: "Home", icon: Home },
    { href: "/templates", label: "Templates", icon: Layout },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col font-sans text-[#0F1B2D]">
      {/* Navbar: Logo on Left, User Profile with Avatar on Right */}
      <header className="h-16 bg-white border-b border-[#E3E8EE] px-4 md:px-8 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        {/* Left: Logo & Mobile Toggle */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-[#5B6B7F] hover:bg-[#E3F4F3]"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#0E7C7B] text-white flex items-center justify-center font-extrabold text-base shadow-sm group-hover:bg-[#0A6463] transition">
              RB
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg text-[#0F1B2D] tracking-tight leading-tight">
                Resume Builder
              </span>
              <span className="text-[11px] text-[#5B6B7F] font-medium">
                Professional Builder
              </span>
            </div>
          </Link>
        </div>

        {/* Right: User Avatar & Name */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 bg-[#F7F9FB] border border-[#E3E8EE] px-3 py-1.5 rounded-full">
            <div className="w-8 h-8 rounded-full bg-[#0E7C7B] text-white flex items-center justify-center font-bold text-xs overflow-hidden flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(user.name?.[0] || user.email[0] || "U").toUpperCase()}</span>
              )}
            </div>
            <span className="text-sm font-semibold text-[#0F1B2D] hidden sm:inline">
              {user.name || user.email}
            </span>
          </div>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="p-2 text-[#5B6B7F] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex min-h-0">
        {/* Sidebar: Exactly 3 options (Home, Templates, Settings) */}
        <aside
          className={`fixed md:sticky top-16 z-30 h-[calc(100vh-4rem)] w-60 bg-white border-r border-[#E3E8EE] p-4 flex flex-col justify-between transition-transform duration-200 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <nav className="space-y-1.5">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#5B6B7F]">
              Navigation
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
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-sm transition ${
                    isActive
                      ? "bg-[#0E7C7B] text-white shadow-sm"
                      : "text-[#5B6B7F] hover:bg-[#E3F4F3] hover:text-[#0E7C7B]"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#E3E8EE]">
            <div className="p-3 bg-[#E3F4F3] rounded-xl text-xs text-[#0E7C7B] font-medium text-center">
              Matched Auth Color System
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
