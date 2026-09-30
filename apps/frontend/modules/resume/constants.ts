import type { ResumeData } from "@/components/templates/TemplateOne";

export const defaultResumeData: ResumeData = {
  fullName: "Jane Doe",
  jobTitle: "Product Designer",
  email: "jane@mail.com",
  phone: "+1 555-0192",
  location: "New York, USA",
  summary:
    "Creative professional building useful products with clean systems and thoughtful execution.",
  primaryColor: "#0E7C7B",
  fontFamily: "Inter, sans-serif",
  skills: ["Communication", "Leadership", "Problem Solving"],
  languages: ["English"],
  experience: [
    {
      id: "exp-1",
      role: "Professional Role",
      company: "Company Name",
      period: "2023 - Present",
      details: "Describe measurable responsibilities and outcomes here.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "Degree / Qualification",
      institution: "Institute Name",
      period: "2019 - 2023",
    },
  ],
};
