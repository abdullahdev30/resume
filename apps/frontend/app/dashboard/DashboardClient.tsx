"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, FileText, Search, LayoutGrid, CheckCircle2 } from "lucide-react";
import { TemplateCard, TemplateItem } from "../../components/templates/TemplateCard";
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
    updatedAt: "Today",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Software Engineer", primaryColor: "#0E7C7B" },
  },
  {
    id: "2",
    name: "Creative Emerald",
    category: "Creative",
    description: "Vibrant emerald header timeline layout for Designers & Product Managers.",
    tag: "Creative",
    updatedAt: "Yesterday",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "AI Specialist", primaryColor: "#059669" },
  },
  {
    id: "3",
    name: "Minimalist Classic",
    category: "Minimalist",
    description: "Single-column clean serif layout for Academics, Attorneys & Analysts.",
    tag: "ATS-Friendly",
    updatedAt: "3 days ago",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Legal Counsel", primaryColor: "#334155" },
  },
  {
    id: "4",
    name: "Executive Corporate Navy",
    category: "Executive",
    description: "Navy top header block for C-Level Directors, VPs & Executives.",
    tag: "Executive",
    updatedAt: "1 week ago",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "VP of Product", primaryColor: "#1e3a8a" },
  },
  {
    id: "5",
    name: "Modern Executive Headshot",
    category: "Modern",
    description: "2-Column dark header layout with prominent candidate headshot photo frame.",
    tag: "Photo Template",
    updatedAt: "Just now",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Chief Executive Officer", primaryColor: "#0E7C7B" },
  },
  {
    id: "6",
    name: "Creative Studio Avatar",
    category: "Creative",
    description: "Purple theme portfolio layout with circular candidate avatar photo badge.",
    tag: "Photo Template",
    updatedAt: "Just now",
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Creative Art Director", primaryColor: "#9333ea" },
  },
];

export default function DashboardClient() {
  const router = useRouter();
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [notification, setNotification] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("saved_resumes");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.length > 0) {
            const mapped: TemplateItem[] = parsed.map((res: any) => ({
              id: res.templateId || res.id || "1",
              name: res.title || "My Resume Document",
              category: "Modern",
              description: "Custom editable document saved in your profile.",
              tag: "Saved",
              updatedAt: res.updatedAt || new Date().toISOString().slice(0, 10),
              coverImage: res.coverImage,
              data: res.data || defaultSampleData,
            }));
            setItems([...mapped, ...initialTemplates.filter((t) => !mapped.some((m) => m.id === t.id))]);
            return;
          }
        } catch {
          // fallback
        }
      }
      setItems(initialTemplates);
    }
  }, []);

  const handleDelete = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    setItems(updated);
    if (typeof window !== "undefined") {
      const savedResumes = JSON.parse(localStorage.getItem("saved_resumes") || "[]");
      const filteredSaved = savedResumes.filter((r: any) => r.id !== id && r.templateId !== id);
      localStorage.setItem("saved_resumes", JSON.stringify(filteredSaved));
    }
    setNotification("Resume template removed!");
    setTimeout(() => setNotification(""), 3000);
  };

  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const coverUrl = reader.result as string;
      const newItem: TemplateItem = {
        id: `uploaded-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        category: "Creative",
        description: `Uploaded file: ${file.name}`,
        tag: "Uploaded",
        updatedAt: "Just now",
        coverImage: coverUrl,
        data: defaultSampleData,
      };

      const updated = [newItem, ...items];
      setItems(updated);
      setNotification(`Uploaded "${file.name}" successfully!`);
      setTimeout(() => setNotification(""), 3500);
    };
    reader.readAsDataURL(file);
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Header Banner & Docs Controls */}
      <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-1">
              <LayoutGrid className="w-4 h-4" />
              <span>Resume Library & Dashboard</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text)] tracking-tight">
              Resume Templates & Documents
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-1 max-w-2xl">
              Browse docs-style templates, upload external resumes, and click any template card to build or customize in canvas mode.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="bg-[var(--primary-tint)] hover:bg-[var(--border)] text-[var(--primary)] font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center space-x-2 border border-[var(--primary)]/30">
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
            </label>

            <button
              onClick={() => router.push("/templates")}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] font-semibold text-xs px-4.5 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Resume</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter bar */}
        <div className="pt-4 border-t border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resume docs & templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text)] outline-none focus:border-[var(--primary)] transition"
            />
          </div>

          {/* Category Tabs */}
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

      {/* Toast Notification */}
      {notification && (
        <div className="bg-[var(--primary-tint)] border-l-4 border-[var(--primary)] p-4 rounded-xl flex items-center space-x-2 text-[var(--primary)] text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* 2. Grid Documentation (Docs) View */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 px-1">
          <span>Available Templates ({filteredItems.length})</span>
          <span>Documentation Grid View</span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="bg-[var(--surface)] rounded-2xl p-12 text-center border border-[var(--border)]">
            <FileText className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <h3 className="font-bold text-[var(--text)] text-base">No templates found</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 mb-6">
              Try adjusting your search criteria or clear category filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-semibold px-5 py-2.5 rounded-xl"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <TemplateCard key={item.id} item={item} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
