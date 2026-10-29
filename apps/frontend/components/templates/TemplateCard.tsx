"use client";
import { Button } from "@/components/ui/Button";
import { ResumeTemplateRenderer } from "./ResumeTemplateRenderer";
import type { TemplateItem } from "./catalog";
export function renderTemplate(item: TemplateItem) {
  return <ResumeTemplateRenderer templateId={item.id} data={item.data} />;
}
export function TemplateCard({
  item,
  onPreview,
  onSelect,
}: {
  item: TemplateItem;
  onPreview: (item: TemplateItem) => void;
  onSelect: (item: TemplateItem) => void;
}) {
  return (
    <article className="resume-workspace-template-card">
      <button
        className="resume-workspace-template-sheet"
        onClick={() => onPreview(item)}
        aria-label={`Preview ${item.name}`}
      >
        <div className="resume-workspace-template-scale" aria-hidden="true">
          {renderTemplate(item)}
        </div>
      </button>
      <div className="resume-workspace-template-copy">
        <h2>{item.name}</h2>
        <p>{item.description}</p>
        <div className="resume-workspace-template-actions">
          <Button variant="secondary" onClick={() => onPreview(item)}>
            Preview
          </Button>
          <Button onClick={() => onSelect(item)}>Use this template</Button>
        </div>
      </div>
    </article>
  );
}
