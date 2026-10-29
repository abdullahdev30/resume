"use client";
import { resumeApi } from "./api";

export async function downloadStoredPdf(id: string): Promise<void> {
  const { download_url } = await resumeApi.getPdf(id);
  // The presigned S3 URL carries Content-Disposition and supports range reads.
  const anchor = document.createElement("a");
  anchor.href = download_url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
