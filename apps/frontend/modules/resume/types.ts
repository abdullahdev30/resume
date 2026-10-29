import type { ResumeData } from "@/components/templates/TemplateOne";

// Same wire schema as ResumeData; the editor fills optional collections/defaults.
export type EditorResumeData = ResumeData &
  Required<
    Pick<
      ResumeData,
      | "education"
      | "projects"
      | "certificates"
      | "socialLinks"
      | "sectionOrder"
      | "elementStyles"
      | "pageColor"
      | "fontFamily"
      | "pageSize"
      | "pageOrientation"
      | "pageMargin"
      | "lineSpacing"
    >
  >;
export type ResumeSectionKey = EditorResumeData["sectionOrder"][number];
export type RepeatableResumeSection =
  "experience" | "education" | "projects" | "certificates";

export type ResumeKind = "template" | "ai" | "legacy_pdf";

export interface ResumeRecord {
  pdf_ready?: boolean;
  pdf_error?: string | null;
  id: string;
  title: string;
  resume_type: ResumeKind;
  editable: boolean;
  template_id?: string | null;
  template_version?: number;
  resume_data?: ResumeData | Record<string, unknown> | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
  source_version: number;
}

export interface ResumeListResponse {
  resumes: ResumeRecord[];
}

export interface ResumePdfResponse {
  download_url: string;
}

export interface TemplateResumePayload {
  title: string;
  template_id: string;
  resume_data: ResumeData;
  html_content?: string;
  resume_type?: "template" | "ai";
  persona_id?: string;
  template_version?: number;
}

export interface AIResumePayload {
  title: string;
  persona_id: string;
  prompt: string;
  job_description?: string;
  reference_links?: string[];
  selected_sections?: Array<
    | "personal"
    | "summary"
    | "skills"
    | "experience"
    | "education"
    | "projects"
    | "certificates"
    | "languages"
    | "social_links"
  >;
}

export interface ResumeUpdatePayload {
  title?: string;
  template_id?: string;
  resume_data?: ResumeData;
  source_version?: number;
  html_content?: string;
}

export interface AIEditPayload {
  instruction: string;
  job_description?: string;
  reference_links?: string[];
}

export interface AIEditProposal {
  resume_data: ResumeData;
  template_id: string;
}
