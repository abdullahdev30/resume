import type { Section } from "./types";

export interface Field {
  key: string;
  label: string;
  type?:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "date"
    | "textarea"
    | "checkbox"
    | "tags";
  required?: boolean;
  max?: number;
}
export interface SectionConfig {
  id: Section;
  label: string;
  description: string;
  fields: Field[];
  titleKey?: string;
}

export const sections: SectionConfig[] = [
  {
    id: "personal",
    label: "Personal details",
    description: "The name and contact details to use for this persona.",
    fields: [
      { key: "first_name", label: "First name", max: 100 },
      { key: "last_name", label: "Last name", max: 100 },
      { key: "father_name", label: "Father's name", max: 100 },
      { key: "email", label: "Email", type: "email", max: 254 },
      { key: "phone", label: "Phone number", type: "tel", max: 20 },
      { key: "professional_title", label: "Professional title", max: 255 },
      { key: "date_of_birth", label: "Date of birth", type: "date" },
      { key: "nationality", label: "Nationality", max: 100 },
    ],
  },
  {
    id: "address",
    label: "Address",
    description: "Add the location associated with this persona.",
    fields: [
      { key: "address", label: "Street address", type: "textarea", max: 1000 },
      { key: "city", label: "City", max: 100 },
      { key: "region", label: "State / province", max: 100 },
      { key: "postal_code", label: "Postal code", max: 32 },
      { key: "country", label: "Country", max: 100 },
    ],
  },
  {
    id: "summary",
    label: "Professional summary",
    description:
      "Describe the experience, strengths, and direction of this persona.",
    fields: [
      {
        key: "summary",
        label: "Professional summary",
        type: "textarea",
        max: 4000,
      },
    ],
  },
  {
    id: "experience",
    label: "Experience",
    description: "Add roles, responsibilities, and achievements.",
    titleKey: "job_title",
    fields: [
      { key: "job_title", label: "Job title", required: true, max: 255 },
      { key: "company_name", label: "Company", required: true, max: 255 },
      { key: "location", label: "Location", max: 255 },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "end_date", label: "End date", type: "date" },
      { key: "is_current", label: "I currently work here", type: "checkbox" },
      {
        key: "description",
        label: "Responsibilities and achievements",
        type: "textarea",
        max: 4000,
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    description: "Add education, qualifications, and academic achievements.",
    titleKey: "institute_name",
    fields: [
      { key: "institute_name", label: "Institution", required: true, max: 255 },
      { key: "degree", label: "Degree", max: 255 },
      { key: "field_of_study", label: "Field of study", max: 255 },
      { key: "grade", label: "Grade", max: 100 },
      { key: "start_date", label: "Start date", type: "date", required: true },
      { key: "end_date", label: "End date", type: "date" },
      { key: "is_current", label: "I currently study here", type: "checkbox" },
      { key: "description", label: "Description", type: "textarea", max: 2000 },
    ],
  },
  {
    id: "skills",
    label: "Skills & languages",
    description:
      "Add skills and languages. Use the Language category for a spoken language.",
    titleKey: "name",
    fields: [
      { key: "name", label: "Skill or language", required: true, max: 150 },
      { key: "category", label: "Category", max: 100 },
      { key: "level", label: "Proficiency", max: 50 },
    ],
  },
  {
    id: "projects",
    label: "Projects",
    description: "Keep the projects that demonstrate this persona's work.",
    titleKey: "name",
    fields: [
      { key: "name", label: "Project name", required: true, max: 255 },
      { key: "type", label: "Project type", max: 100 },
      { key: "description", label: "Description", type: "textarea", max: 4000 },
      { key: "link", label: "Project URL", type: "url" },
      { key: "github_url", label: "GitHub URL", type: "url" },
      { key: "start_date", label: "Start date", type: "date" },
      { key: "end_date", label: "End date", type: "date" },
      {
        key: "technologies",
        label: "Technologies (comma separated)",
        type: "tags",
      },
    ],
  },
  {
    id: "certificates",
    label: "Certificates",
    description:
      "Add certifications, credentials, and links to supporting documents.",
    titleKey: "title",
    fields: [
      { key: "title", label: "Certificate title", required: true, max: 255 },
      { key: "category", label: "Issuing organization", max: 255 },
      { key: "field", label: "Credential ID", max: 255 },
      { key: "file_url", label: "Certificate URL", type: "url" },
      { key: "issue_date", label: "Issue date", type: "date" },
      { key: "expiration_date", label: "Expiration date", type: "date" },
    ],
  },
  {
    id: "social_links",
    label: "Social links",
    description: "Add professional profiles and other relevant links.",
    titleKey: "platform_name",
    fields: [
      { key: "platform_name", label: "Platform", required: true, max: 50 },
      { key: "profile_url", label: "Profile URL", type: "url", required: true },
    ],
  },
];

export function isPersonalSection(
  id: Section,
): id is "personal" | "address" | "summary" {
  return id === "personal" || id === "address" || id === "summary";
}
