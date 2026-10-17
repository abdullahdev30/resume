import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicHeader } from "@/components/layout/PublicHeader";
import { ResumeTemplateRenderer } from "@/components/templates/ResumeTemplateRenderer";
import { templateCatalog } from "@/components/templates/catalog";

export function generateStaticParams() {
  return templateCatalog.map(({ id }) => ({ templateId: id }));
}

export async function generateMetadata({ params }: PageProps<"/templates/[templateId]">): Promise<Metadata> {
  const { templateId } = await params;
  const template = templateCatalog.find(({ id }) => id === templateId);
  if (!template) return { title: "Template not found" };
  return { title: `${template.name} Preview`, description: template.description };
}

export default async function TemplatePreviewPage({ params }: PageProps<"/templates/[templateId]">) {
  const { templateId } = await params;
  const template = templateCatalog.find(({ id }) => id === templateId);
  if (!template) notFound();

  return (
    <div className="public-page">
      <PublicHeader />
      <main className="template-detail-page">
        <div className="template-detail-header">
          <div>
            <Link href="/templates" className="template-back-link"><ArrowLeft size={16} aria-hidden="true" /> All templates</Link>
            <span className="landing-eyebrow">{template.category} template</span>
            <h1>{template.name}</h1>
            <p>{template.description}</p>
          </div>
          <Link href={`/editor/${template.id}`} className="button button-primary">
            Use this template <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="template-detail-stage" aria-label={`${template.name} full preview`}>
          <div className="template-detail-sheet">
            <ResumeTemplateRenderer templateId={template.id} data={template.data} />
          </div>
        </div>
      </main>
    </div>
  );
}
