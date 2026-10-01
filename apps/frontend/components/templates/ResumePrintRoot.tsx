import type { ResumeData } from "./TemplateOne";
import { ResumeDocument } from "./ResumeDocument";

export function ResumePrintRoot({
  data,
  templateId,
}: {
  data: ResumeData;
  templateId: string;
}) {
  return (
    <div
      id="resume-print-root"
      className="resume-print-root"
      aria-hidden="true"
      inert
    >
      <ResumeDocument
        data={data}
        elementStyles={data.elementStyles}
        templateId={templateId}
      />
    </div>
  );
}
