"use client";

import { isSuccessfulHttpStatus } from "../../lib/http-status";

const PRINT_ROOT_ID = "resume-print-root";

export function safeFileName(title: string): string {
  const normalized = title
    .normalize("NFKC")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 120);
  return normalized || "resume";
}

export async function downloadResumePdf(title: string): Promise<void> {
  const root = document.getElementById(PRINT_ROOT_ID);
  if (!root) throw new Error("The printable resume is not available.");

  await document.fonts.ready;
  const restoreImages = await preparePrintImages(root);
  await nextPaint();

  const previousTitle = document.title;
  let restored = false;
  let fallbackTimer = 0;
  const restore = () => {
    if (restored) return;
    restored = true;
    document.title = previousTitle;
    restoreImages();
    window.clearTimeout(fallbackTimer);
    window.removeEventListener("afterprint", restore);
  };

  document.title = safeFileName(title);
  window.addEventListener("afterprint", restore, { once: true });
  try {
    window.print();
    // Chromium fires afterprint when its dialog closes. This fallback covers
    // browsers that return from print() without dispatching that event.
    fallbackTimer = window.setTimeout(restore, 1000);
  } catch (error) {
    restore();
    throw error;
  }
}

async function preparePrintImages(root: HTMLElement): Promise<() => void> {
  const images = Array.from(root.querySelectorAll("img"));
  const originalSources = new Map<HTMLImageElement, string>();

  try {
    for (const image of images) {
      const source = image.currentSrc || image.src;
      if (isCrossOriginHttpUrl(source)) {
        originalSources.set(image, image.src);
        image.src = await imageUrlToDataUrl(source);
      }
      await waitForImage(image);
    }
  } catch (error) {
    restoreImageSources(originalSources);
    throw error;
  }

  return () => restoreImageSources(originalSources);
}

function isCrossOriginHttpUrl(source: string): boolean {
  if (!source || source.startsWith("data:") || source.startsWith("blob:")) {
    return false;
  }
  const url = new URL(source, window.location.href);
  return url.protocol.startsWith("http") && url.origin !== window.location.origin;
}

async function imageUrlToDataUrl(source: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(source, {
      credentials: "omit",
      mode: "cors",
      cache: "no-store",
    });
  } catch (error) {
    throw new Error(
      "The resume photo could not be prepared for printing because its server does not allow cross-origin access.",
      { cause: error },
    );
  }
  if (!isSuccessfulHttpStatus(response.status)) {
    throw new Error("The resume photo could not be loaded for printing.");
  }

  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result)));
    reader.addEventListener("error", () => reject(new Error("The resume photo could not be read for printing.")));
    reader.readAsDataURL(blob);
  });
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("A resume image could not be loaded for printing.")), { once: true });
    });
  }
  if (!image.naturalWidth) {
    throw new Error("A resume image could not be loaded for printing.");
  }
  if (typeof image.decode === "function") {
    await image.decode();
  }
}

function restoreImageSources(sources: Map<HTMLImageElement, string>) {
  for (const [image, source] of sources) {
    if (image.isConnected) image.src = source;
  }
}

async function nextPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
