export type GuestSectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certificates"
  | "languages"
  | "social_links";

export interface GuestPersonalInfo {
  fullName: string;
  professionalTitle: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  photoUrl: string;
}

export interface GuestExperience {
  displayPeriod?: string;
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface GuestEducation {
  displayPeriod?: string;
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface GuestProject {
  id: string;
  title: string;
  description: string;
  technologies: string;
  link: string;
}

export interface GuestCertificate {
  displayDate?: string;
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export interface GuestLanguage {
  id: string;
  name: string;
  proficiency: string;
}

export interface GuestResumeDocument {
  socialLabels?: Record<string,string>;
  personal: GuestPersonalInfo;
  summary: string;
  experience: GuestExperience[];
  education: GuestEducation[];
  skills: string[];
  projects: GuestProject[];
  certificates: GuestCertificate[];
  languages: GuestLanguage[];
  sectionOrder: GuestSectionKey[];
  appearance: {
    primaryColor: string;
    secondaryColor?: string;
    pageColor: string;
    fontFamily: string;
    pageSize: ResumePageSize;
    pageOrientation: "portrait" | "landscape";
    pageMargin: number;
    lineSpacing: number;
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    textAlign: "left" | "center" | "right";
    elementStyles: Record<string, ElementStyle>;
  };
}

export type RepeatableGuestSection = "experience" | "education" | "projects" | "certificates" | "languages";
import type { ElementStyle, ResumePageSize } from "@/components/templates/TemplateOne";

