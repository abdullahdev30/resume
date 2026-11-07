"use client";
import { createElement } from "react";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { serializeResumeHtml } from "./serializeResumeHtml";

export async function templateHtml(
  data: ResumeData,
  templateId: string,
): Promise<string> {
  const [{ createRoot }, { flushSync }, { ResumeDocument }] = await Promise.all(
    [
      import("react-dom/client"),
      import("react-dom"),
      import("@/components/templates/ResumeDocument"),
    ],
  );
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;pointer-events:none";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    flushSync(() =>
      root.render(createElement(ResumeDocument, { data, templateId })),
    );
    await document.fonts.ready;
    await Promise.all(
      Array.from(host.querySelectorAll("img")).map((image) =>
        image.decode().catch(() => undefined),
      ),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const source =
      host.querySelector<HTMLElement>("[data-resume-document]") || undefined;
    let html: string | undefined;
    try {
      html = await serializeResumeHtml(source);
    } catch (error) {
      // Retry only local preparation after a transient asset/network failure.
      // The caller has not sent a create/update request, so no save is repeated.
      if (
        !(error instanceof TypeError) ||
        !/fetch|network/i.test(error.message)
      )
        throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      html = await serializeResumeHtml(source);
    }
    if (!html) throw new Error("The resume template could not be prepared.");
    return html;
  } finally {
    root.unmount();
    host.remove();
  }
}
