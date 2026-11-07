"use client";

import type { TemplateProps } from "./TemplateOne";
import { ResumeTemplateRenderer } from "./ResumeTemplateRenderer";

export function ResumeDocument({
  templateId,
  data,
  ...props
}: TemplateProps & {
  templateId: string;
}) {
  return (
    <div className="resume-document" data-resume-document="true">
      <ResumeTemplateRenderer
        {...props}
        data={data}
        elementStyles={props.elementStyles || data.elementStyles}
        templateId={templateId}
      />
    </div>
  );
}
