"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Check, X, Layout, ArrowRight } from "lucide-react";
import TemplateOne from "../../components/templates/TemplateOne";
import TemplateTwo from "../../components/templates/TemplateTwo";
import TemplateThree from "../../components/templates/TemplateThree";
import TemplateFour from "../../components/templates/TemplateFour";
import type { ResumeData } from "../../components/templates/TemplateOne";

interface TemplateItem {
  id: string;
  name: string;
  category: "Modern" | "Creative" | "Minimalist" | "Executive";
  description: string;
  tag: string;
}

const templates: TemplateItem[] = [
  {
    id: "1",
    name: "Slate Tech Modern",
    category: "Modern",
    description: "2-Column layout with dark sidebar for Software Developers & Tech Leads.",
    tag: "Popular",
  },
  {
    id: "2",
    name: "Creative Emerald",
    category: "Creative",
    description: "Vibrant emerald header timeline layout for Designers & Product Managers.",
    tag: "Creative",
  },
  {
    id: "3",
    name: "Minimalist Classic",
    category: "Minimalist",
    description: "Single-column clean serif layout for Academics, Attorneys & Analysts.",
    tag: "ATS-Friendly",
  },
  {
    id: "4",
    name: "Executive Corporate Navy",
    category: "Executive",
    description: "Navy top header block for C-Level Directors, VPs & Executives.",
    tag: "Executive",
  },
];

const sampleData: ResumeData = {
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

export default function TemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const filteredTemplates =
    selectedCategory === "All"
      ? templates
      : templates.filter((t) => t.category === selectedCategory);

  const renderTemplateCover = (id: string) => {
    switch (id) {
      case "1":
        return <TemplateOne data={{ ...sampleData, primaryColor: "#0E7C7B" }} />;
      case "2":
        return <TemplateTwo data={{ ...sampleData, primaryColor: "#0E7C7B" }} />;
      case "3":
        return <TemplateThree data={{ ...sampleData, primaryColor: "#334155" }} />;
      case "4":
        return <TemplateFour data={{ ...sampleData, primaryColor: "#1e3a8a" }} />;
      default:
        return <TemplateOne data={sampleData} />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Filter Controls */}
      <div className="bg-white p-6 rounded-2xl border border-[#E3E8EE] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1B2D]">Resume Templates</h1>
          <p className="text-sm text-[#5B6B7F] mt-0.5">
            Select a template below to start editing in canvas mode.
          </p>
        </div>

        {/* Filter on top */}
        <div className="flex flex-wrap gap-2">
          {["All", "Modern", "Creative", "Minimalist", "Executive"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                selectedCategory === cat
                  ? "bg-[#0E7C7B] text-white shadow-xs"
                  : "bg-[#F7F9FB] text-[#5B6B7F] hover:bg-[#E3F4F3] hover:text-[#0E7C7B] border border-[#E3E8EE]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => router.push(`/editor/${tpl.id}`)}
            className="bg-white rounded-2xl border border-[#E3E8EE] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col hover:-translate-y-1"
          >
            {/* Template Cover Image */}
            <div className="relative h-72 bg-[#F7F9FB] border-b border-[#E3E8EE] overflow-hidden flex items-center justify-center p-3">
              <div className="w-full h-full transform scale-[0.45] origin-top hover:scale-[0.48] transition-transform duration-300 shadow-md rounded-md overflow-hidden bg-white pointer-events-none">
                {renderTemplateCover(tpl.id)}
              </div>

              {/* Tag Badge */}
              <span className="absolute top-3 left-3 bg-[#0E7C7B] text-white text-[10px] font-bold px-2.5 py-1 rounded-md">
                {tpl.tag}
              </span>

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-[#0F1B2D]/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewId(tpl.id);
                  }}
                  className="bg-white text-[#0F1B2D] p-2.5 rounded-xl font-semibold text-xs flex items-center space-x-1 shadow-md hover:bg-slate-100"
                >
                  <Eye className="w-4 h-4 text-[#0E7C7B]" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/editor/${tpl.id}`);
                  }}
                  className="bg-[#0E7C7B] text-white p-2.5 rounded-xl font-semibold text-xs flex items-center space-x-1 shadow-md hover:bg-[#0A6463]"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>Use Template</span>
                </button>
              </div>
            </div>

            {/* Template Name Below Cover */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E7C7B] bg-[#E3F4F3] px-2 py-0.5 rounded-md">
                  {tpl.category}
                </span>
                <h3 className="text-base font-bold text-[#0F1B2D] mt-2 group-hover:text-[#0E7C7B] transition">
                  {tpl.name}
                </h3>
                <p className="text-xs text-[#5B6B7F] mt-1">{tpl.description}</p>
              </div>

              <div className="pt-3 mt-4 border-t border-[#E3E8EE] flex justify-end">
                <span className="text-xs font-semibold text-[#0E7C7B] flex items-center gap-1 group-hover:translate-x-0.5 transition">
                  <span>Use Template</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewId && (
        <div className="fixed inset-0 z-50 bg-[#0F1B2D]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-[#E3E8EE]">
            <div className="px-6 py-4 bg-[#0F1B2D] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layout className="w-5 h-5 text-[#0E7C7B]" />
                <h3 className="font-bold text-sm">
                  {templates.find((t) => t.id === previewId)?.name}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => router.push(`/editor/${previewId}`)}
                  className="bg-[#0E7C7B] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Use Template</span>
                </button>
                <button onClick={() => setPreviewId(null)} className="text-white/60 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#F7F9FB] p-6 overflow-y-auto flex justify-center">
              <div className="bg-white shadow-xl rounded-md overflow-hidden max-w-[210mm] w-full">
                {renderTemplateCover(previewId)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}