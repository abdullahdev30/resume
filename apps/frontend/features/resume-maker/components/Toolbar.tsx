import { lazy, Suspense, useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { useResume, type TextStyle } from "../store/resume";
import { fonts, loadFont } from "../utils/fonts";
import EditorIcon from "./EditorIcon";
const ColorPicker = lazy(() => import("./ColorPicker"));
export default function Toolbar({
  editor,
  onLink,
  onSpacing,
  onPrint,
}: {
  editor: Editor;
  onLink: () => void;
  onSpacing: () => void;
  onPrint: () => void;
}) {
  const s = useResume();
  const [size, setSize] = useState(String(s.fontSize));
  const [colorMode, setColorMode] = useState<"text" | "highlight" | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [find, setFind] = useState(false);
  const [query, setQuery] = useState("");
  const [brush, setBrush] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<
    { type: string; attrs: Record<string, unknown> }[]
  >([]);
  useEffect(() => {
    if (!brush) return;
    const apply = () => {
      if (editor.state.selection.empty) return;
      const chain = editor.chain().unsetAllMarks();
      for (const mark of copiedFormat) chain.setMark(mark.type, mark.attrs);
      chain.run();
      setBrush(false);
    };
    editor.on("selectionUpdate", apply);
    return () => {
      editor.off("selectionUpdate", apply);
    };
  }, [brush, copiedFormat, editor]);
  useEffect(() => {
    setSize(
      String(
        parseFloat(editor.getAttributes("textStyle").fontSize) || s.fontSize,
      ),
    );
  }, [editor.state.selection.from, editor.state.selection.to, s.fontSize]);
  function setFont(font: string) {
    void loadFont(font);
    if (editor.state.selection.empty) s.update({ font });
    else editor.chain().focus().setFontFamily(font).run();
  }
  function fontSize(v: number) {
    if (!Number.isFinite(v)) return;
    v = Math.min(96, Math.max(6, v));
    setSize(String(v));
    if (editor.state.selection.empty) s.update({ fontSize: v });
    else editor.chain().focus().setFontSize(`${v}pt`).run();
  }
  const level = editor.getAttributes("heading").level || 0;
  function style(value: string) {
    if (value === "update") {
      const a = editor.getAttributes("textStyle");
      const key = level ? `h${level}` : "normal";
      const dom = editor.view.domAtPos(editor.state.selection.from).node;
      const element =
        (dom instanceof HTMLElement ? dom : dom.parentElement)?.closest(
          "p,h1,h2,h3",
        ) || editor.view.dom;
      const computed = getComputedStyle(element);
      const attrs = editor.getAttributes(level ? "heading" : "paragraph");
      const st: TextStyle = {
        font: a.fontFamily || s.font,
        size: parseFloat(a.fontSize) || parseFloat(computed.fontSize) * 0.75,
        color: a.color || "#222222",
        bold: editor.isActive("bold") || parseInt(computed.fontWeight) >= 600,
        italic: editor.isActive("italic") || computed.fontStyle === "italic",
        line: attrs.lineHeight || s.line,
        before: attrs.spaceBefore || 0,
        after: attrs.spaceAfter ?? 6,
      };
      s.update({ styles: { ...s.styles, [key]: st } });
      return;
    }
    const chain = editor.chain().focus();
    if (+value) chain.setHeading({ level: +value as 1 | 2 | 3 });
    else chain.setParagraph();
    const st = s.styles[+value ? `h${value}` : "normal"];
    if (st)
      chain
        .setFontFamily(st.font)
        .setFontSize(`${st.size}pt`)
        .setColor(st.color)
        .setMark("bold", {});
    chain.run();
    if (st) {
      editor.commands.updateAttributes(+value ? "heading" : "paragraph", {
        lineHeight: st.line,
        spaceBefore: st.before,
        spaceAfter: st.after,
      });
      if (!st.bold) editor.commands.unsetBold();
      if (st.italic) editor.commands.setItalic();
      else editor.commands.unsetItalic();
    }
  }
  function tool(
    label: string,
    content: React.ReactNode,
    action: () => void,
    active = false,
  ) {
    return (
      <button
        key={label}
        type="button"
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={active ? "tool active" : "tool"}
        onMouseDown={(e) => e.preventDefault()}
        onClick={action}
      >
        {label === "Undo" ? (
          <EditorIcon name="undo" />
        ) : label === "Redo" ? (
          <EditorIcon name="redo" />
        ) : label === "Insert link" ? (
          <EditorIcon name="link" />
        ) : (
          content
        )}
      </button>
    );
  }
  return (
    <div className="toolbar" aria-label="Formatting toolbar">
      <div className="tool-group">
        {tool("Find in document", <EditorIcon name="search" />, () =>
          setFind(!find),
        )}
        {tool("Undo", "↶", () => {
          editor.chain().focus().undo().run();
        })}
        {tool("Redo", "↷", () => {
          editor.chain().focus().redo().run();
        })}
        {tool("Print", <EditorIcon name="print" />, onPrint)}
        {tool(
          "Paint format",
          <EditorIcon name="paint" />,
          () => {
            setCopiedFormat(
              editor.state.selection.$from
                .marks()
                .map((mark) => ({ type: mark.type.name, attrs: mark.attrs })),
            );
            setBrush(!brush);
          },
          brush,
        )}
        <select
          aria-label="Zoom"
          value={s.zoom}
          onChange={(e) => s.update({ zoom: +e.target.value })}
        >
          {[
            25,
            50,
            65,
            75,
            85,
            100,
            125,
            150,
            200,
            ...(![25, 50, 65, 75, 85, 100, 125, 150, 200].includes(s.zoom)
              ? [s.zoom]
              : []),
          ]
            .sort((a, b) => a - b)
            .map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
        </select>
      </div>
      <select
        aria-label="Paragraph style"
        value={level}
        onChange={(e) => style(e.target.value)}
      >
        <option value="0">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
        <option value="update">Update style to match</option>
      </select>
      <select
        aria-label="Font family"
        value={editor.getAttributes("textStyle").fontFamily || s.font}
        onChange={(e) => setFont(e.target.value)}
      >
        {fonts.map((f) => (
          <option key={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>
      <div className="tool-group size-control">
        {tool("Decrease font size", "−", () => fontSize(+size - 0.5))}
        <input
          aria-label="Font size"
          type="number"
          min="6"
          max="96"
          step="0.5"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          onBlur={() => fontSize(+size)}
          onKeyDown={(e) => {
            if (e.key === "Enter") fontSize(+size);
          }}
        />
        {tool("Increase font size", "+", () => fontSize(+size + 0.5))}
      </div>
      <div className="tool-group">
        {tool(
          "Bold",
          <b>B</b>,
          () => {
            editor.chain().focus().toggleBold().run();
          },
          editor.isActive("bold"),
        )}
        {tool(
          "Italic",
          <i>I</i>,
          () => {
            editor.chain().focus().toggleItalic().run();
          },
          editor.isActive("italic"),
        )}
        {tool(
          "Underline",
          <u>U</u>,
          () => {
            editor.chain().focus().toggleUnderline().run();
          },
          editor.isActive("underline"),
        )}
        {tool(
          "Strikethrough",
          <s>S</s>,
          () => {
            editor.chain().focus().toggleStrike().run();
          },
          editor.isActive("strike"),
        )}
        {tool("Text color", <span className="text-color-letter">A</span>, () =>
          setColorMode("text"),
        )}
        {tool(
          "Highlight color",
          <span className="highlight-letter">H</span>,
          () => setColorMode("highlight"),
        )}
        {tool("Insert link", "↗", onLink)}
      </div>
      <div className="tool-group">
        {(["left", "center", "right", "justify"] as const).map((a, i) =>
          tool(
            `Align ${a}`,
            <span className={`align-icon align-${a}`}>
              <i />
              <i />
              <i />
            </span>,
            () => {
              editor.chain().focus().setTextAlign(a).run();
            },
            editor.isActive({ textAlign: a }),
          ),
        )}
        {tool("Line and paragraph spacing", "↕", onSpacing)}
        {tool(
          "Bulleted list",
          "• ≡",
          () => {
            editor.chain().focus().toggleBulletList().run();
          },
          editor.isActive("bulletList"),
        )}
        {tool(
          "Numbered list",
          "1 ≡",
          () => {
            editor.chain().focus().toggleOrderedList().run();
          },
          editor.isActive("orderedList"),
        )}
        {tool("Outdent", "⇤", () => {
          editor.chain().focus().liftListItem("listItem").run();
        })}
        {tool("Indent", "⇥", () => {
          editor.chain().focus().sinkListItem("listItem").run();
        })}
        {tool("Clear formatting", "Tₓ", () => {
          editor.chain().focus().unsetAllMarks().clearNodes().run();
        })}
      </div>
      {colorMode && (
        <Suspense fallback={null}>
          <ColorPicker
            title={colorMode === "text" ? "Text color" : "Highlight color"}
            initial={
              colorMode === "text"
                ? editor.getAttributes("textStyle").color || "#222222"
                : "#fff0a8"
            }
            recent={recent}
            onClose={() => setColorMode(null)}
            onApply={(color) => {
              if (colorMode === "text")
                editor.chain().focus().setColor(color).run();
              else editor.chain().focus().setHighlight({ color }).run();
              setRecent(
                [color, ...recent.filter((c) => c !== color)].slice(0, 6),
              );
              setColorMode(null);
            }}
          />
        </Suspense>
      )}
      {find && (
        <form
          className="find-bar"
          onSubmit={(event) => {
            event.preventDefault();
            if (!query) return;
            let match = -1;
            editor.state.doc.descendants((node, pos) => {
              if (match < 0 && node.isText) {
                const index = node
                  .text!.toLowerCase()
                  .indexOf(query.toLowerCase());
                if (index >= 0) match = pos + index;
              }
            });
            if (match >= 0)
              editor
                .chain()
                .focus()
                .setTextSelection({ from: match, to: match + query.length })
                .scrollIntoView()
                .run();
          }}
        >
          <input
            aria-label="Find text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find in document"
          />
          <button type="submit">Find</button>
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setFind(false)}
          >
            ×
          </button>
        </form>
      )}
    </div>
  );
}
