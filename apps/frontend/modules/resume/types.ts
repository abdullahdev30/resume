import type { ResumeData } from "@/components/templates/TemplateOne";

export type ResumeKind = "template" | "ai" | "legacy_pdf";

export interface ResumeRecord {
  id: string;
  title: string;
  resume_type: ResumeKind;
  editable: boolean;
  template_id?: string | null;
  resume_data?: ResumeData | Record<string, unknown> | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type?: string | null;
  created_at: string;
  updated_at: string;
  download_url?: string | null;
  source_version: number;
}

export interface ResumeListResponse {
  resumes: ResumeRecord[];
}

export interface TemplateResumePayload {
  title: string;
  template_id: string;
  resume_data: ResumeData;
}

export interface AIResumePayload {
  title: string;
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
