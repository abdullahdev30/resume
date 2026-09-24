"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2, ArrowRight, Eye, Check } from "lucide-react";
import TemplateOne from "./TemplateOne";
import TemplateTwo from "./TemplateTwo";
import TemplateThree from "./TemplateThree";
import TemplateFour from "./TemplateFour";
import TemplateFive from "./TemplateFive";
import TemplateSix from "./TemplateSix";
import type { ResumeData } from "./TemplateOne";

export interface TemplateItem {
  id: string;
  name: string;
  category: "Modern" | "Creative" | "Minimalist" | "Executive";
  description: string;
  tag: string;
  isCustom?: boolean;
  updatedAt?: string;
  coverImage?: string;
  data?: ResumeData;
}

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

interface TemplateCardProps {
  item: TemplateItem;
  onDelete?: (id: string) => void;
  onPreview?: (item: TemplateItem) => void;
}

export function TemplateCard({ item, onDelete, onPreview }: TemplateCardProps) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const renderThumbnail = () => {
    if (item.coverImage) {
      return <img src={item.coverImage} alt={item.name} className="w-full h-full object-cover" />;
    }

    const resData = item.data || defaultSampleData;
    switch (item.id) {
      case "1":
        return <TemplateOne data={{ ...resData, primaryColor: "#0E7C7B" }} />;
      case "2":
        return <TemplateTwo data={{ ...resData, primaryColor: "#059669" }} />;
      case "3":
        return <TemplateThree data={{ ...resData, primaryColor: "#334155" }} />;
      case "4":
        return <TemplateFour data={{ ...resData, primaryColor: "#1e3a8a" }} />;
      case "5":
        return <TemplateFive data={{ ...resData, primaryColor: "#0E7C7B" }} />;
      case "6":
        return <TemplateSix data={{ ...resData, primaryColor: "#9333ea" }} />;
      default:
        return <TemplateOne data={resData} />;
    }
  };

  const handleUseTemplate = () => {
    router.push(`/editor/${item.id}`);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);

    // Open print preview / window for instant downloading
    const printWindow = window.open(`/editor/${item.id}`, "_blank");
    setTimeout(() => {
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
      setDownloading(false);
    }, 800);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(item.id);
    }
  };

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col group hover:-translate-y-1">
      {/* 1. Full Container Thumbnail Image Area */}
      <div
        onClick={handleUseTemplate}
        className="relative h-80 bg-white border-b border-[var(--border)] overflow-hidden flex justify-center items-start cursor-pointer group"
      >
        <div className="w-[210mm] min-h-[297mm] transform scale-[0.48] group-hover:scale-[0.51] origin-top transition-transform duration-300 shadow-sm bg-white pointer-events-none mt-1">
          {renderThumbnail()}
        </div>

        {/* Tag Badge */}
        <span className="absolute top-3 left-3 bg-[var(--primary)] text-[var(--on-primary)] text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs z-10">
          {item.tag || item.category}
        </span>

        {/* Hover Quick Preview Button */}
        {onPreview && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPreview(item);
            }}
            className="absolute top-3 right-3 bg-[var(--surface)] text-[var(--text)] p-2 rounded-xl text-xs font-semibold shadow-md opacity-0 group-hover:opacity-100 transition hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] flex items-center space-x-1 z-10"
            title="Preview Template"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 2. Document Info Header */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-md">
              {item.category}
            </span>
            {item.updatedAt && (
              <span className="text-[11px] text-[var(--text-muted)] font-medium">
                {item.updatedAt}
              </span>
            )}
          </div>

          <h3
            onClick={handleUseTemplate}
            className="text-base font-bold text-[var(--text)] group-hover:text-[var(--primary)] transition cursor-pointer line-clamp-1 mt-1"
          >
            {item.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{item.description}</p>
        </div>

        {/* 3. Action Toolbar: Delete, Download Icon, Use This Template */}
        <div className="pt-3 mt-4 border-t border-[var(--border)] flex items-center justify-between gap-2">
          {/* Left Action Buttons: Delete & Download */}
          <div className="flex items-center space-x-1">
            {/* Delete Option */}
            <button
              onClick={handleDelete}
              className="p-2 text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="Delete Resume Template"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Download Icon */}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-tint)] rounded-xl transition"
              title="Download Resume Template"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Right Action: Use This Template */}
          <button
            onClick={handleUseTemplate}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-xs"
          >
            <span>Use This Template</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
