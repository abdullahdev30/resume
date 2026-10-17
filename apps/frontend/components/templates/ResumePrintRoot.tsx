import type { ResumeData } from "./TemplateOne";
import { ResumeDocument } from "./ResumeDocument";
import { getResumePageDimensions } from "./ResumePage";

export function ResumePrintRoot({
  data,
  templateId,
}: {
  data: ResumeData;
  templateId: string;
}) {
  const { width, height } = getResumePageDimensions(data);
  return (
    <div
      id="resume-print-root"
      className="resume-print-root"
      style={{ width: `${width}mm`, minWidth: `${width}mm`, maxWidth: `${width}mm` }}
      aria-hidden="true"
      inert
    >
      <style media="print">{`@page { size: ${width}mm ${height}mm; margin: 0; }`}</style>
      <ResumeDocument
        data={data}
        elementStyles={data.elementStyles}
        templateId={templateId}
      />
    </div>
  );
}
