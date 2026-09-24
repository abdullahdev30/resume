"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  Download,
  Printer,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Palette,
  Type,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  FileText,
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Wrench,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PenTool,
  Check,
  X,
} from "lucide-react";

import TemplateOne from "../../../components/templates/TemplateOne";
import TemplateTwo from "../../../components/templates/TemplateTwo";
import TemplateThree from "../../../components/templates/TemplateThree";
import TemplateFour from "../../../components/templates/TemplateFour";
import type { ResumeData } from "../../../components/templates/TemplateOne";

const initialResumeData: ResumeData = {
  fullName: "Jane Doe",
  jobTitle: "Product Designer",
  email: "jane@mail.com",
  phone: "+1 555-0192",
  location: "New York, USA",
  summary:
    "Creative product designer crafting intuitive user interfaces and modern web applications with focus on usability and elegant design systems.",
  primaryColor: "#0E7C7B",
  fontFamily: "Inter, sans-serif",
  skills: ["UI/UX Design", "Figma", "React", "TypeScript", "Tailwind CSS", "User Research"],
  languages: ["English (Native)", "French (Intermediate)"],
  experience: [
    {
      id: "exp-1",
      role: "Senior Product Designer",
      company: "Design Studio Inc.",
      period: "2023 - Present",
      details: "Leading UI component design systems and cross-platform product design workflows.",
    },
    {
      id: "exp-2",
      role: "UI Engineer",
      company: "Creative Cloud Labs",
      period: "2021 - 2023",
      details: "Created responsive interfaces and design tokens used by over 500k active users.",
    },
  ],
  education: [
    {
      id: "edu-1",
      degree: "B.A. Graphic & Digital Design",
      institution: "New York Design Academy",
      period: "2017 - 2021",
    },
  ],
};

