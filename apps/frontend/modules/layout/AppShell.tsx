"use client";

import {
  FileText,
  Home,
  LayoutTemplate,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { toast } from "@/components/feedback/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Tooltip } from "@/components/ui/Tooltip";
import { authApi } from "../auth/api";
import type { User } from "../auth/types";
import { profileApi } from "../profile/api";
import { PROFILE_UPDATED_EVENT, type ProfileUpdatedDetail } from "../profile/events";

interface AppShellProps {
  user: User;
  initialAvatarUrl?: string;
  initialDisplayName?: string;
  children: React.ReactNode;
}

const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/resumes", label: "My Resumes", icon: FileText },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/settings", label: "Profile & Settings", icon: Settings },
];

export function AppShell({ user, initialAvatarUrl, initialDisplayName, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || "");
  const fallbackDisplayName = user.name || user.email.split("@")[0] || "User";
  const [displayName, setDisplayName] = useState(initialDisplayName || fallbackDisplayName);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (initialAvatarUrl !== undefined) return;
    profileApi
      .getProfile()
      .then((profile) => {
        setAvatarUrl(profile.personal.avatar_url || "");
        const savedName = [
          profile.personal.first_name || profile.personal.name,
          profile.personal.last_name,
        ].filter(Boolean).join(" ");
        if (savedName) setDisplayName(savedName);
      })
      .catch(() => setAvatarUrl(""));
  }, [initialAvatarUrl]);

  useEffect(() => {
    const updateProfile = (event: Event) => {
      const detail = (event as CustomEvent<ProfileUpdatedDetail>).detail;
      if (detail.displayName) setDisplayName(detail.displayName);
      if (detail.avatarUrl !== undefined) setAvatarUrl(detail.avatarUrl);
    };
    window.addEventListener(PROFILE_UPDATED_EVENT, updateProfile);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, updateProfile);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mobileOpen]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
      toast.success("You have been signed out.");
      router.push("/auth/login");
      router.refresh();
    } catch {
      toast.error("We could not sign you out. Please try again.", "Sign out failed");
    } finally {
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="app-navbar">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            iconOnly
            className="md:hidden"
            onClick={() => setMobileOpen((current) => !current)}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </Button>

          <Link href="/dashboard" className="app-brand" aria-label="Resume Builder dashboard">
            <span className="brand-mark">RB</span>
            <span className="app-brand-copy">
              <span className="app-brand-name">Resume Builder</span>
              <span className="app-brand-meta">Your career workspace</span>
            </span>
          </Link>
        </div>

        <div className="app-navbar-actions">
          <ThemeToggle />
          <Link href="/settings" className="profile-chip" aria-label="Open profile settings">
            <Avatar src={avatarUrl} alt={displayName} fallback={displayName.slice(0, 1)} size={34} />
            <span className="profile-chip-copy">
              <span className="profile-chip-name">{displayName}</span>
              <span className="profile-chip-email">{user.email}</span>
            </span>
          </Link>
          <Tooltip label="Sign out">
            <Button variant="ghost" iconOnly onClick={() => setLogoutOpen(true)} aria-label="Sign out">
              <LogOut size={18} aria-hidden="true" />
            </Button>
          </Tooltip>
        </div>
      </header>

      <div className="app-workspace">
        {mobileOpen && (
          <button className="mobile-backdrop md:hidden" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
        )}
        <aside className={["app-sidebar", mobileOpen ? "is-open" : ""].filter(Boolean).join(" ")}>
          <nav className="sidebar-nav" aria-label="Main navigation">
            <div className="sidebar-label">Workspace</div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={["sidebar-link", active ? "is-active" : ""].filter(Boolean).join(" ")}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <Link href="/resumes/create/ai" className="sidebar-tip">
              <Sparkles size={16} aria-hidden="true" />
              <span>Create with AI</span>
            </Link>
          </div>
        </aside>

        <main className="app-main">{children}</main>
      </div>

      <ConfirmDialog
        open={logoutOpen}
        title="Sign out?"
        description="You will need to sign in again to access your resumes."
        onClose={() => !loggingOut && setLogoutOpen(false)}
        preventClose={loggingOut}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setLogoutOpen(false)} disabled={loggingOut}>
            Stay signed in
          </Button>
          <Button variant="danger" onClick={logout} loading={loggingOut} loadingLabel="Signing out...">
            Sign out
          </Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
