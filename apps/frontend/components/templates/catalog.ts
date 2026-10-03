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
  fullName: "Alex Morgan",
  jobTitle: "Senior Product Designer",
  email: "alex.morgan@example.com",
  phone: "+1 415 555 0136",
  location: "San Francisco, CA",
  summary: "Product designer with 7+ years of experience creating accessible digital products, improving design systems, and turning customer research into measurable business results.",
  primaryColor: "#0E7C7B",
  fontFamily: "Inter, sans-serif",
  skills: ["Product Strategy", "UX Research", "Figma", "Design Systems", "Prototyping", "Accessibility"],
  languages: ["English", "Spanish"],
  experience: [
    {
      id: "exp-1",
      role: "Senior Product Designer",
      company: "Northstar Labs",
      period: "2022 – Present",
      details: "Led discovery and end-to-end design for a B2B analytics platform. Improved task completion by 28% and established a reusable component library across three product teams.",
    },
    {
      id: "exp-2",
      role: "Product Designer",
      company: "Brightside Studio",
      period: "2019 – 2022",
      details: "Designed responsive web and mobile experiences, facilitated customer workshops, and partnered with engineering to ship accessible interfaces on schedule.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "BFA, Interaction Design",
      institution: "California College of Design",
      period: "2015 – 2019",
      grade: "Magna Cum Laude",
    },
  ],
  projects: [
    {
      id: "project-1",
      name: "Unified Design System",
      description: "Created documented patterns and accessible components that reduced feature design time by 35%.",
      url: "https://portfolio.example.com/design-system",
      technologies: ["Figma", "Storybook", "WCAG"],
    },
  ],
  certificates: [
    {
      id: "certificate-1",
      title: "Human-Centered Design",
      issuer: "Design Institute",
      date: "2024",
      url: "https://credentials.example.com/alex-morgan",
    },
  ],
  socialLinks: [
    {
      id: "social-1",
      platform: "LinkedIn",
      url: "https://linkedin.com/in/alex-morgan",
    },
    {
      id: "social-2",
      platform: "Portfolio",
      url: "https://portfolio.example.com/alex-morgan",
    },
  ],
  pageSize: "A4",
  pageMargin: 10,
  lineSpacing: 1.15,
  elementStyles: {
    fullName: { isBold: true, fontSize: 24 },
    jobTitle: { isBold: true, fontSize: 12 },
  },
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
