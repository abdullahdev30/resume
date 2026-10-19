import { ArrowRight, CheckCircle2, FileText, LockKeyhole, Printer } from "lucide-react";
import Link from "next/link";

import { PublicHeader } from "@/components/layout/PublicHeader";

const steps = [
  { icon: FileText, title: "Choose a template", copy: "Start with one of the existing professional layouts." },
  { icon: CheckCircle2, title: "Add your details", copy: "Edit every section and see the resume update immediately." },
  { icon: Printer, title: "Save as PDF", copy: "Use your browser's print dialog to download an A4 PDF." },
];

export default function HomePage() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main>
        <section className="landing-hero" aria-labelledby="hero-title">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">Free guest resume builder</span>
            <h1 id="hero-title">Build Your Resume for Free</h1>
            <p>
              Select a proven template, enter your details, and save a professional resume as a PDF.
              Your information stays in this tab and is never uploaded.
            </p>
            <div className="landing-actions">
              <Link href="/templates" className="button button-primary button-lg">
                Create Resume <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <span className="landing-private-note">
                <LockKeyhole size={15} aria-hidden="true" /> No sign-up required
              </span>
            </div>
          </div>

          <div className="landing-document-preview" aria-label="Example professional resume">
              <div className="landing-document-sheet">
                <div className="landing-resume-mock" aria-hidden="true">
                  <header>
                    <span className="landing-resume-avatar" />
                    <div><strong>Alex Morgan</strong><span>Senior Product Designer</span></div>
                  </header>
                  <div className="landing-resume-rule" />
                  <section><strong>Professional profile</strong><span /><span /></section>
                  <section><strong>Experience</strong><span /><span /><span /></section>
                  <section><strong>Education</strong><span /><span /></section>
                  <div className="landing-resume-tags"><span /><span /><span /><span /></div>
                </div>
              </div>
              <div className="landing-document-caption">
                <span>Professional template</span>
                <span>A4 ready</span>
              </div>
          </div>
        </section>

        <section className="landing-steps" aria-labelledby="how-it-works-title">
          <div className="landing-section-heading">
            <span className="landing-eyebrow">Simple by design</span>
            <h2 id="how-it-works-title">From blank page to polished PDF</h2>
          </div>
          <div className="landing-step-grid">
            {steps.map(({ icon: Icon, title, copy }, index) => (
              <article key={title} className="landing-step">
                <span className="landing-step-number">0{index + 1}</span>
                <Icon size={20} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-privacy">
          <div>
            <span className="landing-eyebrow">Private by default</span>
            <h2>Your resume data disappears when you refresh or close the tab.</h2>
          </div>
          <p>No account, database record, cloud upload, tracking payload, or persistent browser storage is used for guest resumes.</p>
        </section>
      </main>
      <footer className="public-footer">
        <span>Resume Builder</span>
        <span>Free guest resumes, created locally in your browser.</span>
      </footer>
    </div>
  );
}
