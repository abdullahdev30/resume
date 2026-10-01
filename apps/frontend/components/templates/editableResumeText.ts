import type { ResumeData } from "./TemplateOne";

export interface EditableResumeText {
  id: string;
  label: string;
  value: string;
  multiline?: boolean;
}

type StringField = "fullName" | "jobTitle" | "email" | "phone" | "location" | "summary";

const directFields: Record<string, { field: StringField; label: string; multiline?: boolean }> = {
  fullName: { field: "fullName", label: "Full name" },
  jobTitle: { field: "jobTitle", label: "Professional title" },
  "contact-email": { field: "email", label: "Email" },
  "contact-phone": { field: "phone", label: "Phone" },
  "contact-location": { field: "location", label: "Location" },
  summary: { field: "summary", label: "Professional summary", multiline: true },
};

export function getEditableResumeText(data: ResumeData, id: string | null): EditableResumeText | null {
  if (!id) return null;
  const direct = directFields[id];
  if (direct) return { id, label: direct.label, value: data[direct.field], multiline: direct.multiline };

  let match = id.match(/^skill-(\d+)$/);
  if (match) return arrayValue(id, "Skill", data.skills, match[1] || "");
  match = id.match(/^language-(\d+)$/);
  if (match) return arrayValue(id, "Language", data.languages, match[1] || "");

  match = id.match(/^exp-(\d+)-(role|company|period|details)$/);
  if (match) {
    const item = data.experience[Number(match[1])];
    if (!item) return null;
    const field = match[2] as "role" | "company" | "period" | "details";
    return {
      id,
      label: `Experience ${field === "details" ? "description" : field}`,
      value: item[field],
      multiline: field === "details",
    };
  }

  match = id.match(/^edu-(\d+)-(degree|inst|institution|period|grade)$/);
  if (match) {
    const item = data.education?.[Number(match[1])];
    if (!item) return null;
    const requestedField = match[2];
    const field = requestedField === "inst" ? "institution" : requestedField as "degree" | "institution" | "period" | "grade";
    return { id, label: `Education ${field}`, value: item[field] || "" };
  }

  match = id.match(/^project-(\d+)-(name|description|technologies|url)$/);
  if (match) {
    const item = data.projects?.[Number(match[1])];
    if (!item) return null;
    const field = match[2] as "name" | "description" | "technologies" | "url";
    return {
      id,
      label: `Project ${field}`,
      value: field === "technologies" ? item.technologies.join(", ") : item[field] || "",
      multiline: field === "description",
    };
  }

  match = id.match(/^certificate-(\d+)-(title|issuer|date|url)$/);
  if (match) {
    const item = data.certificates?.[Number(match[1])];
    if (!item) return null;
    const field = match[2] as "title" | "issuer" | "date" | "url";
    return { id, label: `Certificate ${field}`, value: item[field] || "" };
  }

  match = id.match(/^social-(\d+)-(platform|url)$/);
  if (match) {
    const item = data.socialLinks?.[Number(match[1])];
    if (!item) return null;
    const field = match[2] as "platform" | "url";
    return { id, label: `Link ${field}`, value: item[field] };
  }

  return null;
}

export function updateEditableResumeText(data: ResumeData, id: string, value: string): ResumeData {
  const direct = directFields[id];
  if (direct) return { ...data, [direct.field]: value };

  let match = id.match(/^skill-(\d+)$/);
  if (match) return updateStringArray(data, "skills", Number(match[1]), value);
  match = id.match(/^language-(\d+)$/);
  if (match) return updateStringArray(data, "languages", Number(match[1]), value);

  match = id.match(/^exp-(\d+)-(role|company|period|details)$/);
  if (match) {
    const index = Number(match[1]);
    const field = match[2] as "role" | "company" | "period" | "details";
    const item = data.experience[index];
    if (!item) return data;
    const experience = [...data.experience];
    experience[index] = { ...item, [field]: value };
    return { ...data, experience };
  }

  match = id.match(/^edu-(\d+)-(degree|inst|institution|period|grade)$/);
  if (match) {
    const index = Number(match[1]);
    const education = [...(data.education || [])];
    if (!education[index]) return data;
    const requestedField = match[2];
    const field = requestedField === "inst" ? "institution" : requestedField as "degree" | "institution" | "period" | "grade";
    education[index] = { ...education[index], [field]: value };
    return { ...data, education };
  }

  match = id.match(/^project-(\d+)-(name|description|technologies|url)$/);
  if (match) {
    const index = Number(match[1]);
    const projects = [...(data.projects || [])];
    if (!projects[index]) return data;
    const field = match[2] as "name" | "description" | "technologies" | "url";
    projects[index] = {
      ...projects[index],
      [field]: field === "technologies"
        ? value.split(",").map((item) => item.trim()).filter(Boolean)
        : value,
    };
    return { ...data, projects };
  }

  match = id.match(/^certificate-(\d+)-(title|issuer|date|url)$/);
  if (match) {
    const index = Number(match[1]);
    const certificates = [...(data.certificates || [])];
    if (!certificates[index]) return data;
    const field = match[2] as "title" | "issuer" | "date" | "url";
    certificates[index] = { ...certificates[index], [field]: value };
    return { ...data, certificates };
  }

  match = id.match(/^social-(\d+)-(platform|url)$/);
  if (match) {
    const index = Number(match[1]);
    const socialLinks = [...(data.socialLinks || [])];
    if (!socialLinks[index]) return data;
    const field = match[2] as "platform" | "url";
    socialLinks[index] = { ...socialLinks[index], [field]: value };
    return { ...data, socialLinks };
  }

  return data;
}

function arrayValue(id: string, label: string, values: string[], rawIndex: string): EditableResumeText | null {
  const value = values[Number(rawIndex)];
  return value === undefined ? null : { id, label, value };
}

function updateStringArray(
  data: ResumeData,
  field: "skills" | "languages",
  index: number,
  value: string,
): ResumeData {
  if (data[field][index] === undefined) return data;
  const values = [...data[field]];
  values[index] = value;
  return { ...data, [field]: values };
}
