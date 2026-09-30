import type { ResumeData } from "./TemplateOne";

export interface TemplateItem {
  id: string;
  name: string;
  category: "Modern" | "Creative" | "Minimalist" | "Executive";
  description: string;
  tag: string;
  updatedAt?: string;
  coverImage?: string;
  data: ResumeData;
}

export const templateSampleData: ResumeData = {
  fullName: "Your Name",
  jobTitle: "Role Title",
  email: "email@example.com",
  phone: "+1 555-0192",
  location: "Location",
  summary: "Brief professional summary for the selected resume template.",
  primaryColor: "#0E7C7B",
  skills: ["UI/UX Design", "Figma", "React", "Tailwind CSS"],
  languages: ["English"],
  experience: [
    {
      id: "exp-1",
      role: "Role Title",
      company: "Company",
      period: "Start – End",
      details: "Key responsibilities and measurable outcomes.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.A. Graphic Design",
      institution: "Design Institute",
      period: "2019 – 2023",
    },
  ],
};

export const templateCatalog: TemplateItem[] = [
  {
    id: "1",
    name: "Slate Tech Modern",
    category: "Modern",
    description: "Two-column layout with a structured sidebar for software developers and technical leads.",
    tag: "Popular",
    updatedAt: "2026-09-24",
    data: { ...templateSampleData, primaryColor: "#0E7C7B" },
  },
  {
    id: "2",
    name: "Creative Emerald",
    category: "Creative",
    description: "Vibrant header and timeline layout for designers and product managers.",
    tag: "Creative",
    updatedAt: "2026-09-24",
    data: { ...templateSampleData, primaryColor: "#059669" },
  },
  {
    id: "3",
    name: "Minimalist Classic",
    category: "Minimalist",
    description: "Clean single-column serif layout for academics, attorneys, and analysts.",
    tag: "ATS-friendly",
    updatedAt: "2026-09-24",
    data: { ...templateSampleData, primaryColor: "#334155" },
  },
  {
    id: "4",
    name: "Executive Corporate Navy",
    category: "Executive",
    description: "Strong header treatment for directors, vice presidents, and executives.",
    tag: "Executive",
    updatedAt: "2026-09-24",
    data: { ...templateSampleData, primaryColor: "#1e3a8a" },
  },
  {
    id: "5",
    name: "Modern Executive Headshot",
    category: "Modern",
    description: "Two-column layout with a prominent candidate headshot and compact detail sections.",
    tag: "Photo",
    updatedAt: "2026-09-24",
    data: { ...templateSampleData, primaryColor: "#0E7C7B" },
  },
  {
    id: "6",
    name: "Creative Studio Avatar",
    category: "Creative",
    description: "Portfolio-forward layout with a circular avatar and expressive visual hierarchy.",
    tag: "Photo",
    updatedAt: "2026-09-24",
    data: { ...templateSampleData, primaryColor: "#9333ea" },
  },
];
