export type Template = {
  id: string;
  name: string;
  tag: string;
  category: string;
  font: string;
  accent: string;
  centered?: boolean;
  compact?: boolean;
  columns?: boolean;
};
// Future premium templates can extend this catalog; the free editor never requires an account.
export const templates: Template[] = [
  {
    id: "classic",
    name: "Classic",
    tag: "Single column, ATS friendly",
    category: "Single column",
    font: "Georgia",
    accent: "#263b50",
  },
  {
    id: "professional",
    name: "Professional",
    tag: "Clear structure, timeless style",
    category: "Single column",
    font: "Arial",
    accent: "#263b50",
  },
  {
    id: "traditional",
    name: "Traditional",
    tag: "Serif type, centered heading",
    category: "Single column",
    font: "Times New Roman",
    accent: "#333333",
    centered: true,
  },
  {
    id: "executive",
    name: "Executive",
    tag: "Refined headings, generous spacing",
    category: "Single column",
    font: "Cambria",
    accent: "#263b50",
  },
  {
    id: "compact",
    name: "Compact",
    tag: "More experience, less space",
    category: "Compact",
    font: "Arial",
    accent: "#333333",
    compact: true,
  },
  {
    id: "academic",
    name: "Academic",
    tag: "Classic serif, detailed experience",
    category: "Compact",
    font: "Times New Roman",
    accent: "#333333",
    compact: true,
  },
  {
    id: "balanced",
    name: "Balanced",
    tag: "Simple two-column sections",
    category: "Two column",
    font: "Arial",
    accent: "#263b50",
    columns: true,
  },
];
export const presets: Record<string, [number, number]> = {
  A4: [210, 297],
  A5: [148, 210],
  A3: [297, 420],
  Letter: [215.9, 279.4],
  Legal: [215.9, 355.6],
  Tabloid: [279.4, 431.8],
  Executive: [184.15, 266.7],
};
export type PageSetup = {
  preset: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  margins: { top: number; bottom: number; left: number; right: number };
  color: string;
};
export const defaultPage: PageSetup = {
  preset: "A4",
  width: 210,
  height: 297,
  orientation: "portrait",
  margins: { top: 19, bottom: 19, left: 19, right: 19 },
  color: "#ffffff",
};
export function dimensions(page: PageSetup): [number, number] {
  const { width: w, height: h } = page;
  return page.orientation === "landscape"
    ? [Math.max(w, h), Math.min(w, h)]
    : [Math.min(w, h), Math.max(w, h)];
}
export const sectionNames = [
  "Contact info",
  "Summary",
  "Experience",
  "Education",
  "Skills",
  "Projects",
  "Certifications",
  "Languages",
  "Custom section",
];
export function sampleContent(blank = false) {
  const section = (text: string, id: string) => ({
    type: "heading",
    attrs: { level: 2, sectionId: id },
    content: [{ type: "text", text }],
  });
  const p = (text: string) => ({
    type: "paragraph",
    content: text ? [{ type: "text", text }] : undefined,
  });
  return {
    type: "doc",
    content: blank
      ? [
          section("Your name", "contact"),
          p("Email · Phone · City"),
          section("Summary", "summary"),
          p(""),
        ]
      : [
          {
            type: "heading",
            attrs: { level: 1, sectionId: "contact" },
            content: [{ type: "text", text: "Alex Morgan" }],
          },
          p("Product Manager"),
          p("alex.morgan@example.com · (415) 555-0124 · San Francisco, CA"),
          section("Summary", "summary"),
          p(
            "Thoughtful product manager with 6 years of experience turning complex problems into clear, useful products. Skilled in cross-functional collaboration, customer research, and delivering measurable results.",
          ),
          section("Experience", "experience"),
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "bold" }],
                text: "Senior Product Manager · Northstar Studio",
              },
            ],
          },
          p("March 2022 – Present | San Francisco, CA"),
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  p(
                    "Led a team of 8 to launch a new customer platform, improving retention by 24%.",
                  ),
                ],
              },
              {
                type: "listItem",
                content: [
                  p(
                    "Translated customer research into a focused roadmap and delivered four major releases.",
                  ),
                ],
              },
              {
                type: "listItem",
                content: [
                  p(
                    "Partnered with engineering and design to reduce onboarding time by 35%.",
                  ),
                ],
              },
            ],
          },
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "bold" }],
                text: "Product Manager · Fieldwork",
              },
            ],
          },
          p("June 2019 – February 2022 | Oakland, CA"),
          p(
            "Managed the full product lifecycle for a growing portfolio of business tools. Introduced a research practice that informed prioritization and improved customer satisfaction.",
          ),
          section("Education", "education"),
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                marks: [{ type: "bold" }],
                text: "University of California, Berkeley",
              },
            ],
          },
          p("B.A. in Economics · 2015 – 2019"),
          section("Skills", "skills"),
          p(
            "Product strategy · User research · Agile delivery · Data analysis · Stakeholder communication",
          ),
        ],
  };
}