// Google Docs Color Columns (Hue columns with shade rows)
const googleDocsColorColumns = [
  { hue: "Grayscale", colors: ["#000000", "#1e293b", "#334155", "#64748b", "#94a3b8", "#cbd5e1", "#f8fafc"] },
  { hue: "Teal (Auth)", colors: ["#06201f", "#0a6463", "#0e7c7b", "#14b8a6", "#2dd4bf", "#5eead4", "#e3f4f3"] },
  { hue: "Blue", colors: ["#1e3a8a", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#dbeafe"] },
  { hue: "Indigo", colors: ["#312e81", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#e0e7ff"] },
  { hue: "Purple", colors: ["#581c87", "#7e22ce", "#9333ea", "#a855f7", "#c084fc", "#e9d5ff", "#f3e8ff"] },
  { hue: "Red / Rose", colors: ["#881337", "#be123c", "#e11d48", "#f43f5e", "#fb7185", "#fca5a5", "#ffe4e6"] },
  { hue: "Amber / Orange", colors: ["#78350f", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#fde68a", "#fef3c7"] },
  { hue: "Emerald", colors: ["#064e3b", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#d1fae5"] },
];

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTemplateId, setActiveTemplateId] = useState<string>((params.templateId as string) || "1");
  // USER CANNOT CHANGE RESUME TITLE DURING EDITING: Fixed title string
  const [resumeTitle, setResumeTitle] = useState<string>("My Resume Document");
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "education" | "skills">("personal");
  const [saveNotice, setSaveNotice] = useState<string>("");
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);

  // Formatting toolbar states
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [isUnderline, setIsUnderline] = useState<boolean>(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");

  // Color Popover state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customHex, setCustomHex] = useState<string>("#0E7C7B");
  const [showCustomHexInput, setShowCustomHexInput] = useState<boolean>(false);

  // Load existing user profile / saved resume on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const resumeIdParam = searchParams.get("resumeId");
      if (resumeIdParam) {
        const savedResumes = JSON.parse(localStorage.getItem("saved_resumes") || "[]");
        const found = savedResumes.find((r: any) => r.id === resumeIdParam);
        if (found) {
          setEditingResumeId(found.id);
          setResumeTitle(found.title);
          setActiveTemplateId(found.templateId || "1");
          if (found.data) setResumeData(found.data);
          return;
        }
      }

      const avatar = localStorage.getItem("user_avatar");
      if (avatar) {
        setResumeData((prev) => ({ ...prev, avatarUrl: avatar }));
      }
    }
  }, [searchParams]);

  const handleFieldChange = (field: keyof ResumeData, value: any) => {
    setResumeData((prev) => ({ ...prev, [field]: value }));
  };

  const handleExperienceChange = (
    index: number,
    key: "role" | "company" | "period" | "details",
    value: string
  ) => {
    const updated = [...resumeData.experience];
    const item = updated[index];
    if (item) {
      updated[index] = { ...item, [key]: value };
      setResumeData((prev) => ({ ...prev, experience: updated }));
    }
  };

  const addExperience = () => {
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `exp-${Date.now()}`,
          role: "Software Engineer",
          company: "Company Name",
          period: "2024 - Present",
          details: "Describe key responsibilities and achievements...",
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index),
    }));
  };

  const handleEducationChange = (
    index: number,
    key: "degree" | "institution" | "period" | "grade",
    value: string
  ) => {
    const updated = [...(resumeData.education || [])];
    const item = updated[index];
    if (item) {
      updated[index] = { ...item, [key]: value };
      setResumeData((prev) => ({ ...prev, education: updated }));
    }
  };

  const addEducation = () => {
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id: `edu-${Date.now()}`,
          degree: "Degree / Qualification",
          institution: "University / Institute Name",
          period: "2020 - 2024",
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index),
    }));
  };

  const addSkill = (skillText: string) => {
    if (!skillText.trim()) return;
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, skillText.trim()],
    }));
  };

  const removeSkill = (index: number) => {
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleSaveResume = () => {
    if (typeof window === "undefined") return;
    const existing = JSON.parse(localStorage.getItem("saved_resumes") || "[]");

    const id = editingResumeId || `res-${Date.now()}`;
    const newResume = {
      id,
      title: resumeTitle,
      templateId: activeTemplateId,
      updatedAt: new Date().toISOString().slice(0, 10),
      data: resumeData,
    };

    const filtered = existing.filter((r: any) => r.id !== id);
    const updated = [newResume, ...filtered];

    localStorage.setItem("saved_resumes", JSON.stringify(updated));
    setEditingResumeId(id);
    setSaveNotice("Resume saved!");
    setTimeout(() => setSaveNotice(""), 3500);
  };

  const selectColor = (color: string) => {
    handleFieldChange("primaryColor", color);
    setCustomHex(color);
    setShowColorPicker(false);
  };

  const renderSelectedTemplate = () => {
    switch (activeTemplateId) {
      case "1":
        return <TemplateOne data={resumeData} />;
      case "2":
        return <TemplateTwo data={resumeData} />;
      case "3":
        return <TemplateThree data={resumeData} />;
      case "4":
        return <TemplateFour data={resumeData} />;
      default:
        return <TemplateOne data={resumeData} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col font-sans text-[#0F1B2D]">
      {/* 1. Editor Navbar Header */}
      <header className="bg-white border-b border-[#E3E8EE] px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-40 shadow-xs">
        {/* Left Side: Back & Non-Editable Resume Title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-lg text-[#5B6B7F] hover:text-[#0E7C7B] hover:bg-[#E3F4F3] transition"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#0E7C7B]" />
            {/* USER CANNOT CHANGE RESUME TITLE DURING EDITING */}
            <span className="text-sm font-extrabold text-[#0F1B2D] px-2 py-1 bg-[#F7F9FB] border border-[#E3E8EE] rounded-lg">
              {resumeTitle}
            </span>
          </div>

          <span className="hidden md:flex items-center text-xs text-[#0E7C7B] font-semibold bg-[#E3F4F3] px-2.5 py-0.5 rounded-full border border-[#0E7C7B]/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Editing Mode
          </span>
        </div>

        {/* Center: Template Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#5B6B7F] font-semibold hidden sm:inline">Template:</span>
          <select
            value={activeTemplateId}
            onChange={(e) => setActiveTemplateId(e.target.value)}
            className="bg-white border border-[#E3E8EE] text-[#0F1B2D] text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-[#0E7C7B]"
          >
            <option value="1">Template #1: Slate Tech Modern</option>
            <option value="2">Template #2: Creative Emerald</option>
            <option value="3">Template #3: Minimalist Classic</option>
            <option value="4">Template #4: Executive Corporate Navy</option>
          </select>
        </div>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center space-x-3">
          {saveNotice && (
            <span className="text-xs font-bold text-[#0E7C7B] animate-fadeIn">{saveNotice}</span>
          )}

          <button
            onClick={handleSaveResume}
            className="bg-[#E3F4F3] hover:bg-teal-100 text-[#0E7C7B] text-xs font-bold px-4 py-2 rounded-xl border border-[#0E7C7B]/30 transition flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Save Resume</span>
          </button>

          <button
            onClick={() => window.print()}
            className="bg-[#0E7C7B] hover:bg-[#0A6463] text-white text-xs font-bold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </header>

      {/* 2. Google Docs Formatting Toolbar (Row 2) */}
      <div className="bg-white border-b border-[#E3E8EE] px-4 py-2 flex items-center flex-wrap gap-3 overflow-x-auto text-xs text-[#0F1B2D] relative z-30 shadow-xs">
        {/* Undo / Redo / Print */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#E3E8EE]">
          <button className="p-1.5 hover:bg-[#E3F4F3] rounded text-[#5B6B7F] hover:text-[#0E7C7B]" title="Undo">
            <Undo className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-[#E3F4F3] rounded text-[#5B6B7F] hover:text-[#0E7C7B]" title="Redo">
            <Redo className="w-4 h-4" />
          </button>
          <button onClick={() => window.print()} className="p-1.5 hover:bg-[#E3F4F3] rounded text-[#5B6B7F] hover:text-[#0E7C7B]" title="Print Document">
            <Printer className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom selector */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#E3E8EE]">
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1.5 hover:bg-[#E3F4F3] rounded text-[#5B6B7F] hover:text-[#0E7C7B]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-semibold text-[#0F1B2D] px-1">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1.5 hover:bg-[#E3F4F3] rounded text-[#5B6B7F] hover:text-[#0E7C7B]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Font Family selector */}
        <div className="flex items-center space-x-2 pr-3 border-r border-[#E3E8EE]">
          <Type className="w-4 h-4 text-[#5B6B7F]" />
          <select
            value={resumeData.fontFamily || "Inter, sans-serif"}
            onChange={(e) => handleFieldChange("fontFamily", e.target.value)}
            className="bg-[#F7F9FB] border border-[#E3E8EE] text-[#0F1B2D] text-xs font-semibold px-2 py-1 rounded-lg outline-none cursor-pointer"
          >
            <option value="Inter, sans-serif">Inter (Sans-Serif)</option>
            <option value="Georgia, serif">Georgia (Serif)</option>
            <option value="Bricolage Grotesque, sans-serif">Bricolage (Modern)</option>
            <option value="Courier New, monospace">Courier (Monospace)</option>
          </select>
        </div>

        {/* GOOGLE DOCS STYLE COLOR PALETTE POP-OVER */}
        <div className="relative pr-3 border-r border-[#E3E8EE]">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center space-x-2 bg-[#F7F9FB] hover:bg-[#E3F4F3] border border-[#E3E8EE] px-3 py-1 rounded-lg font-semibold transition"
          >
            <Palette className="w-4 h-4 text-[#0E7C7B]" />
            <span>Color</span>
            <div
              className="w-4 h-4 rounded-full border border-black/20"
              style={{ backgroundColor: resumeData.primaryColor || "#0E7C7B" }}
            />
          </button>

          {/* Color Popover Grid */}
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-white border border-[#E3E8EE] shadow-2xl rounded-2xl p-4 w-72 z-50 animate-fadeIn space-y-3">
              <div className="flex items-center justify-between border-b border-[#E3E8EE] pb-2">
                <span className="font-bold text-xs text-[#0F1B2D]">Google Docs Color Grid</span>
                <button onClick={() => setShowColorPicker(false)} className="text-[#5B6B7F] hover:text-[#0F1B2D]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Color Columns Grid */}
              <div className="grid grid-cols-8 gap-1.5">
                {googleDocsColorColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1.5">
                    {col.colors.map((color, rowIdx) => (
                      <button
                        key={rowIdx}
                        onClick={() => selectColor(color)}
                        className={`w-6 h-6 rounded-md border border-black/10 transition transform hover:scale-110 flex items-center justify-center ${
                          resumeData.primaryColor === color ? "ring-2 ring-[#0E7C7B] ring-offset-1" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {resumeData.primaryColor === color && (
                          <Check className={`w-3 h-3 ${rowIdx > 3 ? "text-white" : "text-black"}`} />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Pen Icon / Custom Color Input */}
              <div className="pt-2 border-t border-[#E3E8EE]">
                {!showCustomHexInput ? (
                  <button
                    onClick={() => setShowCustomHexInput(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-[#F7F9FB] hover:bg-[#E3F4F3] border border-[#E3E8EE] py-2 rounded-xl text-xs font-bold text-[#0E7C7B] transition"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Custom Color (Hex Code)</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <PenTool className="w-4 h-4 text-[#0E7C7B]" />
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      placeholder="#0E7C7B"
                      className="flex-1 bg-[#F7F9FB] border border-[#E3E8EE] rounded-lg p-1.5 font-mono text-xs text-[#0F1B2D] outline-none"
                    />
                    <button
                      onClick={() => selectColor(customHex)}
                      className="bg-[#0E7C7B] text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text Formatting Toolbar: Bold, Italic, Underline */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#E3E8EE]">
          <button
            onClick={() => setIsBold(!isBold)}
            className={`p-1.5 rounded font-bold transition ${
              isBold ? "bg-[#0E7C7B] text-white" : "hover:bg-[#E3F4F3] text-[#5B6B7F]"
            }`}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsItalic(!isItalic)}
            className={`p-1.5 rounded italic transition ${
              isItalic ? "bg-[#0E7C7B] text-white" : "hover:bg-[#E3F4F3] text-[#5B6B7F]"
            }`}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsUnderline(!isUnderline)}
            className={`p-1.5 rounded underline transition ${
              isUnderline ? "bg-[#0E7C7B] text-white" : "hover:bg-[#E3F4F3] text-[#5B6B7F]"
            }`}
            title="Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[#E3E8EE]">
          <button
            onClick={() => setTextAlign("left")}
            className={`p-1.5 rounded transition ${
              textAlign === "left" ? "bg-[#0E7C7B] text-white" : "hover:bg-[#E3F4F3] text-[#5B6B7F]"
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTextAlign("center")}
            className={`p-1.5 rounded transition ${
              textAlign === "center" ? "bg-[#0E7C7B] text-white" : "hover:bg-[#E3F4F3] text-[#5B6B7F]"
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setTextAlign("right")}
            className={`p-1.5 rounded transition ${
              textAlign === "right" ? "bg-[#0E7C7B] text-white" : "hover:bg-[#E3F4F3] text-[#5B6B7F]"
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Section Adders */}
        <div className="flex items-center space-x-2">
          <button
            onClick={addExperience}
            className="bg-[#E3F4F3] hover:bg-teal-100 text-[#0E7C7B] px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition border border-[#0E7C7B]/30"
          >
            <Plus className="w-3 h-3" />
            <span>+ Experience</span>
          </button>
          <button
            onClick={addEducation}
            className="bg-[#E3F4F3] hover:bg-teal-100 text-[#0E7C7B] px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition border border-[#0E7C7B]/30"
          >
            <Plus className="w-3 h-3" />
            <span>+ Education</span>
          </button>
        </div>
      </div>

      {/* 3. Main Split Layout: Form Drawer Left + Live Canvas Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Form Sidebar Drawer */}
        <div className="w-[360px] lg:w-[420px] bg-white border-r border-[#E3E8EE] flex flex-col flex-shrink-0">
          {/* Section Tabs */}
          <div className="flex border-b border-[#E3E8EE] bg-[#F7F9FB] p-2 gap-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "personal" ? "bg-[#0E7C7B] text-white shadow-xs" : "text-[#5B6B7F] hover:bg-[#E3F4F3]"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Personal</span>
            </button>

            <button
              onClick={() => setActiveTab("experience")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "experience" ? "bg-[#0E7C7B] text-white shadow-xs" : "text-[#5B6B7F] hover:bg-[#E3F4F3]"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Jobs ({resumeData.experience?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("education")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "education" ? "bg-[#0E7C7B] text-white shadow-xs" : "text-[#5B6B7F] hover:bg-[#E3F4F3]"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>School</span>
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "skills" ? "bg-[#0E7C7B] text-white shadow-xs" : "text-[#5B6B7F] hover:bg-[#E3F4F3]"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Skills</span>
            </button>
          </div>

          {/* Form Inputs */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
            {activeTab === "personal" && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[#0F1B2D]">Personal Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[#5B6B7F] block mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.fullName}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      className="w-full bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2.5 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                    />
                  </div>

                  <div>
                    <label className="text-[#5B6B7F] block mb-1 font-semibold">Job Title / Headline</label>
                    <input
                      type="text"
                      value={resumeData.jobTitle}
                      onChange={(e) => handleFieldChange("jobTitle", e.target.value)}
                      className="w-full bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2.5 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[#5B6B7F] block mb-1 font-semibold">Email</label>
                      <input
                        type="email"
                        value={resumeData.email}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className="w-full bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2.5 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                      />
                    </div>
                    <div>
                      <label className="text-[#5B6B7F] block mb-1 font-semibold">Phone</label>
                      <input
                        type="text"
                        value={resumeData.phone}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        className="w-full bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2.5 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[#5B6B7F] block mb-1 font-semibold">Location</label>
                    <input
                      type="text"
                      value={resumeData.location}
                      onChange={(e) => handleFieldChange("location", e.target.value)}
                      className="w-full bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2.5 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                    />
                  </div>

                  <div>
                    <label className="text-[#5B6B7F] block mb-1 font-semibold">Professional Summary</label>
                    <textarea
                      rows={4}
                      value={resumeData.summary}
                      onChange={(e) => handleFieldChange("summary", e.target.value)}
                      className="w-full bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2.5 text-[#0F1B2D] outline-none focus:border-[#0E7C7B] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-[#0F1B2D]">Work History</h3>
                  <button
                    onClick={addExperience}
                    className="bg-[#0E7C7B] hover:bg-[#0A6463] text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Job</span>
                  </button>
                </div>

                {resumeData.experience.map((exp, index) => (
                  <div key={exp.id || index} className="p-4 bg-[#F7F9FB] border border-[#E3E8EE] rounded-2xl space-y-3 relative">
                    <button
                      onClick={() => removeExperience(index)}
                      className="absolute top-3 right-3 text-[#5B6B7F] hover:text-rose-600 p-1"
                      title="Remove Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <label className="text-[#5B6B7F] block mb-1 font-semibold">Job Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => handleExperienceChange(index, "role", e.target.value)}
                        className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#5B6B7F] block mb-1 font-semibold">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                          className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5B6B7F] block mb-1 font-semibold">Dates</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => handleExperienceChange(index, "period", e.target.value)}
                          className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#5B6B7F] block mb-1 font-semibold">Details</label>
                      <textarea
                        rows={3}
                        value={exp.details}
                        onChange={(e) => handleExperienceChange(index, "details", e.target.value)}
                        className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B] resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-[#0F1B2D]">Education History</h3>
                  <button
                    onClick={addEducation}
                    className="bg-[#0E7C7B] hover:bg-[#0A6463] text-white font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add School</span>
                  </button>
                </div>

                {(resumeData.education || []).map((edu, index) => (
                  <div key={edu.id || index} className="p-4 bg-[#F7F9FB] border border-[#E3E8EE] rounded-2xl space-y-3 relative">
                    <button
                      onClick={() => removeEducation(index)}
                      className="absolute top-3 right-3 text-[#5B6B7F] hover:text-rose-600 p-1"
                      title="Remove Education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <label className="text-[#5B6B7F] block mb-1 font-semibold">Degree / Field</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                        className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[#5B6B7F] block mb-1 font-semibold">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                          className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                        />
                      </div>
                      <div>
                        <label className="text-[#5B6B7F] block mb-1 font-semibold">Period</label>
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => handleEducationChange(index, "period", e.target.value)}
                          className="w-full bg-white border border-[#E3E8EE] rounded-lg p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[#0F1B2D]">Skills</h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="skill-input"
                    placeholder="e.g. React, UI Design"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        addSkill((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                    className="flex-1 bg-[#F7F9FB] border border-[#E3E8EE] rounded-xl p-2 text-[#0F1B2D] outline-none focus:border-[#0E7C7B]"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("skill-input") as HTMLInputElement;
                      if (el) {
                        addSkill(el.value);
                        el.value = "";
                      }
                    }}
                    className="bg-[#0E7C7B] text-white font-semibold px-4 py-2 rounded-xl text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {resumeData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-[#E3F4F3] text-[#0E7C7B] border border-[#0E7C7B]/30 px-3 py-1 rounded-xl font-semibold flex items-center space-x-2"
                    >
                      <span>{skill}</span>
                      <button onClick={() => removeSkill(index)} className="hover:text-rose-600">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview Canvas Area */}
        <div className="flex-1 bg-[#F7F9FB] p-6 md:p-10 overflow-y-auto flex items-start justify-center">
          <div
            className="transition-transform duration-200 origin-top shadow-xl rounded-md bg-white"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {renderSelectedTemplate()}
          </div>
        </div>
      </div>
    </div>
  );
}