"use client";

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
  const hiddenImages: HTMLImageElement[] = [];

  for (const image of images) {
    try {
      await waitForImage(image);
    } catch {
      // A remote profile photo may have expired. It should not block printing
      // the rest of the resume, so omit only that unavailable image.
      image.style.display = "none";
      hiddenImages.push(image);
    }
  }

  return () => {
    for (const image of hiddenImages) image.style.removeProperty("display");
  };
}

async function waitForImage(image: HTMLImageElement): Promise<void> {
  if (!image.complete) {
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timer);
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
      };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error("A resume image could not be loaded for printing.")); };
      const timer = window.setTimeout(failed, 8000);
      image.addEventListener("load", loaded, { once: true });
      image.addEventListener("error", failed, { once: true });
    });
  }
  if (!image.naturalWidth) {
    throw new Error("A resume image could not be loaded for printing.");
  }
  if (typeof image.decode === "function") {
    await withTimeout(image.decode(), 5000, "A resume image took too long to prepare.");
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer = 0;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    window.clearTimeout(timer);
  }
}

async function nextPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
