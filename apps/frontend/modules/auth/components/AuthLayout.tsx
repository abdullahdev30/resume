import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import type React from "react";

import { BrandLogo } from "@/components/common/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Resume Builder">
        <Link className="auth-logo" href="/auth/login" aria-label="Resume Builder home">
          <BrandLogo priority />
        </Link>
        <div className="auth-brand-copy">
          <div className="page-eyebrow"><Sparkles size={15} aria-hidden="true" /> Your story, clearly told</div>
          <h1>Build a resume that feels unmistakably yours.</h1>
          <p>
            Turn your real experience into a polished, focused resume with guided editing and a live preview.
          </p>
          <ul className="auth-benefits">
            <li><CheckCircle2 size={18} aria-hidden="true" /> Start from your saved profile</li>
            <li><CheckCircle2 size={18} aria-hidden="true" /> Edit every section in one workspace</li>
            <li><ShieldCheck size={18} aria-hidden="true" /> Keep your documents private and secure</li>
          </ul>
        </div>
        <div className="mini-resume" aria-hidden="true">
          <div>
            <div className="mini-resume-name">Your Name</div>
            <div className="field-hint">Role title · email@example.com</div>
          </div>
          <div className="mini-resume-section">
            <div className="mini-resume-line is-primary" />
            <div className="mini-resume-line is-muted" />
            <div className="mini-resume-line" />
          </div>
          <div className="mini-resume-section">
            <div className="mini-resume-line is-muted" />
            <div className="mini-resume-line" />
          </div>
        </div>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="flex items-center justify-between">
            <Link className="auth-mobile-logo" href="/auth/login" aria-label="Resume Builder home">
              <BrandLogo priority />
            </Link>
            <span className="ml-auto"><ThemeToggle /></span>
          </div>
          <div className="form-stack">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
