import { dimensions, type PageSetup } from "../templates/catalog";
export async function printResume(page: PageSetup, title: string) {
  await document.fonts.ready;
  const [w, h] = dimensions(page);
  let style = document.getElementById("print-page-settings");
  if (!style) {
    style = document.createElement("style");
    style.id = "print-page-settings";
    document.head.append(style);
  }
  style.textContent = `@page {size:${w}mm ${h}mm;margin:${page.margins.top}mm ${page.margins.right}mm ${page.margins.bottom}mm ${page.margins.left}mm;}`;
  const previous = document.title;
  document.title =
    (title.trim() || "Resume")
      .replace(/[^\p{L}\p{N} -]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-Resume$/i, "") + "-Resume";
  try {
    window.print();
  } finally {
    document.title = previous;
  }
}
