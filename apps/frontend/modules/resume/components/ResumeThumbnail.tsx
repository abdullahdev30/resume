"use client";
import { useEffect, useRef, useState } from "react";
import type { ResumeData } from "@/components/templates/TemplateOne";
import { ResumeTemplateRenderer } from "@/components/templates/ResumeTemplateRenderer";
import { getResumePageDimensions } from "@/components/templates/ResumePage";
import styles from "./ResumeGallery.module.css";

export function ResumeThumbnail({
  data,
  templateId,
}: {
  data: ResumeData;
  templateId: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver((entries) =>
      setWidth(entries[0]?.contentRect.width || 0),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  const dimensions = getResumePageDimensions(data);
  return (
    <div
      ref={host}
      className={styles.thumbnail}
      style={{ aspectRatio: `${dimensions.width}/${dimensions.height}` }}
      aria-hidden="true"
      inert
    >
      <div
        className={styles.sheet}
        style={{
          width: `${dimensions.width}mm`,
          transform: `scale(${width / ((dimensions.width * 96) / 25.4)})`,
        }}
      >
        <ResumeTemplateRenderer templateId={templateId} data={data} />
      </div>
    </div>
  );
}
