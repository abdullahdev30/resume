"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

import type { ResumeData, ResumePageSize } from "./TemplateOne";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

const PAGE_DIMENSIONS: Record<
  ResumePageSize,
  { width: number; height: number }
> = {
  A4: { width: A4_WIDTH_MM, height: A4_HEIGHT_MM },
  A3: { width: 297, height: 420 },
  Executive: { width: 184.15, height: 266.7 },
  Custom: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  A5: { width: 148, height: 210 },
  B5: { width: 176, height: 250 },
  Tabloid: { width: 279.4, height: 431.8 },
};

export function getResumePageDimensions(
  data: Pick<
    ResumeData,
    "pageSize" | "pageOrientation" | "pageWidth" | "pageHeight"
  >,
) {
  const pageSize = data.pageSize || "A4";
  const dimensions =
    pageSize === "Custom"
      ? { width: data.pageWidth || 210, height: data.pageHeight || 297 }
      : PAGE_DIMENSIONS[pageSize] || PAGE_DIMENSIONS.A4;
  return data.pageOrientation === "landscape"
    ? { width: dimensions.height, height: dimensions.width }
    : dimensions;
}

function printPageName(data: Pick<ResumeData, "pageSize" | "pageOrientation">) {
  const size = (data.pageSize || "A4").toLowerCase();
  return `resume-${size}-${data.pageOrientation || "portrait"}`;
}

export function ResumePage({
  children,
  className = "",
  data,
  style,
}: {
  children: ReactNode;
  className?: string;
  data: ResumeData;
  style?: CSSProperties;
}) {
  const dimensions = getResumePageDimensions(data);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, left: 0 });
  // A fixed physical sheet with out-of-flow content cannot create a phantom
  // second page. Scale the complete layout uniformly, preserving every entry.
  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const content = contentRef.current;
    if (!sheet || !content) return;
    const measure = () => {
      const availableHeight = Math.max(1, sheet.clientHeight - (6 * 96) / 25.4);
      const availableWidth = Math.max(1, sheet.clientWidth - (6 * 96) / 25.4);
      const naturalHeight = Math.max(
        content.scrollHeight,
        content.offsetHeight,
        1,
      );
      const scale = Math.min(1, availableHeight / naturalHeight);
      const left = Math.max(
        0,
        (availableWidth - content.offsetWidth * scale) / 2,
      );
      setFit((current) =>
        Math.abs(current.scale - scale) < 0.0001 &&
        Math.abs(current.left - left) < 0.1
          ? current
          : { scale, left },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sheet);
    observer.observe(content);
    content.addEventListener("load", measure, true);
    void document.fonts.ready.then(measure);
    return () => {
      observer.disconnect();
      content.removeEventListener("load", measure, true);
    };
  }, [children, dimensions.width, dimensions.height]);
  const fitStyle: CSSProperties = {
    position: "absolute",
    top: "3mm",
    left: `calc(3mm + ${fit.left}px)`,
    width: `${Math.max(1, dimensions.width - 6)}mm`,
    transform: `scale(${fit.scale})`,
    transformOrigin: "top left",
  };
  const contentStyle: CSSProperties = {
    ...style,
    width: "100%",
    minWidth: 0,
    maxWidth: "none",
    minHeight: `${Math.max(1, dimensions.height - 6)}mm`,
    height: "auto",
    padding: 0,
    margin: 0,
    boxSizing: "border-box",
    lineHeight: data.lineSpacing ?? 1.15,
    backgroundColor: data.pageColor || style?.backgroundColor,
  };
  return (
    <div
      ref={sheetRef}
      className="resume-page"
      data-resume-page="true"
      data-fit-scale={fit.scale}
      data-page-size={data.pageSize || "A4"}
      data-page-orientation={data.pageOrientation || "portrait"}
      style={
        {
          width: `${dimensions.width}mm`,
          minWidth: `${dimensions.width}mm`,
          maxWidth: `${dimensions.width}mm`,
          height: `${dimensions.height}mm`,
          minHeight: `${dimensions.height}mm`,
          maxHeight: `${dimensions.height}mm`,
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden",
          backgroundColor: data.pageColor || style?.backgroundColor || "#fff",
          page: printPageName(data),
        } as CSSProperties
      }
    >
      <div className="resume-page-fit" style={fitStyle}>
        <div
          style={{
            display: "inline-block",
            width: "100%",
            verticalAlign: "top",
          }}
        >
          <div
            ref={contentRef}
            className={`resume-page-content ${className}`}
            style={contentStyle}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
