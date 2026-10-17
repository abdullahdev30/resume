import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuestResumeEditor } from "@/components/guest-editor/GuestResumeEditor";
import { templateCatalog } from "@/components/templates/catalog";

import SavedResumeEditor from "./SavedResumeEditor";

type EditorPageProps = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export function generateStaticParams() {
  return templateCatalog.map(({ id }) => ({ templateId: id }));
}

export async function generateMetadata({ params }: EditorPageProps): Promise<Metadata> {
  const { templateId } = await params;
  const template = templateCatalog.find(({ id }) => id === templateId);
  if (!template) return { title: "Template not found" };
  return {
    title: `Edit ${template.name}`,
    description: "Build a private guest resume in your browser and save it as a PDF.",
  };
}

export default async function EditorPage({ params, searchParams }: EditorPageProps) {
  const [{ templateId }, query] = await Promise.all([params, searchParams]);
  const template = templateCatalog.find(({ id }) => id === templateId);
  if (!template) notFound();

  if (typeof query.resumeId === "string") return <SavedResumeEditor />;
  return <GuestResumeEditor template={template} />;
}
