import type { ResumeData } from "./TemplateOne";
import { getResumePageDimensions } from "./ResumePage";

export type ResumeItemOffsets = Partial<
  Record<
    | "skills"
    | "languages"
    | "experience"
    | "education"
    | "projects"
    | "certificates"
    | "socialLinks",
    number
  >
>;

export interface ResumePageSlice {
  data: ResumeData;
  offsets: ResumeItemOffsets;
}

type SectionKey = keyof Pick<
  ResumeData,
  | "summary"
  | "experience"
  | "skills"
  | "education"
  | "projects"
  | "certificates"
  | "languages"
  | "socialLinks"
>;

const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "skills",
  "education",
  "projects",
  "certificates",
  "languages",
  "socialLinks",
];

// Calibrated for the usable area of an A4 page with the default compact
// margins and spacing. Truly long content still flows to additional pages,
// while an ordinary profile is not split prematurely by the heuristic.
const PAGE_CAPACITY = 52;

interface ContentItem {
  section: SectionKey;
  index: number;
  weight: number;
}

export function paginateResumeData(data: ResumeData): ResumePageSlice[] {
  const items = contentItems(data);
  if (items.length === 0) return [{ data: emptyPage(data), offsets: {} }];
  const pageCapacity = getPageCapacity(data);

  const pages: ResumePageSlice[] = [];
  let currentItems: ContentItem[] = [];
  let currentWeight = 0;

  const flush = () => {
    if (currentItems.length === 0) return;
    pages.push(buildPage(data, currentItems));
    currentItems = [];
    currentWeight = 0;
  };

  for (const item of items) {
    if (currentItems.length > 0 && currentWeight + item.weight > pageCapacity) {
      flush();
    }
    currentItems.push(item);
    currentWeight += item.weight;
  }
  flush();

  return pages.length > 0 ? pages : [{ data: emptyPage(data), offsets: {} }];
}

function getPageCapacity(data: ResumeData): number {
  const margin = data.pageMargin ?? 10;
  const lineSpacing = data.lineSpacing ?? 1.15;
  const { height } = getResumePageDimensions(data);
  const defaultUsableHeight = 297 - 20;
  const usableHeight = Math.max(80, height - margin * 2);
  const density = (usableHeight / defaultUsableHeight) * (1.15 / lineSpacing);
  return Math.max(14, Math.round(PAGE_CAPACITY * density));
}

function contentItems(data: ResumeData): ContentItem[] {
  const requestedOrder = (data.sectionOrder || [])
    .map((key) => (key === "social_links" ? "socialLinks" : key))
    .filter(isSectionKey);
  const order = [
    ...requestedOrder,
    ...DEFAULT_SECTION_ORDER.filter((key) => !requestedOrder.includes(key)),
  ];
  const items: ContentItem[] = [];

  for (const section of order.filter(
    (key) =>
      !data.hiddenSections?.includes(
        key === "socialLinks" ? "social_links" : key,
      ),
  )) {
    if (section === "summary") {
      if (data.summary)
        items.push({ section, index: 0, weight: textWeight(data.summary, 6) });
      continue;
    }

    const values = data[section] || [];
    values.forEach((value, index) => {
      items.push({ section, index, weight: itemWeight(section, value) });
    });
  }
  return items;
}

function buildPage(source: ResumeData, items: ContentItem[]): ResumePageSlice {
  const page = emptyPage(source);
  const offsets: ResumeItemOffsets = {};

  for (const item of items) {
    if (item.section === "summary") {
      page.summary = source.summary;
      continue;
    }

    const sourceValues = source[item.section] || [];
    const sourceValue = sourceValues[item.index];
    if (sourceValue === undefined) continue;
    const pageValues = page[item.section] as unknown[];
    pageValues.push(sourceValue);
    if (offsets[item.section] === undefined) offsets[item.section] = item.index;
  }

  return { data: page, offsets };
}

function emptyPage(source: ResumeData): ResumeData {
  return {
    ...source,
    summary: "",
    skills: [],
    languages: [],
    experience: [],
    education: [],
    projects: [],
    certificates: [],
    socialLinks: [],
  };
}

function itemWeight(
  section: Exclude<SectionKey, "summary">,
  value: unknown,
): number {
  if (typeof value === "string")
    return textWeight(value, section === "skills" ? 1 : 2);
  if (!value || typeof value !== "object") return 2;
  const record = value as Record<string, unknown>;
  const text = Object.values(record)
    .flatMap((entry) => (Array.isArray(entry) ? entry : [entry]))
    .filter((entry): entry is string => typeof entry === "string")
    .join(" ");
  const base = section === "experience" ? 5 : section === "projects" ? 4 : 3;
  return textWeight(text, base);
}

function textWeight(value: string, base: number): number {
  return Math.min(PAGE_CAPACITY, base + Math.ceil(value.length / 110));
}

function isSectionKey(value: string): value is SectionKey {
  return DEFAULT_SECTION_ORDER.includes(value as SectionKey);
}
