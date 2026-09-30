"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  Download,
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
  Target,
  Camera,
  Upload as UploadIcon,
} from "lucide-react";

import TemplateOne, { ElementStyle } from "../../../components/templates/TemplateOne";
import TemplateTwo from "../../../components/templates/TemplateTwo";
import TemplateThree from "../../../components/templates/TemplateThree";
import TemplateFour from "../../../components/templates/TemplateFour";
import TemplateFive from "../../../components/templates/TemplateFive";
import TemplateSix from "../../../components/templates/TemplateSix";
import type { ResumeData } from "../../../components/templates/TemplateOne";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { LoadingState } from "../../../components/common/LoadingState";
import { toast } from "../../../components/feedback/Toast";
import { Button } from "../../../components/ui/Button";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { resumeApi } from "../../../modules/resume/api";
import { profileToResumeData } from "../../../modules/resume/profileSnapshot";
import { profileApi } from "../../../modules/profile/api";
import type { ProfileResponse } from "../../../modules/profile/types";

type SaveStatus = "idle" | "dirty" | "saving" | "success" | "error";

const initialResumeData: ResumeData = {
  fullName: "",
  jobTitle: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  primaryColor: "#0E7C7B",
  fontFamily: "Inter, sans-serif",
  skills: [],
  languages: [],
  experience: [],
  education: [],
};

