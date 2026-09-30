import type { ResumeData } from "@/components/templates/TemplateOne";

export type ResumeKind = "template" | "ai" | "legacy_pdf";

export interface ResumeRecord {
  id: string;
  title: string;
  resume_type: ResumeKind;
  editable: boolean;
  template_id?: string | null;
  resume_data?: ResumeData | Record<string, unknown> | null;
  html_content?: string | null;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  download_url: string;
}

export interface ResumeListResponse {
  resumes: ResumeRecord[];
}

export interface TemplateResumePayload {
  title: string;
  template_id: string;
  resume_data: ResumeData;
  html_content?: string;
}

export interface AIResumePayload {
  title: string;
  template_id?: string;
  prompt: string;
  job_description?: string;
  profile_context?: Record<string, unknown>;
}

export interface ResumeUpdatePayload {
  title?: string;
  template_id?: string;
  resume_data?: ResumeData;
  html_content?: string;
}

export interface AIEditPayload {
  instruction: string;
  job_description?: string;
}

export interface AIEditProposal {
  resume_data: ResumeData;
  html_content: string;
}
