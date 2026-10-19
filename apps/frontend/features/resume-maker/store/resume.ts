import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import type { JSONContent } from "@tiptap/react";
import {
  defaultPage,
  templates,
  sampleContent,
  type PageSetup,
} from "../templates/catalog";
export type TextStyle = {
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  line: number;
  before: number;
  after: number;
};
export type ResumeState = {
  version: 1;
  exists: boolean;
  title: string;
  template: string;
  content: JSONContent;
  page: PageSetup;
  font: string;
  fontSize: number;
  line: number;
  zoom: number;
  sectionOrder: string[];
  styles: Record<string, TextStyle>;
  divider: { color: string; width: number; style: string; spacing: number };
  hydrated: boolean;
  warning: string;
  update: (patch: Partial<ResumeState>) => void;
  start: (id: string, blank?: boolean, preset?: string) => void;
  clear: () => void;
};
const KEY = "resume-maker-session";
let timer: ReturnType<typeof setTimeout> | undefined;
let pending: string | undefined;
let fallback: string | null = null;
function warn() {
  queueMicrotask(() =>
    useResume.setState({
      warning:
        "Browser storage is unavailable. Keep this tab open and download your resume to keep your work.",
    }),
  );
}
export function flushStorage() {
  if (timer) clearTimeout(timer);
  if (pending === undefined) return;
  fallback = pending;
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
      const data = JSON.parse(raw);
      if (data.version !== 1 || !valid(data.state)) {
        sessionStorage.removeItem(KEY);
        return null;
      }
      return raw;
    } catch {
      warn();
      return fallback;
    }
  },
  setItem: (_name, value) => {
    pending = value;
    fallback = value;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flushStorage, 500);
  },
  removeItem: () => {
    if (timer) clearTimeout(timer);
    pending = undefined;
    fallback = null;
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      warn();
    }
  },
};
function valid(s: unknown): boolean {
  if (!s || typeof s !== "object") return false;
  const v = s as ResumeState;
  const finite = (n: unknown, min: number, max: number) =>
    typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
  return (
    v.version === 1 &&
    typeof v.exists === "boolean" &&
    typeof v.title === "string" &&
    templates.some((t) => t.id === v.template) &&
    v.content?.type === "doc" &&
    Array.isArray(v.content.content) &&
    validNodes(v.content.content) &&
    typeof v.font === "string" &&
    finite(v.fontSize, 6, 96) &&
    finite(v.zoom, 25, 200) &&
    finite(v.line, 0.5, 4) &&
    !!v.page &&
    finite(v.page.width, 50, 1000) &&
    finite(v.page.height, 50, 1000) &&
    ["portrait", "landscape"].includes(v.page.orientation) &&
    /^#[0-9a-f]{6}$/i.test(v.page.color) &&
    !!v.page.margins &&
    Object.values(v.page.margins).length === 4 &&
    Object.values(v.page.margins).every((n) => finite(n, 0, 200)) &&
    Array.isArray(v.sectionOrder) &&
    v.sectionOrder.every((x) => typeof x === "string") &&
    !!v.styles &&
    Object.values(v.styles).every(
      (x) =>
        typeof x.font === "string" &&
        finite(x.size, 6, 96) &&
        finite(x.line, 0.5, 4) &&
        finite(x.before, 0, 200) &&
        finite(x.after, 0, 200) &&
        /^#[0-9a-f]{6}$/i.test(x.color),
    ) &&
    !!v.divider &&
    finite(v.divider.width, 0, 5) &&
    finite(v.divider.spacing, 0, 40) &&
    ["solid", "dashed", "dotted"].includes(v.divider.style) &&
    /^#[0-9a-f]{6}$/i.test(v.divider.color)
  );
}
function validNodes(nodes: JSONContent[], depth = 0): boolean {
  const nodeTypes = new Set([
    "paragraph",
    "heading",
    "text",
    "bulletList",
    "orderedList",
    "listItem",
    "hardBreak",
    "horizontalRule",
    "blockquote",
    "codeBlock",
    "pageBreak",
  ]);
  const markTypes = new Set([
    "bold",
    "italic",
    "underline",
    "strike",
    "code",
    "link",
    "textStyle",
    "highlight",
  ]);
  return (
    depth < 30 &&
    nodes.length < 10000 &&
    nodes.every(
      (n) =>
        n &&
        nodeTypes.has(n.type || "") &&
        (!n.marks ||
          (Array.isArray(n.marks) &&
            n.marks.every((m) => markTypes.has(m.type)))) &&
        (!n.text || typeof n.text === "string") &&
        (!n.content ||
          (Array.isArray(n.content) && validNodes(n.content, depth + 1))),
    )
  );
}
const initial = {
  version: 1 as const,
  exists: false,
  title: "Untitled resume",
  template: "classic",
  content: sampleContent(true),
  page: structuredClone(defaultPage),
  font: "Georgia",
  fontSize: 10.5,
  line: 1.15,
  zoom: 100,
  sectionOrder: [],
  styles: {} as Record<string, TextStyle>,
  divider: { color: "#263b50", width: 1, style: "solid", spacing: 10 },
};
export const useResume = create<ResumeState>()(
  persist(
    (set) => ({
      ...initial,
      hydrated: false,
      warning: "",
      update: (patch) => set(patch),
      start: (id, blank = false, preset) => {
        const t = templates.find((t) => t.id === id) || templates[0]!;
        set({
          ...structuredClone(initial),
          exists: true,
          template: t.id,
          font: t.font,
          line: t.compact ? 1 : 1.15,
          content: sampleContent(blank),
          title: blank ? "Untitled resume" : "Alex Morgan Resume",
          ...(preset
            ? { page: { ...structuredClone(defaultPage), preset } }
            : {}),
        });
      },
      clear: () => {
        set({ ...structuredClone(initial) });
        void useResume.persist.clearStorage();
      },
    }),
    {
      name: KEY,
      version: 1,
      storage: createJSONStorage(() => storage),
      skipHydration: true,
      partialize: ({
        version,
        exists,
        title,
        template,
        content,
        page,
        font,
        fontSize,
        line,
        zoom,
        sectionOrder,
        styles,
        divider,
      }) => ({
        version,
        exists,
        title,
        template,
        content,
        page,
        font,
        fontSize,
        line,
        zoom,
        sectionOrder,
        styles,
        divider,
      }),
      onRehydrateStorage: () => () => {
        useResume.setState({ hydrated: true });
      },
    },
  ),
);
// Page lifecycle flushes preserve rapid edits on refresh without a beforeunload dialog.
if (typeof window !== "undefined")
  window.addEventListener("pagehide", flushStorage);
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushStorage();
  });
