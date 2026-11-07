"use client";

// Copy computed typography and layout into a self-contained fragment. Editor
// selection handles, scripts and app UI are never sent to the PDF renderer.
export async function serializeResumeHtml(
  sourceRoot?: HTMLElement,
): Promise<string | undefined> {
  const document =
    sourceRoot ||
    window.document.querySelector<HTMLElement>(
      "#resume-print-root [data-resume-document]",
    );
  if (!document) return undefined;
  const clone = document.cloneNode(true) as HTMLElement;
  const properties =
    "color background-color font-family font-size font-weight font-style text-decoration text-align text-transform letter-spacing line-height white-space overflow overflow-wrap word-break display width max-width min-width height min-height max-height margin-top margin-bottom margin-left margin-right padding-top padding-bottom padding-left padding-right border-top border-bottom border-left border-right border-radius box-sizing list-style-type flex-direction flex-wrap flex-grow flex-shrink flex-basis align-items justify-content gap grid-template-columns grid-column grid-row vertical-align position top left right bottom transform transform-origin object-fit".split(
      " ",
    );
  const originals = [document, ...document.querySelectorAll<HTMLElement>("*")];
  const copies = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
  const canvas = window.document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  const printableColors = (value: string) =>
    value.replace(
      /(?:oklch|oklab|lab|lch|color|color-mix)\([^()]*(?:\([^()]*\)[^()]*)*\)/g,
      (color) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
        return `rgba(${r},${g},${b},${a! / 255})`;
      },
    );
  originals.forEach((source, index) => {
    const target = copies[index];
    if (!target) return;
    const style = getComputedStyle(source);
    target.removeAttribute("style");
    for (const property of properties)
      target.style.setProperty(
        property,
        printableColors(style.getPropertyValue(property)).replace(
          /calc\(infinity \* 1px\)/g,
          "9999px",
        ),
      );
    target.removeAttribute("contenteditable");
    target.removeAttribute("tabindex");
    if (source.matches("[data-resume-page]")) {
      target.style.height = style.height;
      target.style.maxHeight = style.height;
      target.style.overflow = "hidden";
      target.style.breakAfter = "auto";
    }
    if (source.matches("h1,h2,h3,h4") && source.textContent?.trim()) {
      const range = window.document.createRange();
      range.selectNodeContents(source);
      // Preserve a heading that fits on one browser line despite small font
      // metric differences between Chromium and the server text shaper.
      if (range.getClientRects().length === 1)
        target.style.whiteSpace = "nowrap";
    }
    if (source.matches("h1,h2,h3,h4,p,li,span")) {
      target.style.height = "auto";
      target.style.minHeight = "0";
      target.style.maxHeight = "none";
    }
  });
  // SVG icons are rasterized locally. The worker never parses untrusted SVG or
  // fetches a remote URL; the PNG carries the browser's resolved icon colors.
  await Promise.all(
    originals.map(async (source, index) => {
      const target = copies[index];
      if (!target || source.tagName.toLowerCase() !== "svg") return;
      const svg = target.cloneNode(true) as SVGElement;
      svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      const rect = source.getBoundingClientRect();
      svg.setAttribute("width", String(rect.width));
      svg.setAttribute("height", String(rect.height));
      const url = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(svg)], {
          type: "image/svg+xml",
        }),
      );
      try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const canvas = window.document.createElement("canvas");
        canvas.width = Math.max(1, Math.ceil(rect.width * 2));
        canvas.height = Math.max(1, Math.ceil(rect.height * 2));
        canvas
          .getContext("2d")!
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        const replacement = window.document.createElement("img");
        replacement.src = canvas.toDataURL("image/png");
        replacement.setAttribute("style", target.getAttribute("style") || "");
        replacement.alt = "";
        target.replaceWith(replacement);
      } finally {
        URL.revokeObjectURL(url);
      }
    }),
  );
  clone
    .querySelectorAll("button,script,iframe,input,textarea,.no-print")
    .forEach((node) => node.remove());
  return (await embeddedFonts()) + clone.outerHTML;
}

let fontStyles: Promise<string> | undefined;
function embeddedFonts(): Promise<string> {
  return (fontStyles ||= (async () => {
    const rules: Array<{ rule: CSSFontFaceRule; base: string }> = [];
    for (const sheet of Array.from(window.document.styleSheets)) {
      try {
        for (const rule of Array.from(sheet.cssRules))
          if (rule instanceof CSSFontFaceRule)
            rules.push({ rule, base: sheet.href || window.location.href });
      } catch {
        /* Cross-origin sheets cannot be inspected. */
      }
    }
    const css = await Promise.all(
      rules.map(async ({ rule, base }) => {
        const src = rule.style.getPropertyValue("src");
        const match = src.match(/url\(["']?([^"')]+)["']?\)/);
        if (!match) return "";
        const url = new URL(match[1]!, base);
        if (url.origin !== window.location.origin) return "";
        let response: Response;
        try {
          response = await window.fetch(url.href);
        } catch (error) {
          throw new TypeError(
            "A resume font could not be fetched. Check your connection and retry saving.",
            { cause: error },
          );
        }
        if (!response.ok)
          throw new Error("A resume font could not be loaded. Please retry.");
        const blob = await response.blob();
        if (blob.size > 1_000_000)
          throw new Error("The resume font is too large.");
        const encoded = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(",")[1]!);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        return `@font-face{font-family:${rule.style.fontFamily};font-style:${rule.style.fontStyle || "normal"};font-weight:${rule.style.fontWeight || "400"};src:url(data:font/woff2;base64,${encoded}) format("woff2");}`;
      }),
    );
    return `<style>${css.join("")}</style>`;
  })().catch((error) => {
    fontStyles = undefined;
    throw error;
  }));
}
