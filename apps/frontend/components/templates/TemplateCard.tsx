"use client";

import { ArrowRight, Eye, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "@/components/feedback/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { ApiClientError } from "@/lib/api-client";
import { profileApi } from "@/modules/profile/api";
import type { ProfileResponse } from "@/modules/profile/types";
import { resumeApi } from "@/modules/resume/api";
import { profileToResumeData } from "@/modules/resume/profileSnapshot";
import type { ResumeData } from "./TemplateOne";
import { ResumeTemplateRenderer } from "./ResumeTemplateRenderer";
import type { TemplateItem } from "./catalog";

export type { TemplateItem } from "./catalog";

export const blankResumeData: ResumeData = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  primaryColor: "#0E7C7B",
  fontFamily: "Inter, sans-serif",
  skills: [],
  languages: [],
  experience: [],
  education: [],
  socialLinks: [],
  projects: [],
  certificates: [],
  pageSize: "A4",
  pageMargin: 10,
  lineSpacing: 1.15,
  elementStyles: {},
};

export function TemplateCard({
  item,
  onPreview,
  profile,
}: {
  item: TemplateItem;
  onPreview: (item: TemplateItem) => void;
  profile?: ProfileResponse | null;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleUseTemplate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const resume = await createTemplateResumeFromItem(item, profile);
      toast.success("A new independent resume was created from this template.", "Resume created");
      router.push(`/editor/${resume.template_id || item.id}?resumeId=${resume.id}`);
    } catch {
      toast.error("We could not create the resume. Check your profile connection and try again.", "Creation failed");
    } finally {
      setCreating(false);
    }
  };

  const handlePrintSample = () => {
    const printWindow = window.open(`/editor/${item.id}`, "_blank", "noopener,noreferrer");
    if (!printWindow) {
      toast.warning("Allow pop-ups to print this template sample.");
      return;
    }
    window.setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 900);
  };

  return (
    <Card padding="none" interactive className="group flex h-full flex-col overflow-hidden">
      <button
        type="button"
        onClick={() => onPreview(item)}
        className="template-card-preview relative aspect-[210/297] w-full overflow-hidden border-0 border-b border-[var(--border)] bg-white"
        aria-label={`Preview ${item.name}`}
      >
        <div className="template-card-preview-sheet pointer-events-none min-h-[297mm] w-[210mm] bg-white shadow-sm">
          {renderTemplate(item)}
        </div>
        <span className="absolute left-3 top-3"><Badge variant="primary">{item.tag}</Badge></span>
        <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <Eye size={16} aria-hidden="true" />
        </span>
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-3">
          <Badge variant="neutral">{item.category}</Badge>
          {item.updatedAt && <span className="text-[11px] text-[var(--text-muted)]">{item.updatedAt}</span>}
        </div>
        <h2 className="mt-3 text-base font-bold text-[var(--text)]">{item.name}</h2>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-[var(--text-muted)]">{item.description}</p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--border)] pt-4">
          <Tooltip label="Print template sample">
            <Button variant="ghost" size="sm" iconOnly onClick={handlePrintSample} aria-label={`Print ${item.name} sample`}>
              <Printer size={16} aria-hidden="true" />
            </Button>
          </Tooltip>
          <Button
            size="sm"
            onClick={() => void handleUseTemplate()}
            loading={creating}
            loadingLabel="Creating..."
          >
            Use template
            {!creating && <ArrowRight size={15} aria-hidden="true" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export async function createTemplateResumeFromItem(
  item: TemplateItem,
  profile?: ProfileResponse | null,
) {
  let resolvedProfile = profile;
  if (resolvedProfile == null) {
    try {
      resolvedProfile = await profileApi.getProfile();
    } catch (error) {
      if (!(error instanceof ApiClientError) || error.status !== 404) throw error;
      resolvedProfile = null;
    }
  }
  const profileData = resolvedProfile ? profileToResumeData(resolvedProfile) : blankResumeData;
  const resumeData: ResumeData = {
    ...blankResumeData,
    ...profileData,
    primaryColor: item.data.primaryColor || blankResumeData.primaryColor,
    fontFamily: item.data.fontFamily || blankResumeData.fontFamily,
  };

  return resumeApi.createTemplate({
    title: item.name,
    template_id: item.id,
    resume_data: resumeData,
  });
}

export function renderTemplate(item: TemplateItem) {
  return <ResumeTemplateRenderer templateId={item.id} data={item.data} />;
}