// Color Columns with 8 Hues and 7 Shade Rows (Light Tints to Dark Shades)
const colorShadesColumns = [
  {
    hue: "Grayscale",
    shades: ["#000000", "#111827", "#1f2937", "#374151", "#4b5563", "#6b7280", "#9ca3af", "#d1d5db", "#f3f4f6"],
  },
  {
    hue: "Teal (Theme)",
    shades: ["#042f2e", "#0a6463", "#0e7c7b", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#ccfbf1", "#e3f4f3"],
  },
  {
    hue: "Blue",
    shades: ["#1e3a8a", "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"],
  },
  {
    hue: "Indigo",
    shades: ["#312e81", "#3730a3", "#4338ca", "#4f46e5", "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"],
  },
  {
    hue: "Purple",
    shades: ["#4c1d95", "#5b21b6", "#6d28d9", "#7c3aed", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#f3e8ff"],
  },
  {
    hue: "Emerald",
    shades: ["#064e3b", "#065f46", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"],
  },
  {
    hue: "Red / Rose",
    shades: ["#881337", "#9f1239", "#be123c", "#e11d48", "#f43f5e", "#fb7185", "#fca5a5", "#fecdd3", "#ffe4e6"],
  },
  {
    hue: "Amber / Gold",
    shades: ["#78350f", "#92400e", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#fde68a", "#fef3c7", "#fffbeb"],
  },
];

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTemplateId, setActiveTemplateId] = useState<string>((params.templateId as string) || "1");
  const [resumeTitle, setResumeTitle] = useState<string>("My Resume Document");
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "education" | "skills">("personal");
  const [saveNotice, setSaveNotice] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "saving" | "downloading" | "error">("idle");
  const [loadingResume, setLoadingResume] = useState<boolean>(Boolean(searchParams.get("resumeId")));
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileResponse | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);

  // SELECTIVE CANVAS EDITING STATE
  const [selectedElementId, setSelectedElementId] = useState<string | null>("fullName");
  const [elementStyles, setElementStyles] = useState<Record<string, ElementStyle>>({
    fullName: { isBold: true, color: "#0E7C7B" },
    jobTitle: { isBold: true },
  });

  // Color Popover state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customHex, setCustomHex] = useState<string>("#0E7C7B");
  const [showCustomHexInput, setShowCustomHexInput] = useState<boolean>(false);

  // Load existing saved resume on mount
  useEffect(() => {
    const resumeIdParam = searchParams.get("resumeId");
    if (resumeIdParam) {
      setLoadingResume(true);
      resumeApi
        .get(resumeIdParam)
        .then((found) => {
          if (!found.editable) {
            router.push(`/resumes/${resumeIdParam}`);
            return;
          }
          setEditingResumeId(found.id);
          setResumeTitle(found.title);
          setActiveTemplateId(found.template_id || "1");
          if (found.resume_data) setResumeData(found.resume_data as ResumeData);
          setSaveStatus("idle");
        })
        .catch(() => {
          setSaveNotice("Unable to load resume.");
          setSaveStatus("error");
          setTimeout(() => setSaveNotice(""), 3500);
        })
        .finally(() => {
          setLoadingResume(false);
        });
      return;
    }

    setResumeData(initialResumeData);
    setSaveStatus("dirty");
    setLoadingResume(false);
  }, [searchParams]);

  useEffect(() => {
    if (saveStatus !== "dirty" && saveStatus !== "error") return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [saveStatus]);

  useEffect(() => {
    if (searchParams.get("resumeId")) {
      return;
    }
    profileApi
      .getProfile()
      .then((profile) => {
        setProfileSuggestions(profile);
        const profileData = profileToResumeData(profile);
        setResumeData((prev) => ({
          ...prev,
          ...profileData,
          fullName: profileData.fullName || prev.fullName,
          email: profileData.email || prev.email,
          phone: profileData.phone || prev.phone,
          location: profileData.location || prev.location,
          avatarUrl: profileData.avatarUrl || prev.avatarUrl,
          skills: profileData.skills?.length ? profileData.skills : prev.skills,
          experience: profileData.experience?.length ? profileData.experience : prev.experience,
          education: profileData.education?.length ? profileData.education : prev.education,
        }));
      })
      .catch(() => null);
  }, [searchParams]);

  const markDirty = () => {
    setSaveStatus((current) => (current === "saving" ? current : "dirty"));
  };

  const handleFieldChange = <K extends keyof ResumeData>(field: K, value: ResumeData[K]) => {
    markDirty();
    setResumeData((prev) => ({ ...prev, [field]: value }));
  };

  const applyStyleToSelected = <K extends keyof ElementStyle>(key: K, value: ElementStyle[K]) => {
    if (!selectedElementId) {
      // Global fallback
      setResumeData((prev) => ({ ...prev, [key]: value }));
      markDirty();
      return;
    }

    setElementStyles((prev) => {
      const current = prev[selectedElementId] || {};
      const newValue = typeof value === "boolean" && current[key] === value ? false : value;
      return {
        ...prev,
        [selectedElementId]: {
          ...current,
          [key]: newValue,
        },
      };
    });
    markDirty();
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
      markDirty();
      setResumeData((prev) => ({ ...prev, experience: updated }));
    }
  };

  const addExperience = () => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: `exp-${Date.now()}`,
          role: "",
          company: "",
          period: "",
          details: "",
        },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    markDirty();
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
      markDirty();
      setResumeData((prev) => ({ ...prev, education: updated }));
    }
  };

  const addEducation = () => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id: `edu-${Date.now()}`,
          degree: "",
          institution: "",
          period: "",
        },
      ],
    }));
  };

  const removeEducation = (index: number) => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index),
    }));
  };

  const addSkill = (skillText: string) => {
    if (!skillText.trim()) return;
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      skills: [...prev.skills, skillText.trim()],
    }));
  };

  const removeSkill = (index: number) => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const applyProfilePersonal = () => {
    if (!profileSuggestions) return;
    const profileData = profileToResumeData(profileSuggestions);
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      fullName: profileData.fullName || prev.fullName,
      email: profileData.email || prev.email,
      phone: profileData.phone || prev.phone,
      location: profileData.location || prev.location,
      avatarUrl: profileData.avatarUrl || prev.avatarUrl,
    }));
  };

  const addProfileExperience = (item: ProfileResponse["experience"][number]) => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: item.id,
          role: item.job_title,
          company: item.company_name || item.institute_name || "",
          period: `${item.start_date || ""}${item.end_date ? ` - ${item.end_date}` : item.is_current ? " - Present" : ""}`,
          details: item.description || "",
        },
      ],
    }));
  };

  const addProfileEducation = (item: ProfileResponse["education"][number]) => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id: item.id,
          degree: item.degree || item.field_of_study || "",
          institution: item.institute_name,
          period: `${item.start_date || ""}${item.end_date ? ` - ${item.end_date}` : ""}`,
          grade: item.grade || undefined,
        },
      ],
    }));
  };

  const addProfileSkill = (name: string) => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.includes(name) ? prev.skills : [...prev.skills, name],
    }));
  };

  const handleSaveResume = async () => {
    if (!resumeTitle.trim() || saveStatus === "saving") return;
    setSaveStatus("saving");
    setSaveNotice("");
    try {
      const saved = editingResumeId
        ? await resumeApi.update(editingResumeId, {
            title: resumeTitle,
            template_id: activeTemplateId,
            resume_data: resumeData,
          })
        : await resumeApi.createTemplate({
            title: resumeTitle,
            template_id: activeTemplateId,
            resume_data: resumeData,
          });

      setEditingResumeId(saved.id);
      if (saved.resume_data) setResumeData(saved.resume_data as ResumeData);
      setSaveStatus("success");
      setSaveNotice("Saved ✓");
      toast.success("Your latest changes are saved.");
      router.replace(`/editor/${saved.template_id || activeTemplateId}?resumeId=${saved.id}`);
    } catch {
      setSaveStatus("error");
      setSaveNotice("Save failed");
      toast.error("Your changes are still in the editor. Please try saving again.", "Save failed");
    } finally {
      setTimeout(() => {
        setSaveNotice("");
        setSaveStatus((current) => (current === "success" ? "idle" : current));
      }, 3500);
    }
  };

  // ISOLATED DOWNLOAD PDF / PRINT FUNCTION
  const handleDownloadPDF = async () => {
    if (!resumeTitle.trim() || downloadStatus !== "idle") return;
    const downloadWindow = window.open("", "_blank");
    setDownloadStatus("saving");
    setSaveNotice("");
    try {
      const saved = editingResumeId
        ? await resumeApi.update(editingResumeId, {
            title: resumeTitle,
            template_id: activeTemplateId,
            resume_data: resumeData,
          })
        : await resumeApi.createTemplate({
            title: resumeTitle,
            template_id: activeTemplateId,
            resume_data: resumeData,
          });
      setEditingResumeId(saved.id);
      if (saved.resume_data) setResumeData(saved.resume_data as ResumeData);
      setSaveStatus("success");
      setDownloadStatus("downloading");
      const withPdf = await resumeApi.generatePdf(saved.id);
      if (downloadWindow) {
        downloadWindow.opener = null;
        downloadWindow.location.href = withPdf.download_url;
      } else {
        window.open(withPdf.download_url, "_blank", "noopener,noreferrer");
      }
      toast.success("Your PDF is ready.");
    } catch {
      downloadWindow?.close();
      setDownloadStatus("error");
      setSaveStatus("error");
      setSaveNotice("Download failed");
      toast.error("We could not generate the PDF. Your editor changes are still available.", "Download failed");
      setTimeout(() => setSaveNotice(""), 3500);
    } finally {
      setTimeout(() => {
        setDownloadStatus("idle");
        setSaveStatus((current) => (current === "success" ? "idle" : current));
      }, 1200);
    }
  };

  const selectShadeColor = (color: string) => {
    if (selectedElementId) {
      applyStyleToSelected("color", color);
    } else {
      handleFieldChange("primaryColor", color);
    }
    setCustomHex(color);
    setShowColorPicker(false);
  };

  // Helper getters for toolbar button active states based on current selection
  const currentSelectedStyle = selectedElementId ? elementStyles[selectedElementId] || {} : {};
  const activeIsBold = currentSelectedStyle.isBold !== undefined ? currentSelectedStyle.isBold : !!resumeData.isBold;
  const activeIsItalic = currentSelectedStyle.isItalic !== undefined ? currentSelectedStyle.isItalic : !!resumeData.isItalic;
  const activeIsUnderline = currentSelectedStyle.isUnderline !== undefined ? currentSelectedStyle.isUnderline : !!resumeData.isUnderline;
  const activeAlign = currentSelectedStyle.align || resumeData.textAlign || "left";
  const activeColor = currentSelectedStyle.color || resumeData.primaryColor || "#0E7C7B";

  const handlePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      handleFieldChange("avatarUrl", url);
    };
    reader.readAsDataURL(file);
  };

  const requestLeave = () => {
    if (saveStatus === "dirty" || saveStatus === "error") {
      setLeaveOpen(true);
      return;
    }
    router.push("/dashboard");
  };

  const renderSelectedTemplate = () => {
    const props = {
      data: resumeData,
      selectedElementId,
      onSelectElement: (id: string) => setSelectedElementId(id),
      elementStyles,
      onPhotoUpload: handlePhotoUpload,
    };

    switch (activeTemplateId) {
      case "1":
        return <TemplateOne {...props} />;
      case "2":
        return <TemplateTwo {...props} />;
      case "3":
        return <TemplateThree {...props} />;
      case "4":
        return <TemplateFour {...props} />;
      case "5":
        return <TemplateFive {...props} />;
      case "6":
        return <TemplateSix {...props} />;
      default:
        return <TemplateOne {...props} />;
    }
  };

  const saveLabel =
    saveStatus === "saving" ? "Saving..." : saveStatus === "success" ? "Saved ✓" : "Save";
  const statusLabel =
    saveStatus === "dirty"
      ? "Unsaved changes"
      : saveStatus === "saving"
        ? "Saving..."
        : saveStatus === "success"
          ? "Saved ✓"
          : saveStatus === "error"
            ? "Save failed"
            : "Saved";

  if (loadingResume) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6 font-sans text-[var(--text)]">
        <LoadingState label="Loading resume..." cards={2} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col font-sans text-[var(--text)]">
      {/* 1. Editor Navbar Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2 flex flex-col md:flex-row items-center justify-between gap-3 sticky top-0 z-40 shadow-xs no-print">
        <div className="flex min-w-0 items-center space-x-3">
          <button
            onClick={requestLeave}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-tint)] transition"
            title="Back to Dashboard"
            aria-label="Back to dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex min-w-0 items-center space-x-2">
            <FileText className="w-5 h-5 text-[var(--primary)]" />
            <input
              value={resumeTitle}
              onChange={(event) => {
                setResumeTitle(event.target.value);
                markDirty();
              }}
              aria-label="Resume title"
              maxLength={255}
              className="min-w-0 max-w-56 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-2.5 py-1 text-sm font-bold text-[var(--text)] outline-none focus:border-[var(--primary)]"
            />
          </div>

          <span className="hidden md:flex items-center text-xs text-[var(--primary)] font-semibold bg-[var(--primary-tint)] px-2.5 py-0.5 rounded-full border border-[var(--primary)]/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {statusLabel}
          </span>
        </div>

        {/* Center: Template Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[var(--text-muted)] font-semibold hidden sm:inline">Template:</span>
          <select
            value={activeTemplateId}
            onChange={(e) => {
              setActiveTemplateId(e.target.value);
              markDirty();
            }}
            className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer focus:border-[var(--primary)]"
          >
            <option value="1">Template #1: Slate Tech Modern (Photo)</option>
            <option value="2">Template #2: Creative Emerald Avatar</option>
            <option value="3">Template #3: Minimalist Classic Executive</option>
            <option value="4">Template #4: Executive Corporate Navy</option>
            <option value="5">Template #5: Modern Executive Headshot (Photo-First)</option>
            <option value="6">Template #6: Creative Studio Avatar (Photo-First)</option>
          </select>
        </div>

        {/* Right Side: Save & Isolated PDF Download */}
        <div className="flex items-center space-x-2">
          {saveNotice && (
            <span className="text-xs font-bold text-[var(--primary)]">{saveNotice}</span>
          )}

          <ThemeToggle />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => void handleSaveResume()}
            disabled={saveStatus === "saving" || downloadStatus === "saving"}
            loading={saveStatus === "saving"}
            loadingLabel="Saving..."
          >
            {saveStatus === "success" ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveLabel}</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => void handleDownloadPDF()}
            disabled={saveStatus === "saving" || downloadStatus !== "idle"}
            loading={downloadStatus !== "idle"}
            loadingLabel={downloadStatus === "saving" ? "Saving..." : "Opening..."}
            title="Download isolated resume content as PDF"
          >
            <Download className="w-4 h-4" />
            <span>{downloadStatus === "saving" ? "Saving..." : downloadStatus === "downloading" ? "Opening..." : "Download PDF"}</span>
          </Button>
        </div>
      </header>

      {/* 2. Formatting Toolbar with Text Color Shades Dropdown (Row 2) */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2 flex items-center flex-wrap gap-3 overflow-x-auto text-xs text-[var(--text)] relative z-30 shadow-xs no-print">
        {/* Active Selection Indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl font-bold">
          <Target className="w-3.5 h-3.5" />
          <span>
            Selected: <strong className="capitalize">{selectedElementId || "Entire Canvas"}</strong>
          </span>
        </div>

        {/* Zoom selector */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[var(--border)]">
          <button
            onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
            className="p-1.5 hover:bg-[var(--primary-tint)] rounded text-[var(--text-muted)] hover:text-[var(--primary)]"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-semibold text-[var(--text)] px-1">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
            className="p-1.5 hover:bg-[var(--primary-tint)] rounded text-[var(--text-muted)] hover:text-[var(--primary)]"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Font Family selector */}
        <div className="flex items-center space-x-2 pr-3 border-r border-[var(--border)]">
          <Type className="w-4 h-4 text-[var(--text-muted)]" />
          <select
            value={resumeData.fontFamily || "Inter, sans-serif"}
            onChange={(e) => handleFieldChange("fontFamily", e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold px-2 py-1 rounded-lg outline-none cursor-pointer"
          >
            <option value="Inter, sans-serif">Inter (Sans-Serif)</option>
            <option value="Georgia, serif">Georgia (Serif)</option>
            <option value="Bricolage Grotesque, sans-serif">Bricolage (Modern)</option>
            <option value="Courier New, monospace">Courier (Monospace)</option>
          </select>
        </div>

        {/* TEXT COLOR PICKER & SHADES DROPDOWN IN CANVAS */}
        <div className="relative pr-3 border-r border-[var(--border)]">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center space-x-2 bg-[var(--bg)] hover:bg-[var(--primary-tint)] border border-[var(--border)] px-3 py-1 rounded-lg font-semibold transition"
            title="Text Color & Shades Dropdown"
          >
            <Palette className="w-4 h-4 text-[var(--primary)]" />
            <span>Text Color</span>
            <div
              className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
              style={{ backgroundColor: activeColor }}
            />
          </button>

          {/* Color Shades Dropdown Grid */}
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-2 bg-[var(--surface)] border border-[var(--border)] shadow-2xl rounded-2xl p-4 w-80 z-50 animate-fadeIn space-y-3">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-[var(--primary)]" />
                  <span className="font-bold text-xs text-[var(--text)]">
                    Color Shades Grid ({selectedElementId ? "Selected Element" : "Theme"})
                  </span>
                </div>
                <button onClick={() => setShowColorPicker(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Color Columns & Shade Rows Grid */}
              <div className="grid grid-cols-8 gap-1.5">
                {colorShadesColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex flex-col gap-1.5" title={col.hue}>
                    {col.shades.map((shade, rowIdx) => (
                      <button
                        key={rowIdx}
                        onClick={() => selectShadeColor(shade)}
                        className={`w-6 h-6 rounded-md border border-black/10 transition transform hover:scale-125 flex items-center justify-center ${
                          activeColor === shade ? "ring-2 ring-[var(--primary)] ring-offset-1" : ""
                        }`}
                        style={{ backgroundColor: shade }}
                        title={`${col.hue} Shade: ${shade}`}
                      >
                        {activeColor === shade && (
                          <Check className={`w-3 h-3 ${rowIdx > 3 ? "text-white" : "text-black"}`} />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Custom Color Hex Input */}
              <div className="pt-2 border-t border-[var(--border)]">
                {!showCustomHexInput ? (
                  <button
                    onClick={() => setShowCustomHexInput(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-[var(--bg)] hover:bg-[var(--primary-tint)] border border-[var(--border)] py-2 rounded-xl text-xs font-bold text-[var(--primary)] transition"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Custom Color (Hex Code)</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <PenTool className="w-4 h-4 text-[var(--primary)]" />
                    <input
                      type="text"
                      value={customHex}
                      onChange={(e) => setCustomHex(e.target.value)}
                      placeholder="#0E7C7B"
                      className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-1.5 font-mono text-xs text-[var(--text)] outline-none"
                    />
                    <button
                      onClick={() => selectShadeColor(customHex)}
                      className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text Formatting Toolbar: Bold, Italic, Underline (Selective Mode) */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[var(--border)]">
          <button
            onClick={() => applyStyleToSelected("isBold", !activeIsBold)}
            className={`p-1.5 rounded font-bold transition ${
              activeIsBold
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "hover:bg-[var(--primary-tint)] text-[var(--text-muted)]"
            }`}
            title="Toggle Bold for Selected Element"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => applyStyleToSelected("isItalic", !activeIsItalic)}
            className={`p-1.5 rounded italic transition ${
              activeIsItalic
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "hover:bg-[var(--primary-tint)] text-[var(--text-muted)]"
            }`}
            title="Toggle Italic for Selected Element"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => applyStyleToSelected("isUnderline", !activeIsUnderline)}
            className={`p-1.5 rounded underline transition ${
              activeIsUnderline
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "hover:bg-[var(--primary-tint)] text-[var(--text-muted)]"
            }`}
            title="Toggle Underline for Selected Element"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Alignment (Selective Mode) */}
        <div className="flex items-center space-x-1 pr-3 border-r border-[var(--border)]">
          <button
            onClick={() => applyStyleToSelected("align", "left")}
            className={`p-1.5 rounded transition ${
              activeAlign === "left"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "hover:bg-[var(--primary-tint)] text-[var(--text-muted)]"
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyStyleToSelected("align", "center")}
            className={`p-1.5 rounded transition ${
              activeAlign === "center"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "hover:bg-[var(--primary-tint)] text-[var(--text-muted)]"
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => applyStyleToSelected("align", "right")}
            className={`p-1.5 rounded transition ${
              activeAlign === "right"
                ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                : "hover:bg-[var(--primary-tint)] text-[var(--text-muted)]"
            }`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Adders */}
        <div className="flex items-center space-x-2">
          <button
            onClick={addExperience}
            className="bg-[var(--primary-tint)] hover:bg-[var(--border)] text-[var(--primary)] px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition border border-[var(--primary)]/30"
          >
            <Plus className="w-3 h-3" />
            <span>+ Job</span>
          </button>
          <button
            onClick={addEducation}
            className="bg-[var(--primary-tint)] hover:bg-[var(--border)] text-[var(--primary)] px-3 py-1 rounded-lg font-bold text-xs flex items-center space-x-1 transition border border-[var(--primary)]/30"
          >
            <Plus className="w-3 h-3" />
            <span>+ School</span>
          </button>
        </div>
      </div>

      {/* 3. Main Split Layout: Form Drawer Left + Live Canvas Right */}
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Form Sidebar Drawer */}
        <div className="flex max-h-[58vh] w-full flex-shrink-0 flex-col border-b border-[var(--border)] bg-[var(--surface)] lg:max-h-none lg:w-[420px] lg:border-b-0 lg:border-r no-print">
          {/* Section Tabs */}
          <div className="flex border-b border-[var(--border)] bg-[var(--bg)] p-2 gap-1">
            <button
              onClick={() => setActiveTab("personal")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "personal" ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)]"
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Personal</span>
            </button>

            <button
              onClick={() => setActiveTab("experience")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "experience" ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)]"
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Jobs ({resumeData.experience?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("education")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "education" ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)]"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>School</span>
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "skills" ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)]"
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Skills</span>
            </button>
          </div>

          {profileSuggestions && (
            <div className="border-b border-[var(--border)] bg-[var(--surface)] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-[var(--text)]">Profile suggestions</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Select saved profile details to add.</p>
                </div>
                <button
                  type="button"
                  onClick={applyProfilePersonal}
                  className="rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--on-primary)]"
                >
                  Fill personal
                </button>
              </div>

              <div className="space-y-2">
                {profileSuggestions.experience.slice(0, 2).map((item) => (
                  <button
                    key={`profile-exp-${item.id}`}
                    type="button"
                    onClick={() => addProfileExperience(item)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-[11px] hover:border-[var(--primary)]"
                  >
                    <span className="block font-bold text-[var(--text)]">{item.job_title}</span>
                    <span className="text-[var(--text-muted)]">{item.company_name || item.institute_name}</span>
                  </button>
                ))}
                {profileSuggestions.education.slice(0, 2).map((item) => (
                  <button
                    key={`profile-edu-${item.id}`}
                    type="button"
                    onClick={() => addProfileEducation(item)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-left text-[11px] hover:border-[var(--primary)]"
                  >
                    <span className="block font-bold text-[var(--text)]">{item.institute_name}</span>
                    <span className="text-[var(--text-muted)]">{item.degree || item.field_of_study}</span>
                  </button>
                ))}
                {profileSuggestions.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {profileSuggestions.skills.slice(0, 8).map((skill) => (
                      <button
                        key={`profile-skill-${skill.id}`}
                        type="button"
                        onClick={() => addProfileSkill(skill.name)}
                        className="rounded-full bg-[var(--primary-tint)] px-2 py-1 text-[10px] font-bold text-[var(--primary)]"
                      >
                        + {skill.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Form Inputs */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs">
            {activeTab === "personal" && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[var(--text)]">Personal Information</h3>

                {/* Candidate Photo Upload Input Box */}
                <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-2">
                  <label className="text-[var(--text-muted)] block font-semibold">Candidate Headshot Photo</label>
                  <div className="flex items-center space-x-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--primary)] bg-[var(--surface)] flex items-center justify-center shadow-xs flex-shrink-0">
                      {resumeData.avatarUrl ? (
                        <img src={resumeData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-[var(--text-muted)]" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition inline-flex items-center space-x-1.5 shadow-xs">
                        <UploadIcon className="w-3.5 h-3.5" />
                        <span>Browse Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                        />
                      </label>
                      {resumeData.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => handleFieldChange("avatarUrl", "")}
                          className="text-[10px] text-rose-600 hover:underline font-semibold text-left"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[var(--text-muted)] block mb-1 font-semibold">Full Name</label>
                    <input
                      type="text"
                      value={resumeData.fullName}
                      onFocus={() => setSelectedElementId("fullName")}
                      onChange={(e) => handleFieldChange("fullName", e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--text-muted)] block mb-1 font-semibold font-sans">Job Title / Headline</label>
                    <input
                      type="text"
                      value={resumeData.jobTitle}
                      onFocus={() => setSelectedElementId("jobTitle")}
                      onChange={(e) => handleFieldChange("jobTitle", e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-semibold">Email</label>
                      <input
                        type="email"
                        value={resumeData.email}
                        onFocus={() => setSelectedElementId("contact-email")}
                        onChange={(e) => handleFieldChange("email", e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-semibold">Phone</label>
                      <input
                        type="text"
                        value={resumeData.phone}
                        onFocus={() => setSelectedElementId("contact-phone")}
                        onChange={(e) => handleFieldChange("phone", e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[var(--text-muted)] block mb-1 font-semibold">Location</label>
                    <input
                      type="text"
                      value={resumeData.location}
                      onFocus={() => setSelectedElementId("contact-location")}
                      onChange={(e) => handleFieldChange("location", e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div>
                    <label className="text-[var(--text-muted)] block mb-1 font-semibold">Professional Summary</label>
                    <textarea
                      rows={4}
                      value={resumeData.summary}
                      onFocus={() => setSelectedElementId("summary")}
                      onChange={(e) => handleFieldChange("summary", e.target.value)}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "experience" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-[var(--text)]">Work History</h3>
                  <button
                    onClick={addExperience}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Job</span>
                  </button>
                </div>

                {resumeData.experience.map((exp, index) => (
                  <div key={exp.id || index} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-3 relative">
                    <button
                      onClick={() => removeExperience(index)}
                      className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-rose-600 p-1"
                      title="Remove Job"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-semibold">Job Title</label>
                      <input
                        type="text"
                        value={exp.role}
                        onFocus={() => setSelectedElementId(`exp-${index}-role`)}
                        onChange={(e) => handleExperienceChange(index, "role", e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[var(--text-muted)] block mb-1 font-semibold">Company</label>
                        <input
                          type="text"
                          value={exp.company}
                          onFocus={() => setSelectedElementId(`exp-${index}-company`)}
                          onChange={(e) => handleExperienceChange(index, "company", e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--text-muted)] block mb-1 font-semibold">Dates</label>
                        <input
                          type="text"
                          value={exp.period}
                          onChange={(e) => handleExperienceChange(index, "period", e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-semibold">Details</label>
                      <textarea
                        rows={3}
                        value={exp.details}
                        onFocus={() => setSelectedElementId(`exp-${index}-details`)}
                        onChange={(e) => handleExperienceChange(index, "details", e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "education" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-extrabold text-sm text-[var(--text)]">Education History</h3>
                  <button
                    onClick={addEducation}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add School</span>
                  </button>
                </div>

                {(resumeData.education || []).map((edu, index) => (
                  <div key={edu.id || index} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-3 relative">
                    <button
                      onClick={() => removeEducation(index)}
                      className="absolute top-3 right-3 text-[var(--text-muted)] hover:text-rose-600 p-1"
                      title="Remove Education"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-semibold">Degree / Field</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onFocus={() => setSelectedElementId(`edu-${index}-degree`)}
                        onChange={(e) => handleEducationChange(index, "degree", e.target.value)}
                        className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[var(--text-muted)] block mb-1 font-semibold">Institution</label>
                        <input
                          type="text"
                          value={edu.institution}
                          onFocus={() => setSelectedElementId(`edu-${index}-inst`)}
                          onChange={(e) => handleEducationChange(index, "institution", e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-[var(--text-muted)] block mb-1 font-semibold">Period</label>
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => handleEducationChange(index, "period", e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "skills" && (
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[var(--text)]">Skills</h3>

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
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("skill-input") as HTMLInputElement;
                      if (el) {
                        addSkill(el.value);
                        el.value = "";
                      }
                    }}
                    className="bg-[var(--primary)] text-[var(--on-primary)] font-semibold px-4 py-2 rounded-xl text-xs"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {resumeData.skills.map((skill, index) => (
                    <span
                      key={index}
                      onClick={() => setSelectedElementId(`skill-${index}`)}
                      className={`px-3 py-1 rounded-xl font-semibold flex items-center space-x-2 cursor-pointer transition ${
                        selectedElementId === `skill-${index}`
                          ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                          : "bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/30"
                      }`}
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

        {/* Right Live Preview Canvas Area (Isolatable for PDF Download) */}
        <div className="flex min-h-[42rem] flex-1 items-start justify-center overflow-auto bg-[var(--bg)] p-4 sm:p-6 md:p-10">
          <div
            id="resume-canvas-container"
            className="transition-transform duration-200 origin-top shadow-xl rounded-md bg-white"
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {renderSelectedTemplate()}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={leaveOpen}
        title="Leave with unsaved changes?"
        description="Changes that have not been saved to your account will be lost."
        onClose={() => setLeaveOpen(false)}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setLeaveOpen(false)}>Keep editing</Button>
          <Button variant="danger" onClick={() => router.push("/dashboard")}>Discard and leave</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}
