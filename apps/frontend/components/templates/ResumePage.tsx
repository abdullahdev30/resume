import type { CSSProperties, ReactNode } from "react";

import type { ResumeData, ResumePageSize } from "./TemplateOne";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

const PAGE_DIMENSIONS: Record<ResumePageSize, { width: number; height: number }> = {
  A4: { width: A4_WIDTH_MM, height: A4_HEIGHT_MM },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  A5: { width: 148, height: 210 },
  B5: { width: 176, height: 250 },
  Tabloid: { width: 279.4, height: 431.8 },
};

export function getResumePageDimensions(data: Pick<ResumeData, "pageSize" | "pageOrientation">) {
  const pageSize = data.pageSize || "A4";
  const dimensions = PAGE_DIMENSIONS[pageSize] || PAGE_DIMENSIONS.A4;
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
  const pageStyle = {
    width: `${dimensions.width}mm`,
    minWidth: `${dimensions.width}mm`,
    maxWidth: `${dimensions.width}mm`,
    height: `${dimensions.height}mm`,
    minHeight: `${dimensions.height}mm`,
    maxHeight: `${dimensions.height}mm`,
    boxSizing: "border-box",
    overflow: "hidden",
    lineHeight: data.lineSpacing ?? 1.15,
    padding: `${data.pageMargin ?? 10}mm`,
    ...style,
    backgroundColor: data.pageColor || style?.backgroundColor,
    page: printPageName(data),
  } as CSSProperties & { page: string };

  return (
    <div
      className={`resume-page ${className}`.trim()}
      data-resume-page="true"
      data-page-size={data.pageSize || "A4"}
      data-page-orientation={data.pageOrientation || "portrait"}
      style={pageStyle}
    >
      {children}
    </div>
  );
}
