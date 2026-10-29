"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  templateCatalog,
  type TemplateItem,
} from "@/components/templates/catalog";
import {
  TemplateCard,
  renderTemplate,
} from "@/components/templates/TemplateCard";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useFreeResume } from "@/modules/resume/store";
export default function TemplatesClient({
  onSelect,
}: {
  onSelect?: (template: TemplateItem) => void;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const exists = useFreeResume((state) => state.exists);
  const title = useFreeResume((state) => state.title);
  const templateId = useFreeResume((state) => state.templateId);
  useEffect(() => {
    if (!onSelect) void useFreeResume.persist.rehydrate();
  }, [onSelect]);
  const select = (item: TemplateItem) => {
    if (onSelect) {
      onSelect(item);
      return;
    }
    useFreeResume.getState().start(item.id);
    router.push(`/editor/${item.id}`);
  };
  const categories = [
    "All",
    ...new Set(templateCatalog.map((item) => item.category)),
  ];
  return (
    <div className="page-stack">
      {!onSelect && exists && (
        <section className="rounded border border-[var(--border)] bg-white p-4">
          <h2>Continue editing</h2>
          <p>{title}</p>
          <Button onClick={() => router.push(`/editor/${templateId}`)}>
            Continue
          </Button>
        </section>
      )}
      <header>
        <h1>Create your resume</h1>
        <p>
          Choose a template to get started. You can customize everything in the
          editor.
        </p>
      </header>
      <label>
        Search templates
        <input
          className="field-control max-w-md"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </label>
      <div role="tablist" aria-label="Template categories">
        {categories.map((category) => (
          <button
            className="button button-secondary"
            role="tab"
            aria-selected={filter === category}
            key={category}
            onClick={() => setFilter(category)}
          >
            {category}
          </button>
        ))}
      </div>
      <section className="template-gallery-grid" aria-label="Resume templates">
        <article className="resume-workspace-template-card p-5">
          <h2>Blank resume</h2>
          <p>Start with a clean page.</p>
          <Button onClick={() => select(templateCatalog[0]!)}>
            Start blank resume
          </Button>
        </article>
        {templateCatalog
          .filter(
            (item) =>
              (filter === "All" || item.category === filter) &&
              `${item.name} ${item.description}`
                .toLowerCase()
                .includes(search.toLowerCase()),
          )
          .map((item) => (
            <TemplateCard
              key={item.id}
              item={item}
              onSelect={select}
              onPreview={setPreview}
            />
          ))}
      </section>
      <Dialog
        open={Boolean(preview)}
        title={preview?.name || "Template preview"}
        onClose={() => setPreview(null)}
        className="max-w-4xl"
      >
        <div className="overflow-auto">
          {preview && renderTemplate(preview)}
        </div>
        {preview && (
          <Button onClick={() => select(preview)}>Use this template</Button>
        )}
      </Dialog>
    </div>
  );
}
