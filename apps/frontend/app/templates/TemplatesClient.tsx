"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check, X, Layout, Sparkles, Filter, Search } from "lucide-react";
import { TemplateCard, TemplateItem } from "../../components/templates/TemplateCard";
import TemplateOne from "../../components/templates/TemplateOne";
import TemplateTwo from "../../components/templates/TemplateTwo";
import TemplateThree from "../../components/templates/TemplateThree";
import TemplateFour from "../../components/templates/TemplateFour";
import TemplateFive from "../../components/templates/TemplateFive";
import TemplateSix from "../../components/templates/TemplateSix";
import type { ResumeData } from "../../components/templates/TemplateOne";

const defaultSampleData: ResumeData = {
  fullName: "Jane Doe",
  jobTitle: "Product Designer",
  email: "jane@mail.com",
  phone: "+1 555-0192",
  location: "New York, USA",
  summary: "Creative product designer crafting intuitive user interfaces and modern web applications.",
  primaryColor: "#0E7C7B",
  skills: ["UI/UX Design", "Figma", "React", "Tailwind CSS"],
  languages: ["English"],
  experience: [
    {
      id: "exp-1",
      role: "Senior Product Designer",
      company: "Design Studio",
      period: "2023 - Present",
      details: "Leading UI component systems and product design workflows.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.A. Graphic Design",
      institution: "Design Institute",
      period: "2019 - 2023",
    },
  ],
};

const initialTemplates: TemplateItem[] = [
  {
    id: "1",
    name: "Slate Tech Modern",
    category: "Modern",
    description: "2-Column layout with dark sidebar for Software Developers & Tech Leads.",
    tag: "Popular",
    updatedAt: "2026-09-24",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Software Engineer", primaryColor: "#0E7C7B" },
  },
  {
    id: "2",
    name: "Creative Emerald",
    category: "Creative",
    description: "Vibrant emerald header timeline layout for Designers & Product Managers.",
    tag: "Creative",
    updatedAt: "2026-09-24",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "AI Specialist", primaryColor: "#059669" },
  },
  {
    id: "3",
    name: "Minimalist Classic",
    category: "Minimalist",
    description: "Single-column clean serif layout for Academics, Attorneys & Analysts.",
    tag: "ATS-Friendly",
    updatedAt: "2026-09-24",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Legal Counsel", primaryColor: "#334155" },
  },
  {
    id: "4",
    name: "Executive Corporate Navy",
    category: "Executive",
    description: "Navy top header block for C-Level Directors, VPs & Executives.",
    tag: "Executive",
    updatedAt: "2026-09-24",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "VP of Product", primaryColor: "#1e3a8a" },
  },
  {
    id: "5",
    name: "Modern Executive Headshot",
    category: "Modern",
    description: "2-Column dark header layout with prominent candidate headshot photo frame.",
    tag: "Photo Template",
    updatedAt: "2026-09-24",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Chief Executive Officer", primaryColor: "#0E7C7B" },
  },
  {
    id: "6",
    name: "Creative Studio Avatar",
    category: "Creative",
    description: "Purple theme portfolio layout with circular candidate avatar photo badge.",
    tag: "Photo Template",
    updatedAt: "2026-09-24",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Creative Art Director", primaryColor: "#9333ea" },
  },
];

export default function TemplatesClient() {
  const router = useRouter();
  const [templateList, setTemplateList] = useState<TemplateItem[]>(initialTemplates);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setTemplateList((prev) => prev.filter((t) => t.id !== id));
  };

  const handlePreview = (item: TemplateItem) => {
    setPreviewId(item.id);
  };

  const filteredTemplates = templateList.filter((t) => {
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderModalPreview = (id: string) => {
    const tItem = templateList.find((t) => t.id === id);
    const data = tItem?.data || defaultSampleData;

    switch (id) {
      case "1":
        return <TemplateOne data={{ ...data, primaryColor: "#0E7C7B" }} />;
      case "2":
        return <TemplateTwo data={{ ...data, primaryColor: "#059669" }} />;
      case "3":
        return <TemplateThree data={{ ...data, primaryColor: "#334155" }} />;
      case "4":
        return <TemplateFour data={{ ...data, primaryColor: "#1e3a8a" }} />;
      case "5":
        return <TemplateFive data={{ ...data, primaryColor: "#0E7C7B" }} />;
      case "6":
        return <TemplateSix data={{ ...data, primaryColor: "#9333ea" }} />;
      default:
        return <TemplateOne data={data} />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Filter Controls in Docs Style */}
      <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Resume Template Documentation</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              Resume Templates Gallery
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
              Choose from our curated collection of professional, ATS-optimized resume templates. Each card includes options to delete, download, or immediately launch in canvas edit mode.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-[var(--text-muted)] bg-[var(--primary-tint)] px-3 py-1.5 rounded-xl border border-[var(--primary)]/30">
              {filteredTemplates.length} Templates Available
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search templates by role or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--primary)] transition"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-1.5">
            {["All", "Modern", "Creative", "Minimalist", "Executive"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] border border-[var(--border)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Documentation (Docs) Layout */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 px-1">
          Catalog Grid View ({filteredTemplates.length})
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl p-12 text-center border border-[var(--border)]">
            <Layout className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h3 className="font-bold text-[var(--text)] text-base">No templates match your search</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-6">
              Try selecting a different category or clearing search term.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setSearchQuery("");
              }}
              className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold px-5 py-2.5 rounded-xl"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredTemplates.map((tpl) => (
              <TemplateCard key={tpl.id} item={tpl} onDelete={handleDelete} onPreview={handlePreview} />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewId && (
        <div className="fixed inset-0 z-50 bg-[#0F1B2D]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[var(--border)]">
            <div className="px-6 py-4 bg-[var(--text)] text-[var(--surface)] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-bold text-sm">
                  {templateList.find((t) => t.id === previewId)?.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/editor/${previewId}`)}
                  className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Template</span>
                </button>
                <button onClick={() => setPreviewId(null)} className="text-white/60 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[var(--bg)] p-6 overflow-y-auto flex justify-center">
              <div className="bg-white shadow-xl rounded-md overflow-hidden max-w-[210mm] w-full">
                {renderModalPreview(previewId)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
