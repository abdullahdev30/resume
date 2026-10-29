"use client";

import type { TemplateProps } from "./TemplateOne";
import { paginateResumeData } from "./pagination";
import { ResumeTemplateRenderer } from "./ResumeTemplateRenderer";

export function ResumeDocument({
  templateId,
  data,
  ...props
}: TemplateProps & {
  templateId: string;
}) {
  const pages = paginateResumeData(data);

  return (
    <div className="resume-document" data-resume-document="true">
      {pages.map((page, index) => {
        return (
          <ResumeTemplateRenderer
            key={index}
            {...props}
            data={page.data}
            elementStyles={props.elementStyles || data.elementStyles}
            indexOffsets={page.offsets}
            templateId={templateId}
          />
        );
      })}
    </div>
  );
}
