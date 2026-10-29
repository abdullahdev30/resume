import type { ResumeData } from "@/components/templates/TemplateOne";
import type { TemplateItem } from "@/components/templates/catalog";
import type { EditorResumeData, RepeatableResumeSection } from "./types";

export function blankResume(template: TemplateItem): EditorResumeData {
  return normalizeResume({
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    experience: [],
    skills: [],
    languages: [],
    primaryColor: template.data.primaryColor,
    secondaryColor: template.data.secondaryColor,
    fontFamily: template.data.fontFamily,
    sectionOrder: template.data.sectionOrder,
  });
}

export function normalizeResume(data: ResumeData): EditorResumeData {
  return {
    ...data,
    education: data.education || [],
    projects: data.projects || [],
    certificates: data.certificates || [],
    socialLinks: data.socialLinks || [],
    sectionOrder: data.sectionOrder || [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certificates",
      "languages",
      "social_links",
    ],
    elementStyles: data.elementStyles || {},
    pageColor: data.pageColor || "#ffffff",
    fontFamily:
      !data.fontFamily || /Inter|Bricolage/.test(data.fontFamily)
        ? "Roboto, sans-serif"
        : data.fontFamily,
    pageSize: data.pageSize || "A4",
    pageOrientation: data.pageOrientation || "portrait",
    pageMargin: data.pageMargin ?? 10,
    lineSpacing: data.lineSpacing ?? 1.15,
  };
}

export const supportsProfilePhoto = (id: string) =>
  ["1", "2", "4", "5", "6"].includes(id);
export const profilePhotoShape = (id: string): "square" | "circle" =>
  ["4", "5"].includes(id) ? "square" : "circle";

export function createResumeEntry(
  data: EditorResumeData,
  section: RepeatableResumeSection,
): EditorResumeData {
  const id = crypto.randomUUID();
  switch (section) {
    case "experience":
      return {
        ...data,
        experience: [
          ...data.experience,
          { id, role: "", company: "", period: "", details: "" },
        ],
      };
    case "education":
      return {
        ...data,
        education: [
          ...data.education,
          { id, degree: "", institution: "", period: "", grade: "" },
        ],
      };
    case "projects":
      return {
        ...data,
        projects: [
          ...data.projects,
          { id, name: "", description: "", technologies: [], url: "" },
        ],
      };
    case "certificates":
      return {
        ...data,
        certificates: [
          ...data.certificates,
          { id, title: "", issuer: "", date: "" },
        ],
      };
  }
}

/** Visible IDs use the same collection indexes as the canonical renderer. */
export function editResumeText(
  data: EditorResumeData,
  id: string,
  value: string,
): EditorResumeData {
  const fields: Record<string, string> = {
    fullName: "fullName",
    jobTitle: "jobTitle",
    "contact-email": "email",
    "contact-phone": "phone",
    "contact-location": "location",
    summary: "summary",
  };
  if (fields[id]) return { ...data, [fields[id]!]: value };
  const list = id.match(/^(skill|language)-(\d+)$/);
  if (list) {
    const key = list[1] === "skill" ? "skills" : "languages";
    return {
      ...data,
      [key]: data[key].map((item, index) =>
        index === Number(list[2]) ? value : item,
      ),
    };
  }
  const entry = id.match(/^(exp|edu|project|certificate|social)-(\d+)-(.+)$/);
  if (!entry) return data;
  const collections = {
    exp: "experience",
    edu: "education",
    project: "projects",
    certificate: "certificates",
    social: "socialLinks",
  } as const;
  const key = collections[entry[1] as keyof typeof collections];
  if (!key) return data;
  const field = entry[3] === "inst" ? "institution" : entry[3]!;
  return {
    ...data,
    [key]: data[key].map((item, index) =>
      index === Number(entry[2])
        ? {
            ...item,
            [field]:
              field === "technologies"
                ? value
                    .split(",")
                    .map((text) => text.trim())
                    .filter(Boolean)
                : value,
          }
        : item,
    ),
  };
}
