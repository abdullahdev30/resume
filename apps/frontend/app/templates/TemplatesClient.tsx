"use client";

import { Check, LayoutTemplate, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { blankResumeData, createTemplateResumeFromItem, renderTemplate, TemplateCard } from "@/components/templates/TemplateCard";
import { templateCatalog, type TemplateItem } from "@/components/templates/catalog";
import type { ProfileResponse } from "@/modules/profile/types";
import { profileToResumeData } from "@/modules/resume/profileSnapshot";

type Category = "All" | TemplateItem["category"];
const categories: Category[] = ["All", "Modern", "Creative", "Minimalist", "Executive"];

export default function TemplatesClient({ profile }: { profile: ProfileResponse | null }) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [preview, setPreview] = useState<TemplateItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const filteredTemplates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const profileData = profile ? profileToResumeData(profile) : blankResumeData;
    return templateCatalog
      .filter((template) => {
        const categoryMatches = selectedCategory === "All" || template.category === selectedCategory;
        const queryMatches = !query || `${template.name} ${template.description} ${template.category}`.toLowerCase().includes(query);
        return categoryMatches && queryMatches;
      })
      .map((template) => ({
        ...template,
        data: {
          ...blankResumeData,
          ...profileData,
          primaryColor: template.data.primaryColor || blankResumeData.primaryColor,
          fontFamily: template.data.fontFamily || blankResumeData.fontFamily,
        },
      }));
  }, [profile, searchQuery, selectedCategory]);

  const useTemplate = async (item: TemplateItem) => {
    if (creating) return;
    setCreating(true);
    setError("");
    try {
      const resume = await createTemplateResumeFromItem(item, profile);
      toast.success("A new independent resume was created from this template.", "Resume created");
      router.push(`/editor/${resume.template_id || item.id}?resumeId=${resume.id}`);
    } catch {
      const message = "We could not create the resume. Check your connection and try again.";
      setError(message);
      toast.error(message, "Creation failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-stack">
      <Card padding="lg">
        <PageHeader
          eyebrow="Template gallery"
          icon={<Sparkles size={15} aria-hidden="true" />}
          title="Choose a professional starting point"
          description="Preview each layout, then create a new resume prefilled from your saved profile."
        />
        <div className="mt-6 grid gap-5 border-t border-[var(--border)] pt-5">
          <div className="max-w-md">
            <Input
              label="Search templates"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by style or use case"
              leading={<Search size={16} aria-hidden="true" />}
            />
          </div>
          <Tabs
            ariaLabel="Template categories"
            items={categories.map((category) => ({ id: category, label: category }))}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
      </Card>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-[var(--text)]">Available templates</h2>
        <span className="text-xs text-[var(--text-muted)]" aria-live="polite">
          {filteredTemplates.length} {filteredTemplates.length === 1 ? "template" : "templates"}
        </span>
      </div>

      {filteredTemplates.length === 0 ? (
        <EmptyState
          title="No templates match"
          description="Try a different search or browse every category."
          icon={<LayoutTemplate size={22} aria-hidden="true" />}
          action={<Button variant="secondary" onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}>Clear filters</Button>}
        />
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Resume templates">
          {filteredTemplates.map((template) => (
            <TemplateCard key={template.id} item={template} onPreview={setPreview} profile={profile} />
          ))}
        </section>
      )}

      <Dialog
        open={Boolean(preview)}
        title={preview?.name}
        description={preview?.description}
        onClose={() => !creating && setPreview(null)}
        preventClose={creating}
        className="dialog-wide"
      >
        {preview && (
          <>
            <div className="max-h-[65vh] overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:p-6">
              <div className="mx-auto w-full max-w-[210mm] overflow-hidden rounded-md bg-white shadow-xl">
                {renderTemplate(preview)}
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setPreview(null)} disabled={creating}>Close preview</Button>
              <Button
                onClick={() => void useTemplate(preview)}
                loading={creating}
                loadingLabel="Creating resume..."
              >
                <Check size={16} aria-hidden="true" />
                Use this template
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}
