import type { ResumeData } from "@/components/templates/TemplateOne";
import type { ProfileResponse } from "@/modules/profile/types";

export function profileToResumeData(profile: ProfileResponse): ResumeData {
  const personal = profile.personal;
  const fullName = [personal.first_name || personal.name, personal.last_name]
    .filter(Boolean)
    .join(" ");

  return {
    fullName,
    jobTitle: personal.professional_title || profile.experience[0]?.job_title || "",
    email: personal.email || "",
    phone: personal.phone || "",
    location: [personal.city, personal.address].filter(Boolean).join(", "),
    avatarUrl: personal.avatar_url || undefined,
    summary: personal.summary || "",
    primaryColor: "#0E7C7B",
    fontFamily: "Inter, sans-serif",
    languages: profile.skills
      .filter((skill) => skill.category?.toLowerCase() === "language")
      .map((skill) => skill.name),
    skills: profile.skills
      .filter((skill) => skill.category?.toLowerCase() !== "language")
      .map((skill) => skill.name),
    socialLinks: profile.social_links.map((item) => ({
      id: item.id,
      platform: item.platform_name,
      url: item.profile_url,
    })),
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
    projects: profile.projects.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || "",
      url: item.link || item.github_url || undefined,
      technologies: item.technologies || [],
    })),
    certificates: profile.certificates.map((item) => ({
      id: item.id,
      title: item.title,
      issuer: item.category || "",
      date: item.issue_date || "",
      url: item.file_url || undefined,
    })),
    pageSize: "A4",
    pageMargin: 10,
    lineSpacing: 1.15,
    elementStyles: {
      fullName: { isBold: true, fontSize: 24 },
      jobTitle: { isBold: true, fontSize: 12 },
    },
  };
}
