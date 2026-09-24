"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload, Trash2, Edit2, FileText } from "lucide-react";
import TemplateOne from "../../components/templates/TemplateOne";
import TemplateTwo from "../../components/templates/TemplateTwo";
import TemplateThree from "../../components/templates/TemplateThree";
import TemplateFour from "../../components/templates/TemplateFour";
import type { ResumeData } from "../../components/templates/TemplateOne";

interface SavedResume {
  id: string;
  title: string;
  templateId: string;
  updatedAt: string;
  coverImage?: string;
  data: ResumeData;
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

const defaultResumes: SavedResume[] = [
  {
    id: "res-1",
    title: "Software Engineer Resume",
    templateId: "1",
    updatedAt: new Date().toISOString().slice(0, 10),
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "Software Engineer", primaryColor: "#0E7C7B" },
  },
  {
    id: "res-2",
    title: "AI Developer CV",
    templateId: "2",
    updatedAt: new Date().toISOString().slice(0, 10),
    data: { ...defaultSampleData, fullName: "Jane Doe", jobTitle: "AI Specialist", primaryColor: "#0E7C7B" },
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [resumes, setResumes] = useState<SavedResume[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("saved_resumes");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setResumes(parsed.length > 0 ? parsed : defaultResumes);
        } catch {
          setResumes(defaultResumes);
        }
      } else {
        setResumes(defaultResumes);
        localStorage.setItem("saved_resumes", JSON.stringify(defaultResumes));
      }
    }
  }, []);

  const openEditor = (res: SavedResume) => {
    router.push(`/editor/${res.templateId || "1"}?resumeId=${res.id}`);
  };

  const handleUploadResumeImage = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const coverUrl = reader.result as string;
      const newResume: SavedResume = {
        id: `uploaded-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        templateId: "1",
        updatedAt: new Date().toISOString().slice(0, 10),
        coverImage: coverUrl,
        data: {
          ...defaultSampleData,
          fullName: file.name.replace(/\.[^/.]+$/, ""),
        },
      };

      const updated = [newResume, ...resumes];
      setResumes(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("saved_resumes", JSON.stringify(updated));
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteResume = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = resumes.filter((r) => r.id !== id);
    setResumes(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("saved_resumes", JSON.stringify(updated));
    }
  };

  const renderCover = (res: SavedResume) => {
    if (res.coverImage) {
      return (
        <img src={res.coverImage} alt={res.title} className="w-full h-full object-cover" />
      );
    }

    const tData = res.data || defaultSampleData;

    switch (res.templateId) {
      case "1":
        return <TemplateOne data={tData} />;
      case "2":
        return <TemplateTwo data={tData} />;
      case "3":
        return <TemplateThree data={tData} />;
      case "4":
        return <TemplateFour data={tData} />;
      default:
        return <TemplateOne data={tData} />;
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E3E8EE] shadow-xs">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F1B2D]">My Resumes</h1>
          <p className="text-sm text-[#5B6B7F] mt-0.5">
            Click any resume cover below to open in canvas edit mode.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Upload Resume Button */}
          <label className="bg-[#E3F4F3] hover:bg-teal-100 text-[#0E7C7B] font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer transition flex items-center space-x-2 border border-[#0E7C7B]/30">
            <Upload className="w-4 h-4" />
            <span>Upload Resume</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleUploadResumeImage}
            />
          </label>

          {/* Create New Resume Button */}
          <button
            onClick={() => router.push("/templates")}
            className="bg-[#0E7C7B] hover:bg-[#0A6463] text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition flex items-center space-x-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Resume</span>
          </button>
        </div>
      </div>

      {/* Grid of Documents with Cover Images */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-[#5B6B7F] mb-4">
          All Saved Documents ({resumes.length})
        </div>

        {resumes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E3E8EE]">
            <FileText className="w-12 h-12 text-[#5B6B7F] mx-auto mb-3" />
            <h3 className="font-bold text-[#0F1B2D] text-base">No documents yet</h3>
            <p className="text-xs text-[#5B6B7F] mt-1 mb-6">
              Create a resume or upload an existing file to get started.
            </p>
            <button
              onClick={() => router.push("/templates")}
              className="bg-[#0E7C7B] text-white text-xs font-semibold px-5 py-2.5 rounded-xl"
            >
              Choose Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resumes.map((res) => (
              <div
                key={res.id}
                onClick={() => openEditor(res)}
                className="bg-white rounded-2xl border border-[#E3E8EE] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col hover:-translate-y-1"
              >
                {/* Cover Image Container */}
                <div className="relative h-72 bg-[#F7F9FB] border-b border-[#E3E8EE] overflow-hidden flex items-center justify-center p-3">
                  <div className="w-full h-full transform scale-[0.45] origin-top hover:scale-[0.48] transition-transform duration-300 shadow-md rounded-md overflow-hidden bg-white pointer-events-none">
                    {renderCover(res)}
                  </div>

                  {/* Hover Overlay Badge */}
                  <div className="absolute inset-0 bg-[#0F1B2D]/40 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <span className="bg-[#0E7C7B] text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit in Canvas</span>
                    </span>
                  </div>
                </div>

                {/* Below Cover Image: Name and Actions */}
                <div className="p-4 flex items-center justify-between bg-white">
                  <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-sm text-[#0F1B2D] truncate group-hover:text-[#0E7C7B] transition">
                      {res.title}
                    </h3>
                    <p className="text-[11px] text-[#5B6B7F] mt-0.5">Updated {res.updatedAt}</p>
                  </div>

                  <button
                    onClick={(e) => deleteResume(e, res.id)}
                    className="p-2 text-[#5B6B7F] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}