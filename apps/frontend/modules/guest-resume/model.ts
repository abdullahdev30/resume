import type { ResumeData } from "@/components/templates/TemplateOne";
import type { TemplateItem } from "@/components/templates/catalog";

import type {
  GuestCertificate,
  GuestEducation,
  GuestExperience,
  GuestLanguage,
  GuestProject,
  GuestResumeDocument,
  RepeatableGuestSection,
} from "./types";

export const GUEST_SECTION_ORDER: GuestResumeDocument["sectionOrder"] = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certificates",
  "languages",
  "social_links",
];

const PHOTO_TEMPLATE_IDS = new Set(["1", "2", "4", "5", "6"]);
const SQUARE_PHOTO_TEMPLATE_IDS = new Set(["4", "5"]);

export function createBlankGuestResume(template: TemplateItem): GuestResumeDocument {
  return {
    personal: {
      fullName: "",
      professionalTitle: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      photoUrl: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certificates: [],
    languages: [],
    sectionOrder: [...(template.data.sectionOrder || GUEST_SECTION_ORDER)],
    appearance: {
      primaryColor: template.data.primaryColor || "#0E7C7B",
      secondaryColor: template.data.secondaryColor,
      pageColor: template.data.pageColor || "#ffffff",
      fontFamily: template.data.fontFamily || "Inter, sans-serif",
      pageSize: template.data.pageSize || "A4",
      pageOrientation: template.data.pageOrientation || "portrait",
      pageMargin: template.data.pageMargin ?? 10,
      lineSpacing: template.data.lineSpacing ?? 1.15,
      isBold: template.data.isBold || false,
      isItalic: template.data.isItalic || false,
      isUnderline: template.data.isUnderline || false,
      textAlign: template.data.textAlign || "left",
      elementStyles: { ...(template.data.elementStyles || {}) },
    },
  };
}

export function toTemplateResumeData(guest: GuestResumeDocument): ResumeData {
  const links = [
    ["Website", guest.personal.website],
    ["LinkedIn", guest.personal.linkedin],
    ["GitHub", guest.personal.github],
  ] as const;

  return {
    fullName: guest.personal.fullName,
    jobTitle: guest.personal.professionalTitle,
    email: guest.personal.email,
    phone: guest.personal.phone,
    location: guest.personal.location,
    avatarUrl: guest.personal.photoUrl || undefined,
    summary: guest.summary,
    primaryColor: guest.appearance.primaryColor,
    secondaryColor: guest.appearance.secondaryColor,
    pageColor: guest.appearance.pageColor,
    fontFamily: guest.appearance.fontFamily,
    pageSize: guest.appearance.pageSize,
    pageOrientation: guest.appearance.pageOrientation,
    pageMargin: guest.appearance.pageMargin,
    lineSpacing: guest.appearance.lineSpacing,
    isBold: guest.appearance.isBold,
    isItalic: guest.appearance.isItalic,
    isUnderline: guest.appearance.isUnderline,
    textAlign: guest.appearance.textAlign,
    sectionOrder: guest.sectionOrder,
    elementStyles: guest.appearance.elementStyles,
    experience: guest.experience
      .filter(hasExperienceContent)
      .map((item) => ({
        id: item.id,
        role: item.jobTitle,
        company: joinVisible([item.company, item.location]),
        period: formatPeriod(item.startDate, item.current ? "Present" : item.endDate),
        details: item.description,
      })),
    education: guest.education
      .filter(hasEducationContent)
      .map((item) => ({
        id: item.id,
        degree: item.degree,
        institution: joinVisible([item.institution, item.location]),
        period: formatPeriod(item.startDate, item.endDate),
        grade: item.description,
      })),
    skills: guest.skills.filter(hasText),
    projects: guest.projects
      .filter(hasProjectContent)
      .map((item) => ({
        id: item.id,
        name: item.title,
        description: item.description,
        url: item.link,
        technologies: item.technologies.split(",").map((value) => value.trim()).filter(Boolean),
      })),
    certificates: guest.certificates
      .filter(hasCertificateContent)
      .map((item) => ({ id: item.id, title: item.name, issuer: item.issuer, date: formatMonth(item.date) })),
    languages: guest.languages
      .filter((item) => hasText(item.name))
      .map((item) => joinVisible([item.name, item.proficiency], " — ")),
    socialLinks: links
      .filter((entry) => hasText(entry[1]))
      .map(([platform, url]) => ({ platform, url })),
  };
}

export function supportsProfilePhoto(templateId: string) {
  return PHOTO_TEMPLATE_IDS.has(templateId);
}

export function profilePhotoShape(templateId: string): "circle" | "square" {
  return SQUARE_PHOTO_TEMPLATE_IDS.has(templateId) ? "square" : "circle";
}

export function isGuestResumeDirty(resume: GuestResumeDocument): boolean {
  return Object.values(resume.personal).some(hasText)
    || hasText(resume.summary)
    || resume.skills.some(hasText)
    || resume.experience.some(hasExperienceContent)
    || resume.education.some(hasEducationContent)
    || resume.projects.some(hasProjectContent)
    || resume.certificates.some(hasCertificateContent)
    || resume.languages.some((item) => hasText(item.name) || hasText(item.proficiency));
}

export function createGuestEntry(section: RepeatableGuestSection) {
  const id = createId();
  switch (section) {
    case "experience":
      return { id, jobTitle: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" } satisfies GuestExperience;
    case "education":
      return { id, degree: "", institution: "", location: "", startDate: "", endDate: "", description: "" } satisfies GuestEducation;
    case "projects":
      return { id, title: "", description: "", technologies: "", link: "" } satisfies GuestProject;
    case "certificates":
      return { id, name: "", issuer: "", date: "" } satisfies GuestCertificate;
    case "languages":
      return { id, name: "", proficiency: "" } satisfies GuestLanguage;
  }
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function joinVisible(values: string[], separator = " · ") {
  return values.filter(hasText).join(separator);
}

function formatMonth(value: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${year}-${month}-01T00:00:00Z`));
}

function formatPeriod(start: string, end: string) {
  const visibleStart = formatMonth(start);
  const visibleEnd = end === "Present" ? end : formatMonth(end);
  return joinVisible([visibleStart, visibleEnd], " – ");
}

function hasExperienceContent(item: GuestExperience) {
  return hasText(item.jobTitle) || hasText(item.company) || hasText(item.location) || hasText(item.startDate) || hasText(item.endDate) || hasText(item.description);
}

function hasEducationContent(item: GuestEducation) {
  return hasText(item.degree) || hasText(item.institution) || hasText(item.location) || hasText(item.startDate) || hasText(item.endDate) || hasText(item.description);
}

function hasProjectContent(item: GuestProject) {
  return hasText(item.title) || hasText(item.description) || hasText(item.technologies) || hasText(item.link);
}

function hasCertificateContent(item: GuestCertificate) {
  return hasText(item.name) || hasText(item.issuer) || hasText(item.date);
}
