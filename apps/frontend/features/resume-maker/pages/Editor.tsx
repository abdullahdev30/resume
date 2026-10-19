import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, Navigate } from "../utils/navigation";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import type { JSONContent } from "@tiptap/react";
import { useResume, flushStorage } from "../store/resume";
import { templates, dimensions, sectionNames } from "../templates/catalog";
import Modal from "../components/Modal";
import Toolbar from "../components/Toolbar";
import EditorIcon from "../components/EditorIcon";
import {
  SectionAttributes,
  PageBreak,
  Pagination,
  paginate,
} from "../utils/editorExtensions";
import { loadFont } from "../utils/fonts";
const PageSetup = lazy(() => import("../components/PageSetup"));
type Dialog =
  | "page"
  | "switch"
  | "clear"
  | "link"
  | "spacing"
  | "characters"
  | "section"
  | null;
export default function Editor() {
  const s = useResume();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [rulers, setRulers] = useState(true);
  const [breaks, setBreaks] = useState(true);
  const [count, setCount] = useState(1);
  const [status, setStatus] = useState<"idle" | "preparing" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [link, setLink] = useState("");
  const [section, setSection] = useState("Experience");
  const [custom, setCustom] = useState("");
  const [before, setBefore] = useState(0);
  const [after, setAfter] = useState(6);
  const workspace = useRef<HTMLDivElement>(null);
  const [sectionScope, setSectionScope] = useState("all");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      SectionAttributes,
      PageBreak,
      Pagination,
    ],
    content: s.content,
    editorProps: {
      attributes: {
        "aria-label": "Resume content",
        role: "textbox",
        "aria-multiline": "true",
        class: "resume-content",
        spellcheck: "true",
      },
      handleKeyDown: (_view, event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          setDialog("link");
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      s.update({
        content,
        sectionOrder: (content.content || [])
          .filter((n) => n.attrs?.sectionId)
          .map((n) => n.attrs!.sectionId),
      });
    },
    immediatelyRender: true,
  });
  useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            selection: editor.state.selection.from,
            transaction: editor.state.selection.to,
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            heading: editor.getAttributes("heading").level,
            marks: JSON.stringify(editor.getAttributes("textStyle")),
          }
        : null,
  });
  const template = templates.find((t) => t.id === s.template)!;
  const [width, height] = dimensions(s.page);
  const scale = s.zoom / 100;
  useEffect(() => {
    const referenced = new Set([
      s.font,
      ...Object.values(s.styles).map((st) => st.font),
    ]);
    function walk(node: JSONContent) {
      node.marks?.forEach((mark) => {
        if (mark.attrs?.fontFamily) referenced.add(mark.attrs.fontFamily);
      });
      node.content?.forEach(walk);
    }
    walk(s.content);
    void Promise.all([...referenced].map(loadFont)).catch(() =>
      setNotice(
        "A font could not load. A system font is being used. Try refreshing this tab.",
      ),
    );
  }, [s.font, s.content, s.styles]);
  useEffect(() => {
    if (!editor) return;
    const id = setTimeout(() => {
      setCount(paginate(editor, s.page));
    }, 100);
    return () => clearTimeout(id);
  }, [
    editor,
    s.content,
    s.page,
    s.font,
    s.fontSize,
    s.line,
    s.styles,
    s.template,
    s.zoom,
    s.divider,
  ]);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".menu-bar")) setMenu(null);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("click", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);
  useEffect(() => {
    if (!editor) return;
    const listener = () => setCount(paginate(editor, s.page));
    document.fonts.addEventListener("loadingdone", listener);
    return () => document.fonts.removeEventListener("loadingdone", listener);
  }, [editor, s.page]);
  if (!s.exists) return <Navigate to="/" replace />;
  if (!editor)
    return (
      <main
        className="shell skeleton card-skeleton"
        aria-label="Loading editor"
      />
    );
  const sections = (s.content.content || [])
    .map((n, i) => ({ node: n, index: i }))
    .filter((x) => x.node.attrs?.sectionId);
  const sectionDivider =
    sectionScope === "all"
      ? s.divider
      : {
          ...s.divider,
          ...sections.find((x) => x.node.attrs?.sectionId === sectionScope)
            ?.node.attrs?.divider,
        };
  function updateDivider(patch: Partial<typeof s.divider>) {
    if (sectionScope === "all") {
      s.update({ divider: { ...s.divider, ...patch } });
      return;
    }
    const tr = editor!.state.tr;
    editor!.state.doc.forEach((node, pos) => {
      if (node.attrs.sectionId === sectionScope)
        tr.setNodeMarkup(pos, undefined, {
          ...node.attrs,
          divider: { ...sectionDivider, ...patch },
        });
    });
    editor!.view.dispatch(tr);
  }
  function addEntry(index: number) {
    const nodes: JSONContent[] = [...(editor!.getJSON().content || [])];
    let end = index + 1;
    while (end < nodes.length && !nodes[end]!.attrs?.sectionId) end++;
    nodes.splice(
      end,
      0,
      {
        type: "heading",
        attrs: { level: 3, entryId: crypto.randomUUID() },
        content: [
          { type: "text", text: "Role or qualification · Organization" },
        ],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Start date – End date | Location" }],
      },
      {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Describe your responsibilities and achievements.",
          },
        ],
      },
    );
    setContent(nodes);
  }
  function removeEntry(index: number) {
    const nodes = [...(editor!.getJSON().content || [])];
    let end = index + 1;
    while (end < nodes.length && !nodes[end]!.attrs?.sectionId) end++;
    let start = end - 1;
    while (start > index && !nodes[start]!.attrs?.entryId) start--;
    if (start > index) {
      nodes.splice(start, end - start);
      setContent(nodes);
    }
  }
  function setContent(nodes: JSONContent[]) {
    editor!.commands.setContent(
      { type: "doc", content: nodes },
      { emitUpdate: true },
    );
  }
  function moveSection(index: number, delta: number) {
    const nodes = [...(editor!.getJSON().content || [])];
    const groups: JSONContent[][] = [];
    for (const node of nodes) {
      if (node.attrs?.sectionId || !groups.length) groups.push([]);
      groups[groups.length - 1]!.push(node);
    }
    const target = index + delta;
    if (target < 0 || target >= groups.length) return;
    [groups[index], groups[target]] = [groups[target]!, groups[index]!];
    setContent(groups.flat());
  }
  function removeSection(index: number) {
    const nodes = [...(editor!.getJSON().content || [])];
    let end = index + 1;
    while (end < nodes.length && !nodes[end]!.attrs?.sectionId) end++;
    nodes.splice(index, end - index);
    setContent(nodes.length ? nodes : [{ type: "paragraph" }]);
  }
  function addSection() {
    const name = section === "Custom section" ? custom.trim() : section;
    if (!name) return;
    const id = crypto.randomUUID();
    const nodes = [
      ...(editor!.getJSON().content || []),
      {
        type: "heading",
        attrs: { level: 2, sectionId: id },
        content: [{ type: "text", text: name }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "Add your details here." }],
      },
    ];
    setContent(nodes);
    setDialog(null);
  }
  async function download() {
    setStatus("preparing");
    setMenu(null);
    flushStorage();
    try {
      const { printResume } = await import("../utils/print");
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      await printResume(s.page, s.title);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }
  function item(label: string, action: () => void) {
    return (
      <button
        role="menuitem"
        key={label}
        onClick={() => {
          action();
          setMenu(null);
        }}
      >
        {label}
      </button>
    );
  }
  function fit() {
    const available = (workspace.current?.clientWidth || 900) - 80;
    s.update({
      zoom: Math.max(
        25,
        Math.min(200, Math.floor((available / ((width * 96) / 25.4)) * 100)),
      ),
    });
  }
  async function clipboard(action: "cut" | "copy" | "paste") {
    try {
      if (action === "paste") {
        const value = await navigator.clipboard.readText();
        editor!
          .chain()
          .focus()
          .insertContent(
            value.split("\n").map((text) => ({
              type: "paragraph",
              content: text ? [{ type: "text", text }] : [],
            })),
          )
          .run();
      } else {
        const { from, to } = editor!.state.selection;
        await navigator.clipboard.writeText(
          editor!.state.doc.textBetween(from, to, "\n"),
        );
        if (action === "cut") editor!.chain().focus().deleteSelection().run();
      }
    } catch {
      setNotice(
        "Your browser blocked clipboard access. Use Ctrl/Cmd + C, X, or V in the document.",
      );
    }
  }
  const css = {
    "--paper-width": `${width}mm`,
    "--paper-height": `${height}mm`,
    "--margin-top": `${s.page.margins.top}mm`,
    "--margin-bottom": `${s.page.margins.bottom}mm`,
    "--margin-left": `${s.page.margins.left}mm`,
    "--margin-right": `${s.page.margins.right}mm`,
    "--doc-font": s.font,
    "--doc-size": `${s.fontSize}pt`,
    "--doc-line": s.line,
    "--doc-color": template.accent,
    "--page-color": s.page.color,
    "--divider-color": s.divider.color,
    "--divider-width": `${s.divider.width}px`,
    "--divider-style": s.divider.style,
    "--section-spacing": `${s.divider.spacing}pt`,
  } as React.CSSProperties;
  return (
    <div className="editor-app" style={css}>
      <header className="editor-header">
        <button
          className="back-button"
          aria-label="Resume Maker templates"
          onClick={() => {
            flushStorage();
            navigate("/");
          }}
          title="Back to templates"
        >
          <EditorIcon name="document" size={30} />
        </button>
        <div className="document-title">
          <input
            aria-label="Resume title"
            value={s.title}
            onChange={(e) => s.update({ title: e.target.value })}
          />
        </div>
        <span
          className="local-document-status"
          title="Private document, stored only in this browser tab"
        >
          <EditorIcon name="lock" />
        </span>
        <button
          className="primary download"
          disabled={status === "preparing"}
          onClick={() => void download()}
        >
          {status === "preparing" ? "Preparing your PDF…" : "Download PDF"}{" "}
          <EditorIcon name="document" size={19} />
        </button>
      </header>
      <nav className="menu-bar" aria-label="Document menus">
        {["File", "Edit", "View", "Insert", "Format"].map((name) => (
          <div className="menu-container" key={name}>
            <button
              aria-haspopup="menu"
              aria-expanded={menu === name}
              onClick={() => setMenu(menu === name ? null : name)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const trigger = e.currentTarget;
                  setMenu(name);
                  setTimeout(() => {
                    (
                      trigger.parentElement?.querySelector(
                        "[role=menuitem]",
                      ) as HTMLElement
                    )?.focus();
                  }, 0);
                }
              }}
            >
              {name}
            </button>
            {menu === name && (
              <div
                className="dropdown"
                role="menu"
                onKeyDown={(e) => {
                  const buttons = Array.from(
                    e.currentTarget.querySelectorAll<HTMLButtonElement>(
                      "button",
                    ),
                  );
                  const index = buttons.indexOf(
                    document.activeElement as HTMLButtonElement,
                  );
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    buttons[
                      (index +
                        (e.key === "ArrowDown" ? 1 : -1) +
                        buttons.length) %
                        buttons.length
                    ]?.focus();
                  }
                }}
              >
                {name === "File" && (
                  <>
                    {item("Page setup", () => setDialog("page"))}
                    {item("Switch template", () => setDialog("switch"))}
                    {item("Download PDF", () => void download())}
                    <hr />
                    {item("Clear data", () => setDialog("clear"))}
                  </>
                )}
                {name === "Edit" && (
                  <>
                    {item("Undo  Ctrl+Z", () => {
                      editor.chain().focus().undo().run();
                    })}
                    {item("Redo  Ctrl+Y", () => {
                      editor.chain().focus().redo().run();
                    })}
                    <hr />
                    {item("Cut", () => void clipboard("cut"))}
                    {item("Copy", () => void clipboard("copy"))}
                    {item("Paste", () => void clipboard("paste"))}
                    {item("Select all", () => {
                      editor.chain().focus().selectAll().run();
                    })}
                  </>
                )}
                {name === "View" && (
                  <>
                    {[50, 75, 100, 125, 150].map((z) =>
                      item(`Zoom ${z}%`, () => s.update({ zoom: z })),
                    )}
                    {item("Fit to width", fit)}
                    <hr />
                    {item(rulers ? "Hide rulers" : "Show rulers", () =>
                      setRulers(!rulers),
                    )}
                    {item(
                      breaks ? "Hide page breaks" : "Show page breaks",
                      () => setBreaks(!breaks),
                    )}
                  </>
                )}
                {name === "Insert" && (
                  <>
                    {item("Link  Ctrl+K", () => setDialog("link"))}
                    {item("Horizontal line", () => {
                      editor.chain().focus().setHorizontalRule().run();
                    })}
                    {item("Page break  Ctrl+Enter", () => {
                      editor
                        .chain()
                        .focus()
                        .insertContent({ type: "pageBreak" })
                        .run();
                    })}
                    {item("Special characters", () => setDialog("characters"))}
                    {item("Section", () => setDialog("section"))}
                  </>
                )}
                {name === "Format" && (
                  <>
                    {[0, 1, 2, 3].map((n) =>
                      item(n ? `Heading ${n}` : "Normal text", () => {
                        if (n)
                          editor
                            .chain()
                            .focus()
                            .setHeading({ level: n as 1 | 2 | 3 })
                            .run();
                        else editor.chain().focus().setParagraph().run();
                      }),
                    )}
                    <hr />
                    {(["left", "center", "right", "justify"] as const).map(
                      (a) =>
                        item(`Align ${a}`, () => {
                          editor.chain().focus().setTextAlign(a).run();
                        }),
                    )}
                    {item("Line and paragraph spacing", () =>
                      setDialog("spacing"),
                    )}
                    {item("Bulleted list", () => {
                      editor.chain().focus().toggleBulletList().run();
                    })}
                    {item("Numbered list", () => {
                      editor.chain().focus().toggleOrderedList().run();
                    })}
                    {item("Clear formatting", () => {
                      editor.chain().focus().unsetAllMarks().clearNodes().run();
                    })}
                    {item("Apply font to entire resume", () => {
                      const selection = editor.state.selection;
                      editor
                        .chain()
                        .selectAll()
                        .setFontFamily(s.font)
                        .setTextSelection({
                          from: selection.from,
                          to: selection.to,
                        })
                        .run();
                    })}
                    {item("Scale all text +10%", () => scaleText(1.1))}
                    {item("Scale all text −10%", () => scaleText(1 / 1.1))}
                  </>
                )}
              </div>
            )}
          </div>
        ))}
        <span className="template-label">{template.name} template</span>
      </nav>
      <Toolbar
        editor={editor}
        onLink={() => setDialog("link")}
        onSpacing={() => setDialog("spacing")}
        onPrint={() => void download()}
      />
      <div className="privacy-note">
        Your data is kept only for this browser tab and is deleted when you
        close the tab. Download your resume to keep it.
      </div>
      {status === "error" && (
        <div className="error" role="alert">
          We couldn’t prepare your PDF.{" "}
          <button onClick={() => void download()}>Retry</button>
        </div>
      )}
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button onClick={() => setNotice("")} aria-label="Dismiss notice">
            ×
          </button>
        </div>
      )}
      <div className="editor-body">
        <aside className="section-sidebar">
          <button
            className="outline-back"
            aria-label="Back to templates"
            onClick={() => {
              flushStorage();
              navigate("/");
            }}
          >
            <EditorIcon name="back" size={25} />
          </button>
          <div className="sidebar-heading">
            <h2>Document tabs</h2>
            <button
              onClick={() => setDialog("section")}
              aria-label="Add section"
            >
              +
            </button>
          </div>
          <button
            className="document-tab"
            onClick={() => editor.chain().focus().run()}
          >
            <EditorIcon name="document" size={19} />
            <span>Resume</span>
            <span className="tab-section-count">{sections.length}</span>
          </button>
          <ol>
            {sections.map(({ node, index }, i) => (
              <li key={node.attrs!.sectionId}>
                <button
                  className="section-name"
                  onClick={() => {
                    let pos = 0;
                    editor.state.doc.forEach((_, p, j) => {
                      if (j === index) pos = p;
                    });
                    editor
                      .chain()
                      .focus()
                      .setTextSelection(pos + 1)
                      .scrollIntoView()
                      .run();
                  }}
                >
                  {node.content?.map((n) => n.text || "").join("") ||
                    "Untitled section"}
                </button>
                <div>
                  <button
                    aria-label={`Add entry to ${node.content?.[0]?.text}`}
                    title="Add entry"
                    onClick={() => addEntry(index)}
                  >
                    +
                  </button>
                  <button
                    aria-label={`Remove last entry from ${node.content?.[0]?.text}`}
                    title="Remove last added entry"
                    onClick={() => removeEntry(index)}
                  >
                    −
                  </button>
                  <button
                    aria-label={`Move ${node.content?.[0]?.text} up`}
                    disabled={!i}
                    onClick={() => moveSection(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`Move ${node.content?.[0]?.text} down`}
                    disabled={i === sections.length - 1}
                    onClick={() => moveSection(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    aria-label={`Remove ${node.content?.[0]?.text}`}
                    onClick={() => removeSection(index)}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <button className="add-section" onClick={() => setDialog("section")}>
            + Add a section
          </button>
          <p className="outline-help">
            Click anywhere on the page to edit. Add another job or entry with a
            new paragraph.
          </p>
          <details className="section-options">
            <summary>Section appearance</summary>
            <label>
              Apply to
              <select
                value={sectionScope}
                onChange={(e) => setSectionScope(e.target.value)}
              >
                <option value="all">All sections</option>
                {sections.map(({ node }) => (
                  <option
                    key={node.attrs!.sectionId}
                    value={node.attrs!.sectionId}
                  >
                    {node.content?.map((n) => n.text).join("")}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Divider color
              <input
                type="color"
                value={sectionDivider.color}
                onChange={(e) => updateDivider({ color: e.target.value })}
              />
            </label>
            <label>
              Divider thickness
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                value={sectionDivider.width}
                onChange={(e) =>
                  updateDivider({
                    width: Math.max(0, Math.min(5, +e.target.value)),
                  })
                }
              />
            </label>
            <label>
              Divider style
              <select
                value={sectionDivider.style}
                onChange={(e) => updateDivider({ style: e.target.value })}
              >
                {["solid", "dashed", "dotted"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Section spacing (pt)
              <input
                type="number"
                min="0"
                max="40"
                value={sectionDivider.spacing}
                onChange={(e) =>
                  updateDivider({
                    spacing: Math.max(0, Math.min(40, +e.target.value)),
                  })
                }
              />
            </label>
          </details>
        </aside>
        <main
          className={`workspace ${breaks ? "" : "hide-breaks"}`}
          ref={workspace}
        >
          <div
            className="canvas-container"
            style={{
              width: ((width * 96) / 25.4) * scale,
              height:
                (((height * 96) / 25.4) * count + 24 * (count - 1)) * scale,
            }}
          >
            <div
              className={`paper-scale ${template.centered ? "centered-document" : ""} ${template.columns ? "two-column-document" : ""} ${template.compact ? "compact-document" : ""}`}
              data-zoom={scale}
              style={{
                transform: `scale(${scale})`,
                width: `${width}mm`,
                minHeight: `${height}mm`,
              }}
            >
              {rulers && (
                <div className="ruler" aria-hidden="true">
                  {Array.from(
                    { length: Math.floor((width / 25.4) * 8) + 1 },
                    (_, i) => (
                      <span
                        className={
                          i % 8 === 0
                            ? "inch-tick"
                            : i % 4 === 0
                              ? "half-tick"
                              : "minor-tick"
                        }
                        style={{ left: `${(i * 25.4) / 8}mm` }}
                        key={i}
                      >
                        {i % 8 === 0 && i > 0 ? i / 8 : ""}
                      </span>
                    ),
                  )}
                </div>
              )}
              {rulers && (
                <>
                  <div className="ruler-handles">
                    <input
                      type="range"
                      aria-label="Left page margin"
                      min="0"
                      max={width}
                      step="1"
                      value={s.page.margins.left}
                      onChange={(e) =>
                        s.update({
                          page: {
                            ...s.page,
                            margins: {
                              ...s.page.margins,
                              left: Math.max(
                                0,
                                Math.min(
                                  200,
                                  width - s.page.margins.right - 20,
                                  +e.target.value,
                                ),
                              ),
                            },
                          },
                        })
                      }
                    />
                    <input
                      type="range"
                      aria-label="Right page margin"
                      min="0"
                      max={width}
                      step="1"
                      value={width - s.page.margins.right}
                      onChange={(e) =>
                        s.update({
                          page: {
                            ...s.page,
                            margins: {
                              ...s.page.margins,
                              right: Math.max(
                                0,
                                Math.min(
                                  200,
                                  width - s.page.margins.left - 20,
                                  width - +e.target.value,
                                ),
                              ),
                            },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="vertical-ruler" aria-hidden="true">
                    {Array.from(
                      { length: Math.ceil((height / 25.4) * 8) },
                      (_, i) => (
                        <span
                          className={i % 8 === 0 ? "inch-tick" : "minor-tick"}
                          key={i}
                          style={{ top: `${(i * 25.4) / 8}mm` }}
                        >
                          {i % 8 === 0 && i > 0 ? i / 8 : ""}
                        </span>
                      ),
                    )}
                  </div>
                </>
              )}
              <div className="page-backgrounds" aria-hidden="true">
                {Array.from({ length: count }, (_, i) => (
                  <div className="paper-background" key={i} />
                ))}
              </div>
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>
      </div>
      <footer className="editor-footer">
        <span>
          {count} {count === 1 ? "page" : "pages"} · {s.page.preset} ·{" "}
          {s.page.orientation}
        </span>
        <span>Private by design</span>
        <div>
          <button
            aria-label="Zoom out"
            onClick={() => s.update({ zoom: Math.max(25, s.zoom - 5) })}
          >
            −
          </button>
          <span>{s.zoom}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => s.update({ zoom: Math.min(200, s.zoom + 5) })}
          >
            +
          </button>
        </div>
      </footer>
      {Object.entries(s.styles).length > 0 && (
        <style>
          {Object.entries(s.styles)
            .map(
              ([key, st]) =>
                `.resume-content ${key === "normal" ? "p" : key}{font-family:${JSON.stringify(st.font)};font-size:${st.size}pt;color:${st.color};font-weight:${st.bold ? 700 : 400};font-style:${st.italic ? "italic" : "normal"};line-height:${st.line};padding-top:${st.before}pt;padding-bottom:${st.after}pt;}`,
            )
            .join("\n")}
        </style>
      )}
      {dialog === "page" && (
        <Suspense fallback={<div role="status">Loading page setup…</div>}>
          <PageSetup onClose={() => setDialog(null)} />
        </Suspense>
      )}
      {dialog === "clear" && (
        <Modal title="Clear this tab’s resume?" onClose={() => setDialog(null)}>
          <p>
            This removes your resume and all settings from this browser tab.
            Download a PDF first if you want to keep a copy.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setDialog(null)}>Cancel</button>
            <button
              className="danger"
              onClick={() => {
                s.clear();
                navigate("/");
              }}
            >
              Clear data
            </button>
          </div>
        </Modal>
      )}
      {dialog === "switch" && (
        <Modal title="Switch template" onClose={() => setDialog(null)}>
          <p>Your content and page setup will be kept.</p>
          <div className="template-options">
            {templates.map((t) => (
              <button
                key={t.id}
                className={t.id === s.template ? "selected" : ""}
                onClick={() => {
                  s.update({ template: t.id, font: t.font });
                  setDialog(null);
                }}
              >
                <strong style={{ fontFamily: t.font }}>{t.name}</strong>
                <span>{t.tag}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {dialog === "link" && (
        <Modal title="Insert link" onClose={() => setDialog(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!link.trim()) {
                editor.chain().focus().unsetLink().run();
                setDialog(null);
                return;
              }
              try {
                const url = new URL(link);
                if (
                  !["https:", "http:", "mailto:", "tel:"].includes(url.protocol)
                )
                  throw Error();
                if (editor.state.selection.empty)
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "text",
                      text: link,
                      marks: [{ type: "link", attrs: { href: link } }],
                    })
                    .run();
                else editor.chain().focus().setLink({ href: link }).run();
                setDialog(null);
                setNotice("");
              } catch {
                setNotice("Enter a valid https, http, mailto, or tel link.");
              }
            }}
          >
            <label>
              Link URL
              <input
                autoFocus
                placeholder="https://example.com"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </label>
            <div className="dialog-actions">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetLink().run();
                  setDialog(null);
                }}
              >
                Remove link
              </button>
              <button className="primary">Apply</button>
            </div>
          </form>
        </Modal>
      )}
      {dialog === "characters" && (
        <Modal title="Special characters" onClose={() => setDialog(null)}>
          <div className="character-grid">
            {"• · – — © ® ™ ° ± × ÷ € £ ¥ § ¶ †".split(" ").map((c) => (
              <button
                key={c}
                onClick={() => {
                  editor
                    .chain()
                    .focus()
                    .insertContent({ type: "text", text: c })
                    .run();
                  setDialog(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </Modal>
      )}
      {dialog === "section" && (
        <Modal title="Add a section" onClose={() => setDialog(null)}>
          <label>
            Section type
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
            >
              {sectionNames.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          {section === "Custom section" && (
            <label>
              Section name
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
              />
            </label>
          )}
          <div className="dialog-actions">
            <button onClick={() => setDialog(null)}>Cancel</button>
            <button
              className="primary"
              onClick={addSection}
              disabled={section === "Custom section" && !custom.trim()}
            >
              Add section
            </button>
          </div>
        </Modal>
      )}
      {dialog === "spacing" && (
        <Modal
          title="Line and paragraph spacing"
          onClose={() => setDialog(null)}
        >
          <label>
            Line spacing
            <input
              type="number"
              min="0.5"
              max="4"
              step="0.05"
              value={s.line}
              onChange={(e) => {
                const v = +e.target.value;
                if (v >= 0.5 && v <= 4) s.update({ line: v });
              }}
            />
          </label>
          <div className="preset-buttons">
            {[1, 1.15, 1.5, 2].map((n) => (
              <button key={n} onClick={() => s.update({ line: n })}>
                {n}
              </button>
            ))}
          </div>
          <div className="form-grid">
            <label>
              Before paragraph (pt)
              <input
                type="number"
                min="0"
                max="200"
                value={before}
                onChange={(e) =>
                  setBefore(Math.max(0, Math.min(200, +e.target.value)))
                }
              />
            </label>
            <label>
              After paragraph (pt)
              <input
                type="number"
                min="0"
                max="200"
                value={after}
                onChange={(e) =>
                  setAfter(Math.max(0, Math.min(200, +e.target.value)))
                }
              />
            </label>
          </div>
          <div className="dialog-actions">
            <button
              className="primary"
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .updateAttributes(
                    editor.isActive("heading") ? "heading" : "paragraph",
                    {
                      lineHeight: s.line,
                      spaceBefore: before,
                      spaceAfter: after,
                    },
                  )
                  .run();
                setDialog(null);
              }}
            >
              Apply to paragraph
            </button>
          </div>
        </Modal>
      )}
      <div className="mobile-editor-note">
        For the full editing experience, use a tablet or desktop. You can still
        edit and download your resume here.
      </div>
    </div>
  );
  function scaleText(factor: number) {
    s.update({ fontSize: Math.max(6, Math.min(96, s.fontSize * factor)) });
    const json = editor!.getJSON();
    function walk(n: JSONContent) {
      for (const mark of n.marks || [])
        if (mark.type === "textStyle" && mark.attrs?.fontSize)
          mark.attrs.fontSize = `${Math.max(6, Math.min(96, parseFloat(mark.attrs.fontSize) * factor))}pt`;
      n.content?.forEach(walk);
    }
    walk(json);
    editor!.commands.setContent(json, { emitUpdate: true });
  }
}
