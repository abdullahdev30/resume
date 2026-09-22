import type React from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="auth-page">
      <section className="auth-brand-panel" aria-label="Resume Builder">
        <div className="auth-logo">RB</div>
        <div className="auth-brand-copy">
          <h1>Build a resume that looks like you.</h1>
          <p>
            Shape a polished profile with guided steps, clear structure, and a
            live resume preview.
          </p>
        </div>
        <div className="mini-resume" aria-hidden="true">
          <div>
            <div className="mini-resume-name">Jane Doe</div>
            <div className="field-hint">Product designer · jane@mail.com</div>
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
          <div className="auth-mobile-logo">RB</div>
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
