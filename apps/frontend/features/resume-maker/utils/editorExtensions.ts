import { Extension, Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Editor } from "@tiptap/react";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { dimensions, type PageSetup } from "../templates/catalog";
export const SectionAttributes = Extension.create({
  name: "sectionAttributes",
  addGlobalAttributes() {
    return [
      {
        types: ["heading"],
        attributes: {
          entryId: {
            default: null,
            renderHTML: (a) =>
              a.entryId ? { "data-entry-id": a.entryId } : {},
          },
          divider: {
            default: null,
            renderHTML: (a) =>
              a.divider
                ? {
                    style: `border-bottom:${a.divider.width}px ${a.divider.style} ${a.divider.color};padding-top:${a.divider.spacing}pt`,
                  }
                : {},
          },
          sectionId: {
            default: null,
            parseHTML: (el) => el.getAttribute("data-section-id"),
            renderHTML: (attrs) =>
              attrs.sectionId ? { "data-section-id": attrs.sectionId } : {},
          },
        },
      },
      {
        types: ["paragraph", "heading"],
        attributes: {
          lineHeight: {
            default: null,
            renderHTML: (a) =>
              a.lineHeight ? { style: `line-height:${a.lineHeight}` } : {},
          },
          spaceBefore: {
            default: null,
            renderHTML: (a) =>
              a.spaceBefore ? { style: `padding-top:${a.spaceBefore}pt` } : {},
          },
          spaceAfter: {
            default: null,
            renderHTML: (a) =>
              a.spaceAfter !== null
                ? { style: `padding-bottom:${a.spaceAfter}pt` }
                : {},
          },
        },
      },
    ];
  },
});
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,
  parseHTML() {
    return [{ tag: "div[data-page-break]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-page-break": "true",
        class: "manual-page-break",
      }),
      "",
    ];
  },
  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () =>
        this.editor.commands.insertContent({ type: "pageBreak" }),
    };
  },
});
const key = new PluginKey<DecorationSet>("pages");
export const Pagination = Extension.create({
  name: "pagination",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key,
        state: {
          init: () => DecorationSet.empty,
          apply(tr, old) {
            const value = tr.getMeta(key);
            return value || old.map(tr.mapping, tr.doc);
          },
        },
        props: { decorations: (s) => key.getState(s) },
      }),
    ];
  },
});
export function paginate(editor: Editor, page: PageSetup): number {
  const [, height] = dimensions(page);
  const px = 96 / 25.4;
  const usable = Math.max(
    20,
    (height - page.margins.top - page.margins.bottom) * px,
  );
  const gaps: Decoration[] = [];
  let used = 0;
  let count = 1;
  const scale =
    Number(
      editor.view.dom.closest<HTMLElement>(".paper-scale")?.dataset.zoom,
    ) || 1;
  const tr = editor.state.tr;
  editor.state.doc.forEach((node, pos) => {
    const dom = editor.view.nodeDOM(pos);
    if (
      !(dom instanceof HTMLElement) ||
      dom.getBoundingClientRect().height / scale <= usable
    )
      return;
    if (
      (node.type.name === "bulletList" || node.type.name === "orderedList") &&
      node.childCount > 1
    ) {
      const chunks: ProseMirrorNode[] = [];
      node.forEach((item, _offset, index) =>
        chunks.push(
          node.type.create(
            { ...node.attrs, start: (node.attrs.start || 1) + index },
            item,
          ),
        ),
      );
      tr.replaceWith(
        tr.mapping.map(pos),
        tr.mapping.map(pos + node.nodeSize),
        chunks,
      );
      return;
    }
    if (!node.isTextblock || node.content.size < 2) return;
    const chunks: ProseMirrorNode[] = [];
    let start = 0;
    while (start < node.content.size) {
      let low = start + 1,
        high = node.content.size;
      const top = editor.view.coordsAtPos(pos + 1 + start).top;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        const bottom = editor.view.coordsAtPos(pos + 1 + mid).bottom;
        if ((bottom - top) / scale < usable - 24) low = mid;
        else high = mid - 1;
      }
      let end = low;
      if (end < node.content.size) {
        const text = node.textBetween(start, end);
        const whitespace = text.lastIndexOf(" ");
        if (whitespace > text.length * 0.5) end = start + whitespace + 1;
      }
      if (end <= start) end = start + 1;
      chunks.push(
        node.type.create(
          { ...node.attrs, ...(start ? { sectionId: null } : {}) },
          node.content.cut(start, end),
          node.marks,
        ),
      );
      start = end;
    }
    if (chunks.length > 1)
      tr.replaceWith(
        tr.mapping.map(pos),
        tr.mapping.map(pos + node.nodeSize),
        chunks,
      );
  });
  if (tr.docChanged) {
    editor.view.dispatch(tr);
    return Math.max(1, Math.ceil(editor.view.dom.scrollHeight / (height * px)));
  }
  editor.state.doc.forEach((node, pos) => {
    const dom = editor.view.nodeDOM(pos);
    if (!(dom instanceof HTMLElement)) return;
    if (node.type.name === "pageBreak") {
      const gap =
        Math.max(0, usable - used) +
        (page.margins.bottom + page.margins.top) * px +
        24;
      gaps.push(
        Decoration.widget(
          pos,
          () => {
            const el = document.createElement("div");
            el.className = "page-gap manual-gap";
            el.style.height = `${gap}px`;
            el.contentEditable = "false";
            return el;
          },
          { side: -1, key: `manual-${pos}-${gap}` },
        ),
      );
      used = 0;
      count++;
      return;
    }
    const blockHeight =
      dom.getBoundingClientRect().height /
        (Number(
          editor.view.dom.closest<HTMLElement>(".paper-scale")?.dataset.zoom,
        ) || 1) +
      parseFloat(getComputedStyle(dom).marginTop) +
      parseFloat(getComputedStyle(dom).marginBottom);
    const next = editor.view.nodeDOM(pos + node.nodeSize);
    const keepWithNext =
      node.type.name === "heading" && next instanceof HTMLElement
        ? Math.min(next.getBoundingClientRect().height / scale, usable * 0.25)
        : 0;
    if (used > 0 && used + blockHeight + keepWithNext > usable + 0.5) {
      const gap =
        usable - used + (page.margins.bottom + page.margins.top) * px + 24;
      gaps.push(
        Decoration.widget(
          pos,
          () => {
            const el = document.createElement("div");
            el.className = "page-gap";
            el.style.height = `${gap}px`;
            el.contentEditable = "false";
            return el;
          },
          { side: -1, key: `${pos}-${gap}` },
        ),
      );
      used = 0;
      count++;
    }
    used += blockHeight;
    // Nested structures can still span a sheet; native print fragmentation handles them.
    while (used > usable) {
      used -= usable;
      count++;
    }
  });
  const decorations = DecorationSet.create(editor.state.doc, gaps);
  editor.view.dispatch(
    editor.state.tr.setMeta(key, decorations).setMeta("addToHistory", false),
  );
  return count;
}
