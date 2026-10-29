"use client";
import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";
import { templateCatalog } from "@/components/templates/catalog";
import type { EditorResumeData } from "./types";
import { blankResume, normalizeResume } from "./editorDocument";

const KEY = "resume-maker-session";
let pending: string | undefined;
let fallback: string | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
const warn = () =>
  queueMicrotask(() =>
    useFreeResume.setState({
      warning:
        "Browser storage is unavailable. Keep this tab open and download your resume to keep your work.",
    }),
  );
export function flushDraft() {
  clearTimeout(timer);
  if (pending === undefined) return;
  try {
    sessionStorage.setItem(KEY, pending);
  } catch {
    warn();
  }
  pending = undefined;
}
const storage: StateStorage = {
  getItem: () => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return fallback;
      const saved = JSON.parse(raw);
      if (saved.version !== 2 || !validDraft(saved.state)) {
        sessionStorage.removeItem(KEY);
        return null;
      }
      return raw;
    } catch {
      warn();
      return fallback;
    }
  },
  setItem: (_key, value) => {
    pending = value;
    fallback = value;
    clearTimeout(timer);
    timer = setTimeout(flushDraft, 500);
  },
  removeItem: () => {
    clearTimeout(timer);
    pending = undefined;
    fallback = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      warn();
    }
  },
};
const sectionKeys = [
  "summary",
  "experience",
  "skills",
  "education",
  "projects",
  "certificates",
  "languages",
  "social_links",
];
const strings = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");
function entries(
  value: unknown,
  required: string[],
  optional: string[] = [],
): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        required.every((key) => typeof item[key] === "string") &&
        optional.every(
          (key) => item[key] === undefined || typeof item[key] === "string",
        ),
    )
  );
}
function validDraft(state: unknown): boolean {
  if (!state || typeof state !== "object") return false;
  const draft = state as DraftState;
  const data = draft.data;
  return (
    typeof draft.exists === "boolean" &&
    typeof draft.title === "string" &&
    templateCatalog.some((item) => item.id === draft.templateId) &&
    Number.isFinite(draft.zoom) &&
    draft.zoom >= 30 &&
    draft.zoom <= 150 &&
    Boolean(data) &&
    ["fullName", "jobTitle", "email", "phone", "location", "summary"].every(
      (key) => typeof data[key as keyof EditorResumeData] === "string",
    ) &&
    [
      "experience",
      "education",
      "skills",
      "languages",
      "projects",
      "certificates",
      "socialLinks",
      "sectionOrder",
    ].every((key) => Array.isArray(data[key as keyof EditorResumeData])) &&
    [
      "A4",
      "A3",
      "A5",
      "B5",
      "Executive",
      "Custom",
      "Letter",
      "Legal",
      "Tabloid",
    ].includes(data.pageSize) &&
    ["portrait", "landscape"].includes(data.pageOrientation) &&
    strings(data.skills) &&
    strings(data.languages) &&
    entries(
      data.experience,
      ["role", "company", "period", "details"],
      ["id"],
    ) &&
    entries(
      data.education,
      ["degree", "institution", "period"],
      ["id", "grade"],
    ) &&
    entries(data.projects, ["name", "description"], ["id", "url"]) &&
    data.projects.every((item) => strings(item.technologies)) &&
    entries(data.certificates, ["title", "issuer", "date"], ["id", "url"]) &&
    entries(data.socialLinks, ["platform", "url"], ["id"]) &&
    strings(data.sectionOrder) &&
    data.sectionOrder.every((key) => sectionKeys.includes(key)) &&
    (data.hiddenSections === undefined ||
      (strings(data.hiddenSections) &&
        data.hiddenSections.every((key) => sectionKeys.includes(key)))) &&
    (data.avatarUrl === undefined || typeof data.avatarUrl === "string") &&
    (data.pageSize !== "Custom" ||
      (Number.isFinite(data.pageWidth) &&
        Number(data.pageWidth) >= 50 &&
        Number.isFinite(data.pageHeight) &&
        Number(data.pageHeight) >= 50)) &&
    (data.pageMargins === undefined ||
      (data.pageMargins !== null &&
        typeof data.pageMargins === "object" &&
        Object.values(data.pageMargins).length === 4 &&
        ["top", "bottom", "left", "right"].every(
          (key) =>
            Number.isFinite(
              data.pageMargins?.[
                key as keyof NonNullable<typeof data.pageMargins>
              ],
            ) &&
            Number(
              data.pageMargins?.[
                key as keyof NonNullable<typeof data.pageMargins>
              ],
            ) >= 0,
        ))) &&
    Number.isFinite(data.pageMargin) &&
    data.pageMargin >= 0 &&
    Number.isFinite(data.lineSpacing) &&
    typeof data.elementStyles === "object" &&
    data.elementStyles !== null &&
    !Array.isArray(data.elementStyles) &&
    Object.values(data.elementStyles).every(
      (style) =>
        style &&
        typeof style === "object" &&
        !Array.isArray(style) &&
        Object.values(style).every(
          (value) =>
            typeof value === "string" ||
            typeof value === "boolean" ||
            (typeof value === "number" && Number.isFinite(value)),
        ),
    )
  );
}
interface DraftState {
  exists: boolean;
  title: string;
  templateId: string;
  data: EditorResumeData;
  zoom: number;
  hydrated: boolean;
  warning: string;
  update: (
    patch: Partial<Pick<DraftState, "title" | "data" | "zoom" | "templateId">>,
  ) => void;
  start: (id: string) => void;
  clear: () => void;
}
export const useFreeResume = create<DraftState>()(
  persist(
    (set) => ({
      exists: false,
      title: "My Resume",
      templateId: "1",
      data: blankResume(templateCatalog[0]!),
      zoom: 100,
      hydrated: false,
      warning: "",
      update: (patch) => set(patch),
      start: (id) =>
        set({
          exists: true,
          templateId: id,
          data: blankResume(
            templateCatalog.find((item) => item.id === id) ||
              templateCatalog[0]!,
          ),
          title: "My Resume",
        }),
      clear: () => {
        void useFreeResume.persist.clearStorage();
        set({
          exists: false,
          data: blankResume(templateCatalog[0]!),
          title: "My Resume",
        });
      },
    }),
    {
      name: KEY,
      version: 2,
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: ({ exists, title, templateId, data, zoom }) => ({
        exists,
        title,
        templateId,
        data,
        zoom,
      }),
      merge: (saved, current) =>
        saved
          ? {
              ...current,
              ...(saved as Partial<DraftState>),
              data: normalizeResume((saved as DraftState).data),
            }
          : current,
      onRehydrateStorage: () => () =>
        useFreeResume.setState({ hydrated: true }),
    },
  ),
);
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushDraft);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushDraft();
  });
}
