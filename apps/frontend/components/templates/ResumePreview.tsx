"use client";

import type { CSSProperties, ReactNode } from "react";
import { useLayoutEffect, useRef, useState } from "react";

export function ResumePreview({
  children,
  zoomPercent = 100,
}: {
  children: ReactNode;
  zoomPercent?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [contentSize, setContentSize] = useState({ width: 794, height: 1123 });

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    if (!viewport || !content) return;

    const measure = () => {
      const availableWidth = Math.max(1, viewport.clientWidth - 32);
      const naturalWidth = Math.max(1, content.offsetWidth);
      setFitScale(Math.min(1, availableWidth / naturalWidth));
      setContentSize({ width: naturalWidth, height: content.offsetHeight });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(content);
    return () => observer.disconnect();
  }, [children]);

  const scale = fitScale * (zoomPercent / 100);
  const style = {
    "--s": String(scale),
    width: `${contentSize.width * scale}px`,
    height: `${contentSize.height * scale}px`,
  } as CSSProperties;

  return (
    <div ref={viewportRef} className="resume-preview-viewport">
      <div className="resume-preview-stage" style={style}>
        <div ref={contentRef} className="resume-preview-content">
          {children}
        </div>
      </div>
    </div>
  );
}
