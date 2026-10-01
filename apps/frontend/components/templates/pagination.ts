import type { ResumeData } from "./TemplateOne";

export type ResumeItemOffsets = Partial<
  Record<"skills" | "languages" | "experience" | "education" | "projects" | "certificates" | "socialLinks", number>
>;

export interface ResumePageSlice {
  data: ResumeData;
  offsets: ResumeItemOffsets;
}

type ArraySectionKey = keyof ResumeItemOffsets;

type SectionKey = keyof Pick<
  ResumeData,
  "summary" | "experience" | "skills" | "education" | "projects" | "certificates" | "languages" | "socialLinks"
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

// Calibrated against the densest catalog layouts. Keeping this conservative
// ensures a long experience item moves intact to the next fixed A4 page
// instead of being hidden by the page's required overflow boundary.
const PAGE_CAPACITY = 34;

interface ContentItem {
  section: SectionKey;
  index: number;
  weight: number;
}

export function paginateResumeData(data: ResumeData): ResumePageSlice[] {
  const items = contentItems(data);
  if (items.length === 0) return [{ data: emptyPage(data), offsets: {} }];

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
    if (currentItems.length > 0 && currentWeight + item.weight > PAGE_CAPACITY) {
      flush();
    }
    currentItems.push(item);
    currentWeight += item.weight;
  }
  flush();

  return pages.length > 0 ? pages : [{ data: emptyPage(data), offsets: {} }];
}

/**
 * Removes the source items rendered on one generated page. Personal/contact
 * details are intentionally retained because templates repeat that header on
 * every page; deleting a page should not delete the owner's identity.
 */
export function removeResumePage(source: ResumeData, page: ResumePageSlice): ResumeData {
  const removed: Record<ArraySectionKey, Set<number>> = {
    skills: removedIndexes(page.offsets.skills, page.data.skills.length),
    languages: removedIndexes(page.offsets.languages, page.data.languages.length),
    experience: removedIndexes(page.offsets.experience, page.data.experience.length),
    education: removedIndexes(page.offsets.education, page.data.education?.length || 0),
    projects: removedIndexes(page.offsets.projects, page.data.projects?.length || 0),
    certificates: removedIndexes(page.offsets.certificates, page.data.certificates?.length || 0),
    socialLinks: removedIndexes(page.offsets.socialLinks, page.data.socialLinks?.length || 0),
  };

  const removesSummary = Boolean(page.data.summary);
  return {
    ...source,
    summary: removesSummary ? "" : source.summary,
    skills: withoutIndexes(source.skills, removed.skills),
    languages: withoutIndexes(source.languages, removed.languages),
    experience: withoutIndexes(source.experience, removed.experience),
    education: withoutIndexes(source.education || [], removed.education),
    projects: withoutIndexes(source.projects || [], removed.projects),
    certificates: withoutIndexes(source.certificates || [], removed.certificates),
    socialLinks: withoutIndexes(source.socialLinks || [], removed.socialLinks),
    elementStyles: remapElementStyles(source.elementStyles, removed, removesSummary),
  };
}

function removedIndexes(offset: number | undefined, count: number): Set<number> {
  if (offset === undefined || count === 0) return new Set<number>();
  return new Set(Array.from({ length: count }, (_, index) => offset + index));
}

function withoutIndexes<T>(values: T[], removed: Set<number>): T[] {
  if (removed.size === 0) return [...values];
  return values.filter((_, index) => !removed.has(index));
}

function remapElementStyles(
  styles: ResumeData["elementStyles"],
  removed: Record<ArraySectionKey, Set<number>>,
  removesSummary: boolean,
): ResumeData["elementStyles"] {
  if (!styles) return undefined;

  const prefixes: Array<{ prefix: string; section: ArraySectionKey }> = [
    { prefix: "skill", section: "skills" },
    { prefix: "language", section: "languages" },
    { prefix: "exp", section: "experience" },
    { prefix: "edu", section: "education" },
    { prefix: "project", section: "projects" },
    { prefix: "certificate", section: "certificates" },
    { prefix: "social", section: "socialLinks" },
  ];
  const next: NonNullable<ResumeData["elementStyles"]> = {};

  for (const [id, style] of Object.entries(styles)) {
    if (removesSummary && (id === "summary" || id === "section-summary")) continue;

    const indexed = prefixes.find(({ prefix }) => id.startsWith(`${prefix}-`));
    if (!indexed) {
      next[id] = style;
      continue;
    }

    const match = id.match(new RegExp(`^${indexed.prefix}-(\\d+)(.*)$`));
    if (!match) {
      next[id] = style;
      continue;
    }

    const oldIndex = Number(match[1]);
    const removedIndexesForSection = removed[indexed.section];
    if (removedIndexesForSection.has(oldIndex)) continue;
    const shift = [...removedIndexesForSection].filter((removedIndex) => removedIndex < oldIndex).length;
    next[`${indexed.prefix}-${oldIndex - shift}${match[2]}`] = style;
  }

  return next;
}

function contentItems(data: ResumeData): ContentItem[] {
  const requestedOrder = (data.sectionOrder || [])
    .map((key) => key === "social_links" ? "socialLinks" : key)
    .filter(isSectionKey);
  const order = [...requestedOrder, ...DEFAULT_SECTION_ORDER.filter((key) => !requestedOrder.includes(key))];
  const items: ContentItem[] = [];

  for (const section of order) {
    if (section === "summary") {
      if (data.summary) items.push({ section, index: 0, weight: textWeight(data.summary, 6) });
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

function itemWeight(section: Exclude<SectionKey, "summary">, value: unknown): number {
  if (typeof value === "string") return textWeight(value, section === "skills" ? 1 : 2);
  if (!value || typeof value !== "object") return 2;
  const record = value as Record<string, unknown>;
  const text = Object.values(record)
    .flatMap((entry) => Array.isArray(entry) ? entry : [entry])
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
