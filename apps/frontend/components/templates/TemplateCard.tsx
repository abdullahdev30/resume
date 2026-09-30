"use client";

import { ArrowRight, Eye, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { toast } from "@/components/feedback/Toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tooltip } from "@/components/ui/Tooltip";
import { profileApi } from "@/modules/profile/api";
import { resumeApi } from "@/modules/resume/api";
import { profileToResumeData } from "@/modules/resume/profileSnapshot";
import type { ResumeData } from "./TemplateOne";
import TemplateOne from "./TemplateOne";
import TemplateTwo from "./TemplateTwo";
import TemplateThree from "./TemplateThree";
import TemplateFour from "./TemplateFour";
import TemplateFive from "./TemplateFive";
import TemplateSix from "./TemplateSix";
import type { TemplateItem } from "./catalog";

export type { TemplateItem } from "./catalog";

const blankResumeData: ResumeData = {
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
};

export function TemplateCard({
  item,
  onPreview,
}: {
  item: TemplateItem;
  onPreview: (item: TemplateItem) => void;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleUseTemplate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const resume = await createTemplateResumeFromItem(item);
      toast.success("Your profile was copied into a new independent resume.", "Resume created");
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
        className="relative h-80 w-full overflow-hidden border-0 border-b border-[var(--border)] bg-white"
        aria-label={`Preview ${item.name}`}
      >
        <div className="pointer-events-none mx-auto mt-1 min-h-[297mm] w-[210mm] origin-top scale-[0.48] bg-white shadow-sm transition-transform duration-200 group-hover:scale-[0.5]">
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

export async function createTemplateResumeFromItem(item: TemplateItem) {
  const profileData = profileToResumeData(await profileApi.getProfile());
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
  const data = item.data;
  switch (item.id) {
    case "1": return <TemplateOne data={data} />;
    case "2": return <TemplateTwo data={data} />;
    case "3": return <TemplateThree data={data} />;
    case "4": return <TemplateFour data={data} />;
    case "5": return <TemplateFive data={data} />;
    case "6": return <TemplateSix data={data} />;
    default: return <TemplateOne data={data} />;
  }
}
