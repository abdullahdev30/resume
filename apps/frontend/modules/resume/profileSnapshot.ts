import type { ResumeData } from "@/components/templates/TemplateOne";
import type { ProfileResponse } from "@/modules/profile/types";

export function profileToResumeData(profile: ProfileResponse): ResumeData {
  const personal = profile.personal;
  const fullName = [personal.first_name || personal.name, personal.last_name]
    .filter(Boolean)
    .join(" ");

  return {
    fullName,
    jobTitle: "",
    email: personal.email || "",
    phone: personal.phone || "",
    location: personal.city || personal.address || "",
    avatarUrl: personal.avatar_url || undefined,
    summary: "",
    primaryColor: "#0E7C7B",
    fontFamily: "Inter, sans-serif",
    languages: [],
    skills: profile.skills.map((skill) => skill.name),
    experience: profile.experience.map((item) => ({
      id: item.id,
      role: item.job_title,
      company: item.company_name || item.institute_name || "",
      period: `${item.start_date || ""}${item.end_date ? ` - ${item.end_date}` : item.is_current ? " - Present" : ""}`,
      details: item.description || "",
    })),
    education: profile.education.map((item) => ({
      id: item.id,
      degree: item.degree || item.field_of_study || "",
      institution: item.institute_name,
      period: `${item.start_date || ""}${item.end_date ? ` - ${item.end_date}` : ""}`,
      grade: item.grade || undefined,
    })),
  };
}
