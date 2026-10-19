import type { GuestResumeDocument } from "./types";
import { toTemplateResumeData } from "./model";

/** Translate visible template field IDs back to the structured document. */
export function editGuestText(
  doc: GuestResumeDocument,
  id: string,
  value: string,
  source: GuestResumeDocument = doc,
): GuestResumeDocument {
  const personal: Record<string, keyof GuestResumeDocument["personal"]> = {
    fullName: "fullName",
    jobTitle: "professionalTitle",
    "contact-email": "email",
    "contact-phone": "phone",
    "contact-location": "location",
  };
  if (personal[id])
    return { ...doc, personal: { ...doc.personal, [personal[id]]: value } };
  if (id === "summary") return { ...doc, summary: value };
  const rendered = toTemplateResumeData(source);
  let match = id.match(/^skill-(\d+)$/);
  if (match) {
    const visible = source.skills
      .map((text, index) => ({ text, index }))
      .filter((x) => x.text.trim());
    const index = visible[+match[1]!]?.index;
    return {
      ...doc,
      skills: doc.skills.map((text, i) => (i === index ? value : text)),
    };
  }
  match = id.match(/^language-(\d+)$/);
  if (match) {
    const item = source.languages.filter((x) => x.name.trim())[+match[1]!];
    return {
      ...doc,
      languages: doc.languages.map((x) =>
        x.id === item?.id ? { ...x, name: value, proficiency: "" } : x,
      ),
    };
  }
  match = id.match(/^exp-(\d+)-(role|company|period|details)$/);
  if (match) {
    const item = rendered.experience[+match[1]!];
    const fields: Record<string, string> = {
      role: "jobTitle",
      company: "company",
      period: "displayPeriod",
      details: "description",
    };
    return {
      ...doc,
      experience: doc.experience.map((x) =>
        x.id === item?.id
          ? {
              ...x,
              [fields[match![2]!]!]: value,
              ...(match![2] === "company" ? { location: "" } : {}),
            }
          : x,
      ),
    };
  }
  match = id.match(/^edu-(\d+)-(degree|inst|institution|period|grade)$/);
  if (match) {
    const item = rendered.education?.[+match[1]!];
    const fields: Record<string, string> = {
      degree: "degree",
      inst: "institution",
      institution: "institution",
      period: "displayPeriod",
      grade: "description",
    };
    return {
      ...doc,
      education: doc.education.map((x) =>
        x.id === item?.id
          ? {
              ...x,
              [fields[match![2]!]!]: value,
              ...(["inst", "institution"].includes(match![2]!)
                ? { location: "" }
                : {}),
            }
          : x,
      ),
    };
  }
  match = id.match(/^project-(\d+)-(name|description|technologies|url)$/);
  if (match) {
    const item = rendered.projects?.[+match[1]!];
    const fields: Record<string, string> = {
      name: "title",
      description: "description",
      technologies: "technologies",
      url: "link",
    };
    return {
      ...doc,
      projects: doc.projects.map((x) =>
        x.id === item?.id ? { ...x, [fields[match![2]!]!]: value } : x,
      ),
    };
  }
  match = id.match(/^certificate-(\d+)-(title|issuer|date)$/);
  if (match) {
    const item = rendered.certificates?.[+match[1]!];
    const fields: Record<string, string> = {
      title: "name",
      issuer: "issuer",
      date: "displayDate",
    };
    return {
      ...doc,
      certificates: doc.certificates.map((x) =>
        x.id === item?.id ? { ...x, [fields[match![2]!]!]: value } : x,
      ),
    };
  }
  match = id.match(/^social-(\d+)-(url|platform)$/);
  if (match) {
    const fields: Record<string, keyof GuestResumeDocument['personal']> = {
      Website: "website",
      LinkedIn: "linkedin",
      GitHub: "github",
    };
    const platform=Object.keys(fields).filter(label=>source.personal[fields[label]!].trim())[+match[1]!];
    if(platform&&match[2]==='platform')return {...doc,socialLabels:{...doc.socialLabels,[platform]:value}};
    if (platform)
      return {
        ...doc,
        personal: { ...doc.personal, [fields[platform]!]: value },
      };
  }
  return doc;
}
