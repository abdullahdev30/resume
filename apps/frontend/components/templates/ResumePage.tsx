import type { CSSProperties, ReactNode } from "react";

import type { ResumeData } from "./TemplateOne";

export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

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
  return (
    <div
      className={`resume-page ${className}`.trim()}
      data-resume-page="true"
      style={{
        width: `${A4_WIDTH_MM}mm`,
        minWidth: `${A4_WIDTH_MM}mm`,
        maxWidth: `${A4_WIDTH_MM}mm`,
        height: `${A4_HEIGHT_MM}mm`,
        minHeight: `${A4_HEIGHT_MM}mm`,
        maxHeight: `${A4_HEIGHT_MM}mm`,
        boxSizing: "border-box",
        overflow: "hidden",
        lineHeight: data.lineSpacing || 1.5,
        padding: `${data.pageMargin || 18}mm`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
