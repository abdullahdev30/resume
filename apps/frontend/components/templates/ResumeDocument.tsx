"use client";

import type { TemplateProps } from "./TemplateOne";
import { paginateResumeData } from "./pagination";
import { ResumeTemplateRenderer } from "./ResumeTemplateRenderer";

export function ResumeDocument({
  templateId,
  data,
  onDeletePage,
  ...props
}: TemplateProps & { templateId: string; onDeletePage?: (pageIndex: number) => void }) {
  const pages = paginateResumeData(data);

  return (
    <div className="resume-document" data-resume-document="true">
      {pages.map((page, index) => {
        const renderedPage = (
          <ResumeTemplateRenderer
          key={index}
          {...props}
          data={page.data}
          elementStyles={props.elementStyles || data.elementStyles}
          indexOffsets={page.offsets}
          templateId={templateId}
          />
        );

        if (!onDeletePage) return renderedPage;

        return (
          <div className="resume-page-shell" key={index}>
            <div className="resume-page-actions no-print">
              <span>Page {index + 1}</span>
              <button
                type="button"
                onClick={() => onDeletePage(index)}
                aria-label={`Delete page ${index + 1}`}
                title={`Delete page ${index + 1}`}
              >
                Delete page
              </button>
            </div>
            {renderedPage}
          </div>
        );
      })}
    </div>
  );
}
