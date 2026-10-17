import { ArrowRight, Eye, LayoutTemplate } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { ResumeTemplateRenderer } from "@/components/templates/ResumeTemplateRenderer";
import { templateCatalog } from "@/components/templates/catalog";

export const metadata: Metadata = {
  title: "Free Resume Templates",
  description: "Choose a professional resume template and start building without an account.",
};

export default function TemplatesPage() {
  return (
    <div className="public-page">
      <PublicHeader />
      <main className="template-gallery-page">
        <header className="template-gallery-heading">
          <span className="landing-eyebrow"><LayoutTemplate size={15} aria-hidden="true" /> Template gallery</span>
          <h1>Choose your resume template</h1>
          <p>Every template below is free to use, renders from the same resume data, and is formatted for A4 printing.</p>
        </header>

        <section className="template-gallery-grid" aria-label="Free resume templates">
          {templateCatalog.map((template) => (
            <article className="guest-template-card" key={template.id}>
              <Link
                href={`/templates/${template.id}`}
                className="guest-template-sheet"
                aria-label={`Preview ${template.name}`}
              >
                <div className="guest-template-scale" aria-hidden="true">
                  <ResumeTemplateRenderer templateId={template.id} data={template.data} />
                </div>
                <span className="template-tag">{template.tag}</span>
              </Link>
              <div className="guest-template-copy">
                <span className="template-category">{template.category}</span>
                <h2>{template.name}</h2>
                <p>{template.description}</p>
                <div className="guest-template-actions">
                  <Link href={`/templates/${template.id}`} className="button button-secondary button-sm">
                    <Eye size={15} aria-hidden="true" /> Preview
                  </Link>
                  <Link href={`/editor/${template.id}`} className="button button-primary button-sm">
                    Use template <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <footer className="public-footer">
        <span>Resume Builder</span>
        <span>Your guest resume stays only in temporary memory.</span>
      </footer>
    </div>
  );
}
