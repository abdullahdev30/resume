"use client";

import { useState, useEffect, useRef, type DragEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  Printer,
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
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Sparkles,
  Undo2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { ElementStyle } from "../../../components/templates/TemplateOne";
import type { ResumeData } from "../../../components/templates/TemplateOne";
import { ResumeDocument } from "../../../components/templates/ResumeDocument";
import { ResumePrintRoot } from "../../../components/templates/ResumePrintRoot";
import { ResumePreview } from "../../../components/templates/ResumePreview";
import { templateCatalog } from "../../../components/templates/catalog";
import { getEditableResumeText, updateEditableResumeText } from "../../../components/templates/editableResumeText";
import { paginateResumeData, removeResumePage } from "../../../components/templates/pagination";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { LoadingState } from "../../../components/common/LoadingState";
import { ErrorState } from "../../../components/common/ErrorState";
import { Alert } from "../../../components/feedback/Alert";
import { toast } from "../../../components/feedback/Toast";
import { Button } from "../../../components/ui/Button";
import { PhoneInput } from "../../../components/ui/PhoneInput";
import { ThemeToggle } from "../../../components/ui/ThemeToggle";
import { ValidatedInput } from "../../../components/ui/ValidatedInput";
import { ValidatedUrlInput } from "../../../components/ui/ValidatedUrlInput";
import { resumeApi } from "../../../modules/resume/api";
import { useGuestResumes } from "../../../modules/resume/GuestResumeProvider";
import { profileToResumeData } from "../../../modules/resume/profileSnapshot";
import { profileApi } from "../../../modules/profile/api";
import type { ProfileResponse } from "../../../modules/profile/types";
import { ApiClientError } from "../../../lib/api-client";
import { createCertificate } from "../../../modules/certificates/api";
import { createEducation } from "../../../modules/education/api";
import { createExperience } from "../../../modules/experience/api";
import { createProject } from "../../../modules/projects/api";
import { createSkill } from "../../../modules/skills/api";
import { createSocialLink } from "../../../modules/social-links/api";
import { ProfileSectionPicker } from "../../../modules/resume/components/ProfileSectionPicker";
import type { AIEditProposal } from "../../../modules/resume/types";
import { downloadResumePdf } from "../../../modules/resume/downloadResumePdf";
import { analyzePhoneNumber } from "../../../lib/phone";
import {
  normalizeEmail,
  normalizePlainText,
  normalizeUrl,
  validateDate,
  validateDatePeriod,
  validateEndDate,
  validateEmail,
  validateFile,
  validateName,
  validateUrl,
} from "../../../lib/validation";

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
  socialLinks: [],
  projects: [],
  certificates: [],
  elementStyles: {
    fullName: { isBold: true, color: "#0E7C7B", fontSize: 24 },
    jobTitle: { isBold: true, fontSize: 12 },
  },
  pageSize: "A4",
  pageMargin: 10,
  lineSpacing: 1.15,
};

type EditorTab = "personal" | "experience" | "education" | "skills" | "more" | "ai";

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
  {
    hue: "Orange",
    shades: ["#7c2d12", "#9a3412", "#c2410c", "#ea580c", "#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"],
  },
  {
    hue: "Yellow",
    shades: ["#713f12", "#854d0e", "#a16207", "#ca8a04", "#eab308", "#facc15", "#fde047", "#fef08a", "#fef9c3"],
  },
  {
    hue: "Pink",
    shades: ["#831843", "#9d174d", "#be185d", "#db2777", "#ec4899", "#f472b6", "#f9a8d4", "#fbcfe8", "#fce7f3"],
  },
];

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    createResume: createGuestResume,
    getResume: getGuestResume,
    updateResume: updateGuestResume,
  } = useGuestResumes();
  const isGuest = searchParams.get("guest") === "1";
  const resumeIdParam = searchParams.get("resumeId");
  const templateIdParam = (params.templateId as string) || "1";
  const guestTemplateData = isGuest
    ? templateCatalog.find((template) => template.id === templateIdParam)?.data
    : null;
  const editorStartingData: ResumeData = guestTemplateData
    ? { ...initialResumeData, ...structuredClone(guestTemplateData) }
    : { ...initialResumeData };

  const [activeTemplateId, setActiveTemplateId] = useState<string>(templateIdParam);
  const [resumeTitle, setResumeTitle] = useState<string>("My Resume Document");
  const [resumeData, setResumeData] = useState<ResumeData>(editorStartingData);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<EditorTab>("personal");
  const [editorPanelOpen, setEditorPanelOpen] = useState(true);
  const [saveNotice, setSaveNotice] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveInFlight, setSaveInFlight] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "preparing">("idle");
  const [loadingResume, setLoadingResume] = useState<boolean>(Boolean(resumeIdParam));
  const [editingResumeId, setEditingResumeId] = useState<string | null>(null);
  const [sourceVersion, setSourceVersion] = useState<number | null>(null);
  const [profileSuggestions, setProfileSuggestions] = useState<ProfileResponse | null>(null);
  const [profileLoadError, setProfileLoadError] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [deletePageIndex, setDeletePageIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiJobDescription, setAiJobDescription] = useState("");
  const [aiReferenceLinks, setAiReferenceLinks] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiProposal, setAiProposal] = useState<AIEditProposal | null>(null);
  const [aiUndoData, setAiUndoData] = useState<ResumeData | null>(null);
  const [newProject, setNewProject] = useState({ name: "", description: "", url: "", technologies: "" });
  const [newCertificate, setNewCertificate] = useState({ title: "", issuer: "", date: "", url: "" });
  const [newSocialLink, setNewSocialLink] = useState({ platform: "", url: "" });
  const [newLanguage, setNewLanguage] = useState("");
  const revisionRef = useRef(0);
  const saveInFlightRef = useRef(false);
  const saveResumeRef = useRef<() => Promise<void>>(async () => undefined);

  // SELECTIVE CANVAS EDITING STATE
  const [selectedElementId, setSelectedElementId] = useState<string | null>("fullName");
  const [elementStyles, setElementStyles] = useState<Record<string, ElementStyle>>(
    editorStartingData.elementStyles || {},
  );

  // Color Popover state
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [customHex, setCustomHex] = useState<string>("#0E7C7B");
  const [showCustomHexInput, setShowCustomHexInput] = useState<boolean>(false);
  const [colorPickerPosition, setColorPickerPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const colorPickerTriggerRef = useRef<HTMLButtonElement>(null);
  const colorPickerPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showColorPicker) return;

    const updatePosition = () => {
      const trigger = colorPickerTriggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportPadding = 12;
      const gap = 8;
      const width = Math.min(352, window.innerWidth - viewportPadding * 2);
      const left = Math.min(
        Math.max(viewportPadding, rect.left + rect.width / 2 - width / 2),
        window.innerWidth - width - viewportPadding,
      );
      const spaceBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
      const spaceAbove = rect.top - gap - viewportPadding;
      const openAbove = spaceBelow < 280 && spaceAbove > spaceBelow;
      const maxHeight = Math.max(180, openAbove ? spaceAbove : spaceBelow);
      const top = openAbove
        ? Math.max(viewportPadding, rect.top - Math.min(390, maxHeight) - gap)
        : rect.bottom + gap;

      setColorPickerPosition({ top, left, width, maxHeight });
    };

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (
        colorPickerTriggerRef.current?.contains(target)
        || colorPickerPopoverRef.current?.contains(target)
      ) {
        return;
      }
      setShowColorPicker(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowColorPicker(false);
    };

    updatePosition();
    const triggerObserver = new ResizeObserver(updatePosition);
    if (colorPickerTriggerRef.current) {
      triggerObserver.observe(colorPickerTriggerRef.current);
    }
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      triggerObserver.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [showColorPicker]);

  // Load existing saved resume on mount
  useEffect(() => {
    if (resumeIdParam) {
      setLoadingResume(true);
      setLoadError("");
      const request = isGuest
        ? Promise.resolve(getGuestResume(resumeIdParam))
        : resumeApi.get(resumeIdParam);
      request
        .then((found) => {
          if (!found) throw new Error("This temporary resume is no longer available in this tab.");
          if (!found.editable) {
            router.push(`/resumes/${resumeIdParam}${isGuest ? "?guest=1" : ""}`);
            return;
          }
          setEditingResumeId(found.id);
          setSourceVersion(found.source_version);
          setResumeTitle(found.title);
          setActiveTemplateId(found.template_id || "1");
          if (found.resume_data) {
            const loaded = { ...initialResumeData, ...found.resume_data } as ResumeData;
            setResumeData(loaded);
            setElementStyles(loaded.elementStyles || {});
          }
          setSaveStatus("idle");
        })
        .catch((caught) => {
          setLoadError(caught instanceof Error
            ? caught.message
            : "Unable to load this resume. It may have been removed or you may not have access.");
          setSaveStatus("error");
        })
        .finally(() => {
          setLoadingResume(false);
        });
      return;
    }

    const templatePlaceholders = isGuest
      ? templateCatalog.find((template) => template.id === activeTemplateId)?.data
      : null;
    const startingData = templatePlaceholders
      ? { ...initialResumeData, ...structuredClone(templatePlaceholders) }
      : { ...initialResumeData };
    setResumeData(startingData);
    setElementStyles(startingData.elementStyles || {});
    setSaveStatus("dirty");
    setLoadingResume(false);
  }, [activeTemplateId, getGuestResume, isGuest, resumeIdParam, router]);

  useEffect(() => {
    if (!isGuest && saveStatus !== "dirty" && saveStatus !== "error") return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isGuest, saveStatus]);

  useEffect(() => {
    if (isGuest) {
      setProfileSuggestions(null);
      setProfileLoadError("");
      return;
    }
    profileApi
      .getProfile()
      .then((profile) => {
        setProfileLoadError("");
        setProfileSuggestions(profile);
        if (resumeIdParam) return;
        const profileData = profileToResumeData(profile);
        setResumeData((prev) => ({
          ...prev,
          ...profileData,
          fullName: profileData.fullName || prev.fullName,
          email: profileData.email || prev.email,
          phone: profileData.phone || prev.phone,
          location: profileData.location || prev.location,
          avatarUrl: profileData.avatarUrl || prev.avatarUrl,
          jobTitle: profileData.jobTitle || prev.jobTitle,
          summary: profileData.summary || prev.summary,
          skills: profileData.skills?.length ? profileData.skills : prev.skills,
          languages: profileData.languages?.length ? profileData.languages : prev.languages,
          experience: profileData.experience?.length ? profileData.experience : prev.experience,
          education: profileData.education?.length ? profileData.education : prev.education,
          socialLinks: profileData.socialLinks?.length ? profileData.socialLinks : prev.socialLinks,
          projects: profileData.projects?.length ? profileData.projects : prev.projects,
          certificates: profileData.certificates?.length ? profileData.certificates : prev.certificates,
          elementStyles: profileData.elementStyles || prev.elementStyles,
        }));
        setElementStyles(profileData.elementStyles || {});
      })
      .catch((caught) => {
        setProfileLoadError(caught instanceof ApiClientError && caught.status === 404
          ? "Complete your profile to use saved profile suggestions."
          : "Profile suggestions could not be loaded. Your resume is still editable.");
      });
  }, [isGuest, resumeIdParam]);

  const markDirty = () => {
    revisionRef.current += 1;
    setSaveStatus("dirty");
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

    const current = elementStyles[selectedElementId] || {};
    const newValue = typeof value === "boolean" && current[key] === value ? false : value;
    const next = {
      ...elementStyles,
      [selectedElementId]: {
        ...current,
        [key]: newValue,
      },
    };
    setElementStyles(next);
    setResumeData((data) => ({ ...data, elementStyles: next }));
    markDirty();
  };

  const updateSelectedText = (value: string) => {
    if (!selectedElementId) return;
    setResumeData((current) => updateEditableResumeText(current, selectedElementId, value));
    markDirty();
  };

  const confirmDeletePage = () => {
    if (deletePageIndex === null) return;
    const page = paginateResumeData(resumeData)[deletePageIndex];
    if (!page) {
      setDeletePageIndex(null);
      return;
    }

    const next = removeResumePage(resumeData, page);
    setResumeData(next);
    setElementStyles(next.elementStyles || {});
    setSelectedElementId(null);
    setDeletePageIndex(null);
    markDirty();
    toast.info("The page content was removed. Your resume will autosave.", "Page deleted");
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

  const addSkill = async (skillText: string, category?: string) => {
    const name = skillText.trim();
    if (!name) return;
    if ([...resumeData.skills, ...resumeData.languages].some((item) => item.toLocaleLowerCase() === name.toLocaleLowerCase())) {
      toast.info(`${name} is already in this resume.`);
      return;
    }
    const field = category === "Language" ? "languages" : "skills";
    const savedProfileItem = profileSuggestions?.skills.find((item) =>
      item.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
    );
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      [field]: [...prev[field], name],
    }));
    if (!profileSuggestions || savedProfileItem) {
      if (savedProfileItem) toast.success(`${name} was added from your profile.`);
      return;
    }
    try {
      const created = await createSkill({ name, category, level: null });
      setProfileSuggestions((current) => current
        ? { ...current, skills: [...current.skills, created] }
        : current);
      toast.success(`${name} was added to the resume and your profile.`);
    } catch (caught) {
      setResumeData((prev) => ({
        ...prev,
        [field]: prev[field].filter((item) => item.toLocaleLowerCase() !== name.toLocaleLowerCase()),
      }));
      toast.error(caught instanceof ApiClientError ? caught.message : "The new item could not be saved to your profile. The resume change was rolled back.");
    }
  };

  const removeSkill = (index: number) => {
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const addProfileExperience = (item: ProfileResponse["experience"][number]) => {
    if (resumeData.experience.some((entry) => entry.id === item.id)) return;
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
    if (resumeData.education?.some((entry) => entry.id === item.id)) return;
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
    if (resumeData.skills.some((skill) => skill.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    markDirty();
    setResumeData((prev) => ({
      ...prev,
      skills: prev.skills.includes(name) ? prev.skills : [...prev.skills, name],
    }));
  };

  const addProfileProject = (id: string) => {
    const item = profileSuggestions?.projects.find((project) => project.id === id);
    if (!item || resumeData.projects?.some((project) => project.id === id)) return;
    markDirty();
    setResumeData((current) => ({
      ...current,
      projects: [...(current.projects || []), {
        id: item.id,
        name: item.name,
        description: item.description || "",
        url: item.link || item.github_url || undefined,
        technologies: item.technologies || [],
      }],
    }));
  };

  const addProfileCertificate = (id: string) => {
    const item = profileSuggestions?.certificates.find((certificate) => certificate.id === id);
    if (!item || resumeData.certificates?.some((certificate) => certificate.id === id)) return;
    markDirty();
    setResumeData((current) => ({
      ...current,
      certificates: [...(current.certificates || []), {
        id: item.id,
        title: item.title,
        issuer: item.category || "",
        date: item.issue_date || "",
        url: item.file_url || undefined,
      }],
    }));
  };

  const addProfileSocialLink = (id: string) => {
    const item = profileSuggestions?.social_links.find((link) => link.id === id);
    if (!item || resumeData.socialLinks?.some((link) => link.id === id)) return;
    markDirty();
    setResumeData((current) => ({
      ...current,
      socialLinks: [...(current.socialLinks || []), {
        id: item.id,
        platform: item.platform_name,
        url: item.profile_url,
      }],
    }));
  };

  const addProfileLanguage = (name: string) => {
    if (resumeData.languages.some((language) => language.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    markDirty();
    setResumeData((current) => ({ ...current, languages: [...current.languages, name] }));
  };

  const resetSectionFromProfile = (
    section: "personal" | "experience" | "education" | "skills" | "more",
  ) => {
    if (!profileSuggestions) return;
    const profileData = profileToResumeData(profileSuggestions);
    markDirty();
    setResumeData((current) => {
      if (section === "personal") return {
        ...current,
        fullName: profileData.fullName,
        jobTitle: profileData.jobTitle,
        email: profileData.email,
        phone: profileData.phone,
        location: profileData.location,
        avatarUrl: profileData.avatarUrl,
        summary: profileData.summary,
        socialLinks: profileData.socialLinks,
      };
      if (section === "experience") return { ...current, experience: profileData.experience };
      if (section === "education") return { ...current, education: profileData.education };
      if (section === "skills") return { ...current, skills: profileData.skills, languages: profileData.languages };
      return {
        ...current,
        projects: profileData.projects,
        certificates: profileData.certificates,
        socialLinks: profileData.socialLinks,
        languages: profileData.languages,
      };
    });
    toast.info("This resume section was reset from your current profile snapshot.");
  };

  const moveResumeItem = (
    field: "experience" | "education" | "projects" | "certificates" | "socialLinks",
    index: number,
    direction: -1 | 1,
  ) => {
    const values = [...(resumeData[field] || [])] as Array<unknown>;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= values.length) return;
    [values[index], values[nextIndex]] = [values[nextIndex], values[index]];
    markDirty();
    setResumeData((current) => ({ ...current, [field]: values } as ResumeData));
  };

  const reorderResumeItem = (
    field: "experience" | "education" | "projects" | "certificates" | "socialLinks",
    fromIndex: number,
    toIndex: number,
  ) => {
    const values = [...(resumeData[field] || [])] as Array<unknown>;
    const [moved] = values.splice(fromIndex, 1);
    if (moved === undefined) return;
    values.splice(toIndex, 0, moved);
    markDirty();
    setResumeData((current) => ({ ...current, [field]: values } as ResumeData));
  };

  const startItemDrag = (
    event: DragEvent,
    field: "experience" | "education" | "projects" | "certificates" | "socialLinks",
    index: number,
  ) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-resume-item", `${field}:${index}`);
  };

  const dropItem = (
    event: DragEvent,
    field: "experience" | "education" | "projects" | "certificates" | "socialLinks",
    index: number,
  ) => {
    event.preventDefault();
    const [sourceField, sourceIndex] = event.dataTransfer.getData("application/x-resume-item").split(":");
    if (sourceField !== field || !/^\d+$/.test(sourceIndex || "")) return;
    reorderResumeItem(field, Number(sourceIndex), index);
  };

  const saveExperienceToProfile = async (index: number) => {
    if (isGuest) return;
    const item = resumeData.experience[index];
    if (!item || profileSuggestions?.experience.some((entry) => entry.id === item.id)) return;
    const [startDate = "", endValue = ""] = item.period.split(/\s+-\s+/, 2);
    const isCurrent = endValue.toLocaleLowerCase() === "present";
    const dateError = validateDate(startDate, { label: "Start date", required: true })
      || validateEndDate(isCurrent ? "" : endValue, startDate, { current: isCurrent });
    if (!item.role.trim() || !item.company.trim() || dateError) {
      toast.error(dateError || "Enter a role and company before saving to your profile.");
      return;
    }
    try {
      const created = await createExperience({
        job_title: item.role.trim(),
        company_name: item.company.trim(),
        start_date: startDate,
        end_date: !isCurrent && endValue ? endValue : null,
        is_current: isCurrent,
        description: item.details || null,
      });
      setProfileSuggestions((current) => current ? { ...current, experience: [...current.experience, created] } : current);
      setResumeData((current) => ({
        ...current,
        experience: current.experience.map((entry, itemIndex) => itemIndex === index ? { ...entry, id: created.id } : entry),
      }));
      markDirty();
      toast.success("This experience is now saved to your profile and resume.");
    } catch (caught) {
      toast.error(caught instanceof ApiClientError ? caught.message : "The experience could not be saved to your profile.");
    }
  };

  const saveEducationToProfile = async (index: number) => {
    if (isGuest) return;
    const item = resumeData.education?.[index];
    if (!item || profileSuggestions?.education.some((entry) => entry.id === item.id)) return;
    const [startDate = "", endValue = ""] = item.period.split(/\s+-\s+/, 2);
    const isCurrent = endValue.toLocaleLowerCase() === "present";
    const dateError = validateDate(startDate, { label: "Start date", required: true })
      || validateEndDate(isCurrent ? "" : endValue, startDate, { current: isCurrent });
    if (!item.institution.trim() || dateError) {
      toast.error(dateError || "Enter an institution before saving to your profile.");
      return;
    }
    try {
      const created = await createEducation({
        institute_name: item.institution.trim(),
        degree: item.degree.trim() || null,
        field_of_study: null,
        start_date: startDate,
        end_date: !isCurrent && endValue ? endValue : null,
        is_current: isCurrent,
        description: null,
        grade: item.grade || null,
      });
      setProfileSuggestions((current) => current ? { ...current, education: [...current.education, created] } : current);
      setResumeData((current) => ({
        ...current,
        education: (current.education || []).map((entry, itemIndex) => itemIndex === index ? { ...entry, id: created.id } : entry),
      }));
      markDirty();
      toast.success("This education entry is now saved to your profile and resume.");
    } catch (caught) {
      toast.error(caught instanceof ApiClientError ? caught.message : "The education entry could not be saved to your profile.");
    }
  };

  const addProjectToResumeAndProfile = async () => {
    const name = newProject.name.trim();
    if (!name || resumeData.projects?.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    const urlError = validateUrl(newProject.url);
    if (urlError) {
      toast.error(urlError, "Invalid project URL");
      return;
    }
    const savedProject = profileSuggestions?.projects.find((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase());
    if (savedProject) {
      addProfileProject(savedProject.id);
      setNewProject({ name: "", description: "", url: "", technologies: "" });
      toast.success(`${name} was added from your profile.`);
      return;
    }
    const temporaryId = `pending-${crypto.randomUUID()}`;
    const optimistic = {
      id: temporaryId,
      name,
      description: newProject.description.trim(),
      url: newProject.url ? normalizeUrl(newProject.url) : undefined,
      technologies: newProject.technologies.split(",").map((item) => item.trim()).filter(Boolean),
    };
    markDirty();
    setResumeData((current) => ({ ...current, projects: [...(current.projects || []), optimistic] }));
    if (isGuest) {
      setNewProject({ name: "", description: "", url: "", technologies: "" });
      toast.success("The project was added to this temporary resume.");
      return;
    }
    try {
      const created = await createProject({
        name,
        description: optimistic.description || null,
        link: optimistic.url || null,
        technologies: optimistic.technologies,
      });
      setProfileSuggestions((current) => current ? { ...current, projects: [...current.projects, created] } : current);
      setResumeData((current) => ({
        ...current,
        projects: (current.projects || []).map((item) => item.id === temporaryId ? { ...optimistic, id: created.id } : item),
      }));
      setNewProject({ name: "", description: "", url: "", technologies: "" });
      markDirty();
      toast.success("The project was saved to your profile and resume.");
    } catch (caught) {
      setResumeData((current) => ({ ...current, projects: (current.projects || []).filter((item) => item.id !== temporaryId) }));
      markDirty();
      toast.error(caught instanceof ApiClientError ? caught.message : "The project could not be saved. The optimistic change was rolled back.");
    }
  };

  const addCertificateToResumeAndProfile = async () => {
    const title = newCertificate.title.trim();
    if (!title || resumeData.certificates?.some((item) => item.title.toLocaleLowerCase() === title.toLocaleLowerCase())) return;
    const urlError = validateUrl(newCertificate.url);
    const dateError = validateDate(newCertificate.date, { label: "Issue date" });
    if (urlError || dateError) {
      toast.error(urlError || dateError || "Check the certificate details.", "Invalid certificate");
      return;
    }
    const savedCertificate = profileSuggestions?.certificates.find((item) => item.title.toLocaleLowerCase() === title.toLocaleLowerCase());
    if (savedCertificate) {
      addProfileCertificate(savedCertificate.id);
      setNewCertificate({ title: "", issuer: "", date: "", url: "" });
      toast.success(`${title} was added from your profile.`);
      return;
    }
    const temporaryId = `pending-${crypto.randomUUID()}`;
    const optimistic = { id: temporaryId, title, issuer: newCertificate.issuer.trim(), date: newCertificate.date, url: newCertificate.url ? normalizeUrl(newCertificate.url) : undefined };
    markDirty();
    setResumeData((current) => ({ ...current, certificates: [...(current.certificates || []), optimistic] }));
    if (isGuest) {
      setNewCertificate({ title: "", issuer: "", date: "", url: "" });
      toast.success("The certificate was added to this temporary resume.");
      return;
    }
    try {
      const created = await createCertificate({
        title,
        category: optimistic.issuer || null,
        issue_date: optimistic.date || null,
        file_url: optimistic.url || null,
      });
      setProfileSuggestions((current) => current ? { ...current, certificates: [...current.certificates, created] } : current);
      setResumeData((current) => ({
        ...current,
        certificates: (current.certificates || []).map((item) => item.id === temporaryId ? { ...optimistic, id: created.id } : item),
      }));
      setNewCertificate({ title: "", issuer: "", date: "", url: "" });
      markDirty();
      toast.success("The certificate was saved to your profile and resume.");
    } catch (caught) {
      setResumeData((current) => ({ ...current, certificates: (current.certificates || []).filter((item) => item.id !== temporaryId) }));
      markDirty();
      toast.error(caught instanceof ApiClientError ? caught.message : "The certificate could not be saved. The optimistic change was rolled back.");
    }
  };

  const addSocialLinkToResumeAndProfile = async () => {
    const platform = newSocialLink.platform.trim();
    const urlError = validateUrl(newSocialLink.url, { required: true, platform });
    if (urlError) {
      toast.error(urlError, "Invalid social link");
      return;
    }
    const url = normalizeUrl(newSocialLink.url);
    if (!platform || !url || resumeData.socialLinks?.some((item) => item.url.toLocaleLowerCase() === url.toLocaleLowerCase())) return;
    const savedLink = profileSuggestions?.social_links.find((item) => item.profile_url.toLocaleLowerCase() === url.toLocaleLowerCase());
    if (savedLink) {
      addProfileSocialLink(savedLink.id);
      setNewSocialLink({ platform: "", url: "" });
      toast.success(`${platform} was added from your profile.`);
      return;
    }
    const temporaryId = `pending-${crypto.randomUUID()}`;
    const optimistic = { id: temporaryId, platform, url };
    markDirty();
    setResumeData((current) => ({ ...current, socialLinks: [...(current.socialLinks || []), optimistic] }));
    if (isGuest) {
      setNewSocialLink({ platform: "", url: "" });
      toast.success("The social link was added to this temporary resume.");
      return;
    }
    try {
      const created = await createSocialLink({ platform_name: platform, profile_url: url });
      setProfileSuggestions((current) => current ? { ...current, social_links: [...current.social_links, created] } : current);
      setResumeData((current) => ({
        ...current,
        socialLinks: (current.socialLinks || []).map((item) => item.id === temporaryId ? { id: created.id, platform: created.platform_name, url: created.profile_url } : item),
      }));
      setNewSocialLink({ platform: "", url: "" });
      markDirty();
      toast.success("The social link was saved to your profile and resume.");
    } catch (caught) {
      setResumeData((current) => ({ ...current, socialLinks: (current.socialLinks || []).filter((item) => item.id !== temporaryId) }));
      markDirty();
      toast.error(caught instanceof ApiClientError ? caught.message : "The social link could not be saved. The optimistic change was rolled back.");
    }
  };

  const handleSaveResume = async (silent = false) => {
    if (!resumeTitle.trim() || saveInFlightRef.current) return null;
    const nameError = validateName(resumeData.fullName, "Full name");
    const emailError = validateEmail(resumeData.email);
    const phone = analyzePhoneNumber(resumeData.phone);
    const phoneError = resumeData.phone && !phone.valid ? "Enter a valid international phone number." : null;
    const invalidProject = resumeData.projects?.find((item) => item.url && validateUrl(item.url));
    const invalidCertificate = resumeData.certificates?.find((item) => item.url && validateUrl(item.url));
    const invalidSocialLink = resumeData.socialLinks?.find((item) => validateUrl(item.url, { required: true, platform: item.platform }));
    const validationError = nameError || emailError || phoneError
      || (invalidProject ? "Check the project URLs before saving." : null)
      || (invalidCertificate ? "Check the credential URLs before saving." : null)
      || (invalidSocialLink ? "Check the social links before saving." : null);
    if (validationError) {
      setSaveStatus("error");
      setSaveNotice(validationError);
      if (!silent) toast.error(validationError, "Resume validation failed");
      return null;
    }
    saveInFlightRef.current = true;
    setSaveInFlight(true);
    const revisionAtStart = revisionRef.current;
    const dataAtStart: ResumeData = {
      ...resumeData,
      fullName: normalizePlainText(resumeData.fullName, 100),
      jobTitle: normalizePlainText(resumeData.jobTitle, 255),
      email: normalizeEmail(resumeData.email),
      phone: phone.e164,
      location: normalizePlainText(resumeData.location, 255),
      summary: normalizePlainText(resumeData.summary, 4000),
      projects: resumeData.projects?.map((item) => ({
        ...item,
        name: normalizePlainText(item.name, 255),
        description: normalizePlainText(item.description, 4000),
        url: item.url ? normalizeUrl(item.url) : undefined,
      })),
      certificates: resumeData.certificates?.map((item) => ({
        ...item,
        url: item.url ? normalizeUrl(item.url) : undefined,
      })),
      socialLinks: resumeData.socialLinks?.map((item) => ({
        ...item,
        platform: normalizePlainText(item.platform, 50),
        url: normalizeUrl(item.url),
      })),
      elementStyles,
    };
    setSaveStatus("saving");
    setSaveNotice("");
    try {
      const updatePayload = {
        title: resumeTitle,
        template_id: activeTemplateId,
        resume_data: dataAtStart,
        source_version: sourceVersion || undefined,
      };
      const saved = isGuest
        ? editingResumeId
          ? updateGuestResume(editingResumeId, updatePayload)
          : createGuestResume({
              title: resumeTitle,
              template_id: activeTemplateId,
              resume_data: dataAtStart,
            })
        : editingResumeId
          ? await resumeApi.update(editingResumeId, updatePayload)
          : await resumeApi.createTemplate({
              title: resumeTitle,
              template_id: activeTemplateId,
              resume_data: dataAtStart,
            });

      if (!saved) throw new Error("This temporary resume is no longer available.");
      setEditingResumeId(saved.id);
      setSourceVersion(saved.source_version);
      if (revisionRef.current === revisionAtStart) {
        if (saved.resume_data) {
          const confirmed = saved.resume_data as ResumeData;
          setResumeData(confirmed);
          setElementStyles(confirmed.elementStyles || {});
        }
        setSaveStatus("success");
      } else {
        setSaveStatus("dirty");
      }
      setSaveNotice(revisionRef.current === revisionAtStart
        ? isGuest ? "Kept in tab ✓" : "Saved ✓"
        : "");
      if (!silent) {
        toast.success(isGuest
          ? "Changes are kept in this tab only."
          : "Your latest changes are saved.");
      }
      router.replace(`/editor/${saved.template_id || activeTemplateId}?resumeId=${saved.id}${isGuest ? "&guest=1" : ""}`);
      return saved;
    } catch (caught) {
      setSaveStatus("error");
      setSaveNotice("Save failed");
      if (caught instanceof ApiClientError && caught.status === 409) {
        toast.error("This resume was changed in another tab. Reload before saving again.", "Save conflict");
      } else if (!silent) {
        toast.error(
          caught instanceof ApiClientError
            ? caught.message
            : "Your changes are still in the editor. Please try saving again.",
          "Save failed",
        );
      }
      return null;
    } finally {
      saveInFlightRef.current = false;
      setSaveInFlight(false);
      if (revisionRef.current !== revisionAtStart) {
        window.setTimeout(() => void saveResumeRef.current(), 1600);
      }
      setTimeout(() => {
        setSaveNotice("");
        setSaveStatus((current) => (current === "success" ? "idle" : current));
      }, 3500);
    }
  };

  saveResumeRef.current = async () => {
    await handleSaveResume(true);
  };

  useEffect(() => {
    if (!editingResumeId || saveStatus !== "dirty" || !resumeTitle.trim()) return;
    const timer = window.setTimeout(() => void saveResumeRef.current(), 1600);
    return () => window.clearTimeout(timer);
  }, [activeTemplateId, editingResumeId, elementStyles, resumeData, resumeTitle, saveStatus]);

  const handleDownloadPDF = async () => {
    if (!resumeTitle.trim() || downloadStatus !== "idle") return;
    setDownloadStatus("preparing");
    setSaveNotice("");
    try {
      await downloadResumePdf(resumeTitle);
      toast.success("Print preview opened. Choose Save as PDF to download your resume.");
    } catch (caught) {
      setSaveNotice("Print failed");
      toast.error(
        caught instanceof Error
          ? caught.message
          : "We could not prepare the resume for printing. Your editor changes are still available.",
        "Print failed",
      );
      setTimeout(() => setSaveNotice(""), 3500);
    } finally {
      setDownloadStatus("idle");
    }
  };

  const requestAiProposal = async () => {
    if (isGuest || !editingResumeId || !aiInstruction.trim() || aiBusy) return;
    setAiBusy(true);
    setAiError("");
    try {
      setAiProposal(await resumeApi.aiEdit(editingResumeId, {
        instruction: aiInstruction.trim(),
        job_description: aiJobDescription.trim() || undefined,
        reference_links: aiReferenceLinks
          .split(/\r?\n/)
          .map((link) => link.trim())
          .filter(Boolean),
      }));
      toast.info("Review the proposal, then apply it when you are ready.", "AI proposal ready");
    } catch (caught) {
      const message = caught instanceof ApiClientError
        ? caught.message
        : "The AI proposal could not be created. Your instruction is still available.";
      setAiError(message);
      toast.error(message, "AI edit failed");
    } finally {
      setAiBusy(false);
    }
  };

  const applyAiProposal = () => {
    if (!aiProposal) return;
    setAiUndoData(resumeData);
    const proposalData = { ...initialResumeData, ...aiProposal.resume_data } as ResumeData;
    setResumeData(proposalData);
    setElementStyles(proposalData.elementStyles || {});
    setAiProposal(null);
    markDirty();
    toast.info("The proposal is applied locally and will autosave. Use Undo to restore the prior version.");
  };

  const undoAiProposal = () => {
    if (!aiUndoData) return;
    setResumeData(aiUndoData);
    setElementStyles(aiUndoData.elementStyles || {});
    setAiUndoData(null);
    markDirty();
    toast.info("The previous resume version was restored and will autosave.");
  };

  const selectShadeColor = (color: string) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
      toast.error("Enter a six-digit hex color such as #0E7C7B.", "Invalid color");
      return;
    }
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
  const selectedText = getEditableResumeText(resumeData, selectedElementId);

  const handlePhotoUpload = (file: File) => {
    const fileError = validateFile(file, {
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxBytes: 10 * 1024 * 1024,
      label: "Profile image",
    });
    if (fileError) {
      toast.error(fileError, "Photo not selected");
      return;
    }
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

    return (
      <ResumeDocument
        {...props}
        templateId={activeTemplateId === "ai" ? "1" : activeTemplateId}
        onDeletePage={setDeletePageIndex}
      />
    );
  };

  const saveLabel = saveInFlight
    ? isGuest ? "Keeping..." : "Saving..."
    : saveStatus === "success"
      ? isGuest ? "Kept in tab ✓" : "Saved ✓"
      : isGuest ? "Keep in tab" : "Save";
  const statusLabel =
    saveInFlight
      ? isGuest ? "Keeping in tab..." : "Saving..."
      : saveStatus === "dirty"
      ? "Unsaved changes"
      : saveStatus === "success"
          ? isGuest ? "In this tab only ✓" : "Saved ✓"
          : saveStatus === "error"
            ? "Save failed"
            : isGuest ? "In this tab only" : "Saved";

  if (loadingResume) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6 font-sans text-[var(--text)]">
        <LoadingState label="Loading resume..." cards={2} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6">
        <ErrorState message={loadError} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!["1", "2", "3", "4", "5", "6", "ai"].includes(activeTemplateId)) {
    return (
      <div className="min-h-screen bg-[var(--bg)] p-6">
        <ErrorState message="This template does not exist or is no longer available." onRetry={() => router.push("/templates")} />
      </div>
    );
  }

  return (
    <div className="resume-print-context min-h-screen bg-[var(--bg)] flex flex-col font-sans text-[var(--text)] lg:h-screen lg:overflow-hidden">
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

        {/* The selected layout is fixed for the lifetime of this resume. */}
        <div className="hidden items-center space-x-2 sm:flex">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Template:</span>
          <span className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--text)]">
            {activeTemplateId === "ai" ? "AI Studio" : `Template #${activeTemplateId}`}
          </span>
        </div>

        {/* Right Side: Save & browser print download */}
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
            disabled={saveInFlight || downloadStatus !== "idle"}
            loading={saveInFlight}
            loadingLabel={isGuest ? "Keeping..." : "Saving..."}
          >
            {saveStatus === "success" ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveLabel}</span>
          </Button>

          <div className="flex max-w-72 flex-col items-end gap-1">
            <Button
              type="button"
              size="sm"
              onClick={() => void handleDownloadPDF()}
              disabled={downloadStatus !== "idle"}
              loading={downloadStatus === "preparing"}
              loadingLabel="Preparing..."
              title="Print this resume as an A4 PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </Button>
            <p className="text-right text-[10px] leading-tight text-[var(--text-muted)]">
              In the print window choose <strong>Save as PDF</strong>, Margins: <strong>None</strong>, enable <strong>Background graphics</strong>.
            </p>
          </div>
        </div>
      </header>

      {isGuest && (
        <div className="no-print flex flex-col gap-2 border-b border-[var(--status-warning-text)] bg-[var(--status-warning-bg)] px-4 py-2 text-xs font-semibold text-[var(--status-warning-text)] sm:flex-row sm:items-center sm:justify-between" role="status">
          <span>Guest mode: nothing is uploaded. Refreshing or closing this tab permanently removes this resume.</span>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/auth/login" className="button button-ghost button-sm">Log in</Link>
            <Link href="/auth/register" className="button button-secondary button-sm">Sign up to save</Link>
          </div>
        </div>
      )}

      {/* 2. Formatting Toolbar with Text Color Shades Dropdown (Row 2) */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] px-4 py-2 flex items-center flex-wrap gap-3 overflow-x-auto text-xs text-[var(--text)] relative z-30 shadow-xs no-print">
        <button
          type="button"
          onClick={() => setEditorPanelOpen((current) => !current)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1.5 font-bold text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
          aria-controls="resume-editor-panel"
          aria-expanded={editorPanelOpen}
          title={editorPanelOpen ? "Hide editor panel" : "Show editor panel"}
        >
          {editorPanelOpen
            ? <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            : <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />}
          <span>{editorPanelOpen ? "Hide details" : "Edit details"}</span>
        </button>

        {/* Active Selection Indicator */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--primary-tint)] text-[var(--primary)] border border-[var(--primary)]/30 rounded-xl font-bold">
          <Target className="w-3.5 h-3.5" />
          <span>
            Selected: <strong className="capitalize">{selectedElementId || "Entire Canvas"}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSelectedElementId(null)}
          className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] hover:border-[var(--primary)]"
        >
          Entire document
        </button>

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
            value={selectedElementId
              ? currentSelectedStyle.fontFamily || resumeData.fontFamily || "Inter, sans-serif"
              : resumeData.fontFamily || "Inter, sans-serif"}
            onChange={(e) => selectedElementId
              ? applyStyleToSelected("fontFamily", e.target.value)
              : handleFieldChange("fontFamily", e.target.value)}
            className="bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-xs font-semibold px-2 py-1 rounded-lg outline-none cursor-pointer"
          >
            <option value="Inter, sans-serif">Inter (Sans-Serif)</option>
            <option value="Georgia, serif">Georgia (Serif)</option>
            <option value="Bricolage Grotesque, sans-serif">Bricolage (Modern)</option>
            <option value="Courier New, monospace">Courier (Monospace)</option>
          </select>
        </div>

        <div className="flex items-center gap-1 pr-3 border-r border-[var(--border)]">
          <button
            type="button"
            disabled={!selectedElementId}
            onClick={() => applyStyleToSelected("fontSize", Math.max(6, (currentSelectedStyle.fontSize || 12) - 1))}
            className="rounded border border-[var(--border)] px-2 py-1 font-bold disabled:opacity-40"
            aria-label="Decrease selected element font size"
          >−</button>
          <select
            aria-label="Selected element font size"
            disabled={!selectedElementId}
            value={currentSelectedStyle.fontSize || 12}
            onChange={(event) => applyStyleToSelected("fontSize", Number(event.target.value))}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-xs"
          >
            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48].map((size) => <option key={size} value={size}>{size} pt</option>)}
          </select>
          <button
            type="button"
            disabled={!selectedElementId}
            onClick={() => applyStyleToSelected("fontSize", Math.min(96, (currentSelectedStyle.fontSize || 12) + 1))}
            className="rounded border border-[var(--border)] px-2 py-1 font-bold disabled:opacity-40"
            aria-label="Increase selected element font size"
          >+</button>
          <div className="ml-1 flex gap-1" aria-label="Font size presets">
            {[
              ["Body", 10],
              ["Subheading", 14],
              ["Heading", 24],
            ].map(([label, size]) => (
              <button
                key={label}
                type="button"
                disabled={!selectedElementId}
                onClick={() => applyStyleToSelected("fontSize", Number(size))}
                className="rounded border border-[var(--border)] px-1.5 py-1 text-[9px] font-bold disabled:opacity-40"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pr-3 border-r border-[var(--border)]">
          <label className="flex items-center gap-1 font-semibold">
            Page
            <select
              value={resumeData.pageSize || "A4"}
              onChange={(event) => handleFieldChange("pageSize", event.target.value as ResumeData["pageSize"])}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
            >
              <option value="A4">A4</option><option value="Letter">Letter</option><option value="Legal">Legal</option><option value="A5">A5</option><option value="B5">B5</option><option value="Tabloid">Tabloid</option>
            </select>
          </label>
          <label className="flex items-center gap-1 font-semibold">
            Spacing
            <select
              value={selectedElementId
                ? currentSelectedStyle.lineHeight ?? resumeData.lineSpacing ?? 1.15
                : resumeData.lineSpacing ?? 1.15}
              onChange={(event) => selectedElementId
                ? applyStyleToSelected("lineHeight", Number(event.target.value))
                : handleFieldChange("lineSpacing", Number(event.target.value))}
              className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
            >
              <option value="1">1.0</option><option value="1.15">1.15</option><option value="1.5">1.5</option><option value="2">2.0</option>
            </select>
          </label>
          <label className="flex items-center gap-1 font-semibold">
            Margin
            <input
              type="number"
              min="5"
              max="40"
              value={resumeData.pageMargin ?? 10}
              onChange={(event) => handleFieldChange("pageMargin", Number(event.target.value))}
              className="w-14 rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1"
              aria-label="Page margin in millimeters"
            />
          </label>
        </div>

        {/* TEXT COLOR PICKER & SHADES DROPDOWN IN CANVAS */}
        <div className="pr-3 border-r border-[var(--border)]">
          <button
            ref={colorPickerTriggerRef}
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center space-x-2 bg-[var(--bg)] hover:bg-[var(--primary-tint)] border border-[var(--border)] px-3 py-1 rounded-lg font-semibold transition"
            title="Text Color & Shades Dropdown"
            aria-haspopup="dialog"
            aria-expanded={showColorPicker}
            aria-controls="resume-color-picker"
          >
            <Palette className="w-4 h-4 text-[var(--primary)]" />
            <span>Text Color</span>
            <div
              className="w-4 h-4 rounded-full border border-black/20 shadow-xs"
              style={{ backgroundColor: activeColor }}
            />
          </button>

          {/* Color Shades Dropdown Grid */}
          {showColorPicker && colorPickerPosition && createPortal(
            <div
              ref={colorPickerPopoverRef}
              id="resume-color-picker"
              role="dialog"
              aria-label="Resume color shades"
              className="fixed z-[100] space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-2xl animate-fadeIn no-print"
              style={colorPickerPosition}
            >
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <div className="flex items-center space-x-1.5">
                  <Palette className="w-4 h-4 text-[var(--primary)]" />
                  <span className="font-bold text-xs text-[var(--text)]">
                    Color Shades Grid ({selectedElementId ? "Selected Element" : "Theme"})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text)]"
                  aria-label="Close color picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Color Columns & Shade Rows Grid */}
              <div className="grid grid-cols-[repeat(11,minmax(0,1fr))] gap-1">
                {colorShadesColumns.map((col, colIdx) => (
                  <div key={colIdx} className="flex min-w-0 flex-col gap-1" title={col.hue}>
                    {col.shades.map((shade, rowIdx) => (
                      <button
                        type="button"
                        key={rowIdx}
                        onClick={() => selectShadeColor(shade)}
                        className={`aspect-square w-full min-w-0 rounded-md border border-black/10 transition transform hover:scale-125 flex items-center justify-center ${
                          activeColor === shade ? "ring-2 ring-[var(--primary)] ring-offset-1" : ""
                        }`}
                        style={{ backgroundColor: shade }}
                        title={`${col.hue} Shade: ${shade}`}
                      >
                        {activeColor === shade && (
                          <Check className={`w-3 h-3 ${rowIdx < 5 ? "text-white" : "text-black"}`} />
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
                    type="button"
                    onClick={() => setShowCustomHexInput(true)}
                    className="w-full flex items-center justify-center space-x-2 bg-[var(--bg)] hover:bg-[var(--primary-tint)] border border-[var(--border)] py-1.5 rounded-xl text-xs font-bold text-[var(--primary)] transition"
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
                      className="min-w-0 flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg p-1.5 font-mono text-xs text-[var(--text)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => selectShadeColor(customHex)}
                      className="bg-[var(--primary)] text-[var(--on-primary)] text-xs font-bold px-3 py-1.5 rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>,
            document.body,
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

      {selectedText && (
        <div className="no-print flex flex-col gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs text-[var(--text)] md:flex-row md:items-end">
          <label className="min-w-0 flex-1">
            <span className="mb-1 block font-bold">Edit selected text — {selectedText.label}</span>
            {selectedText.multiline ? (
              <textarea
                value={selectedText.value}
                onChange={(event) => updateSelectedText(event.target.value)}
                rows={2}
                className="w-full resize-y rounded-xl border border-[var(--primary)] bg-[var(--bg)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                aria-label={`Edit ${selectedText.label}`}
              />
            ) : (
              <input
                value={selectedText.value}
                onChange={(event) => updateSelectedText(event.target.value)}
                className="w-full rounded-xl border border-[var(--primary)] bg-[var(--bg)] px-3 py-2 outline-none focus:ring-2 focus:ring-[var(--primary)]/25"
                aria-label={`Edit ${selectedText.label}`}
              />
            )}
          </label>
          <div className="flex items-center gap-2">
            <p className="max-w-64 text-[10px] leading-snug text-[var(--text-muted)]">
              Select text on the resume, then type here to replace or add to it.
            </p>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => {
                updateSelectedText("");
                setSelectedElementId(null);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Remove text
            </Button>
          </div>
        </div>
      )}

      {/* 3. Main Split Layout: Form Drawer Left + Live Canvas Right */}
      <div className="flex flex-1 flex-col lg:flex-row lg:overflow-hidden">
        {/* Left Form Sidebar Drawer */}
        <div
          id="resume-editor-panel"
          className={["editor-data-panel no-print", editorPanelOpen ? "is-open" : "is-closed"].join(" ")}
          aria-hidden={!editorPanelOpen}
          inert={!editorPanelOpen ? true : undefined}
        >
          {/* Section Tabs */}
          <div className="flex flex-wrap border-b border-[var(--border)] bg-[var(--bg)] p-2 gap-1">
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
            <button
              onClick={() => setActiveTab("more")}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeTab === "more" ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>More</span>
            </button>
            {!isGuest && (
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                  activeTab === "ai" ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs" : "text-[var(--text-muted)] hover:bg-[var(--primary-tint)]"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI edit</span>
              </button>
            )}
          </div>

          {profileLoadError && (
            <div className="border-b border-[var(--border)] p-3">
              <Alert variant="warning">{profileLoadError}</Alert>
            </div>
          )}

          {profileSuggestions && (
            <div className="border-b border-[var(--border)] bg-[var(--surface)] p-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-[var(--text)]">Profile library</h3>
                  <p className="text-[10px] text-[var(--text-muted)]">Profile data is copied into this resume and remains independently editable.</p>
                </div>
                <button
                  type="button"
                  onClick={() => resetSectionFromProfile(activeTab === "ai" ? "personal" : activeTab)}
                  disabled={activeTab === "ai"}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-2.5 py-1.5 text-[10px] font-bold text-[var(--on-primary)] disabled:opacity-40"
                >
                  <RotateCcw className="h-3 w-3" /> Reset section
                </button>
              </div>
              {activeTab === "experience" && (
                <ProfileSectionPicker
                  title="Experience"
                  items={profileSuggestions.experience.map((item) => ({
                    id: item.id,
                    label: item.job_title,
                    detail: item.company_name || item.institute_name || "",
                    selected: resumeData.experience.some((entry) => entry.id === item.id),
                  }))}
                  onAdd={(id) => {
                    const item = profileSuggestions.experience.find((entry) => entry.id === id);
                    if (item) addProfileExperience(item);
                  }}
                  onRemove={(id) => {
                    const index = resumeData.experience.findIndex((entry) => entry.id === id);
                    if (index >= 0) removeExperience(index);
                  }}
                />
              )}
              {activeTab === "education" && (
                <ProfileSectionPicker
                  title="Education"
                  items={profileSuggestions.education.map((item) => ({
                    id: item.id,
                    label: item.institute_name,
                    detail: item.degree || item.field_of_study || "",
                    selected: Boolean(resumeData.education?.some((entry) => entry.id === item.id)),
                  }))}
                  onAdd={(id) => {
                    const item = profileSuggestions.education.find((entry) => entry.id === id);
                    if (item) addProfileEducation(item);
                  }}
                  onRemove={(id) => {
                    const index = (resumeData.education || []).findIndex((entry) => entry.id === id);
                    if (index >= 0) removeEducation(index);
                  }}
                />
              )}
              {activeTab === "skills" && (
                <>
                  <ProfileSectionPicker
                    title="Skills"
                    items={profileSuggestions.skills.filter((item) => item.category?.toLocaleLowerCase() !== "language").map((item) => ({
                      id: item.id,
                      label: item.name,
                      detail: [item.category, item.level].filter(Boolean).join(" · "),
                      selected: resumeData.skills.some((name) => name.toLocaleLowerCase() === item.name.toLocaleLowerCase()),
                    }))}
                    onAdd={(id) => {
                      const item = profileSuggestions.skills.find((entry) => entry.id === id);
                      if (item) addProfileSkill(item.name);
                    }}
                    onRemove={(id) => {
                      const item = profileSuggestions.skills.find((entry) => entry.id === id);
                      const index = item ? resumeData.skills.findIndex((name) => name.toLocaleLowerCase() === item.name.toLocaleLowerCase()) : -1;
                      if (index >= 0) removeSkill(index);
                    }}
                  />
                  <ProfileSectionPicker
                    title="Languages"
                    items={profileSuggestions.skills.filter((item) => item.category?.toLocaleLowerCase() === "language").map((item) => ({
                      id: item.id,
                      label: item.name,
                      detail: item.level || "",
                      selected: resumeData.languages.some((name) => name.toLocaleLowerCase() === item.name.toLocaleLowerCase()),
                    }))}
                    onAdd={(id) => {
                      const item = profileSuggestions.skills.find((entry) => entry.id === id);
                      if (item) addProfileLanguage(item.name);
                    }}
                    onRemove={(id) => {
                      const item = profileSuggestions.skills.find((entry) => entry.id === id);
                      if (!item) return;
                      markDirty();
                      setResumeData((current) => ({ ...current, languages: current.languages.filter((name) => name.toLocaleLowerCase() !== item.name.toLocaleLowerCase()) }));
                    }}
                  />
                </>
              )}
              {activeTab === "more" && (
                <div className="space-y-3">
                  <ProfileSectionPicker title="Projects" items={profileSuggestions.projects.map((item) => ({ id: item.id, label: item.name, detail: item.description || "", selected: Boolean(resumeData.projects?.some((entry) => entry.id === item.id)) }))} onAdd={addProfileProject} onRemove={(id) => { markDirty(); setResumeData((current) => ({ ...current, projects: (current.projects || []).filter((item) => item.id !== id) })); }} />
                  <ProfileSectionPicker title="Certificates" items={profileSuggestions.certificates.map((item) => ({ id: item.id, label: item.title, detail: item.category || "", selected: Boolean(resumeData.certificates?.some((entry) => entry.id === item.id)) }))} onAdd={addProfileCertificate} onRemove={(id) => { markDirty(); setResumeData((current) => ({ ...current, certificates: (current.certificates || []).filter((item) => item.id !== id) })); }} />
                  <ProfileSectionPicker title="Social links" items={profileSuggestions.social_links.map((item) => ({ id: item.id, label: item.platform_name, detail: item.profile_url, selected: Boolean(resumeData.socialLinks?.some((entry) => entry.id === item.id)) }))} onAdd={addProfileSocialLink} onRemove={(id) => { markDirty(); setResumeData((current) => ({ ...current, socialLinks: (current.socialLinks || []).filter((item) => item.id !== id) })); }} />
                </div>
              )}
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
                  <ValidatedInput
                    label="Full name"
                    value={resumeData.fullName}
                    onFocus={() => setSelectedElementId("fullName")}
                    onValueChange={(value) => handleFieldChange("fullName", value)}
                    validate={(value) => validateName(value, "Full name")}
                    normalize={(value) => normalizePlainText(value, 100)}
                    required
                    maxLength={100}
                  />

                  <div>
                    <label className="text-[var(--text-muted)] block mb-1 font-semibold font-sans">Job Title / Headline</label>
                    <input
                      type="text"
                      value={resumeData.jobTitle}
                      onFocus={() => setSelectedElementId("jobTitle")}
                      onChange={(e) => handleFieldChange("jobTitle", e.target.value)}
                      maxLength={255}
                      className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <ValidatedInput
                      label="Email"
                      type="email"
                      value={resumeData.email}
                      onFocus={() => setSelectedElementId("contact-email")}
                      onValueChange={(value) => handleFieldChange("email", value)}
                      validate={validateEmail}
                      normalize={normalizeEmail}
                      required
                      maxLength={254}
                    />
                    <PhoneInput
                      label="Phone"
                      value={resumeData.phone}
                      onFocus={() => setSelectedElementId("contact-phone")}
                      onValueChange={(value) => handleFieldChange("phone", value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[var(--text-muted)] block mb-1 font-semibold">Location</label>
                    <input
                      type="text"
                      value={resumeData.location}
                      onFocus={() => setSelectedElementId("contact-location")}
                      onChange={(e) => handleFieldChange("location", e.target.value)}
                      maxLength={255}
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
                      maxLength={4000}
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
                  <div key={exp.id || index} draggable onDragStart={(event) => startItemDrag(event, "experience", index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, "experience", index)} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-3 relative cursor-grab">
                    <div className="flex justify-end gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveResumeItem("experience", index, -1)} className="rounded p-1 text-[var(--text-muted)] disabled:opacity-30" aria-label="Move job up"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" disabled={index === resumeData.experience.length - 1} onClick={() => moveResumeItem("experience", index, 1)} className="rounded p-1 text-[var(--text-muted)] disabled:opacity-30" aria-label="Move job down"><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" onClick={() => removeExperience(index)} className="rounded p-1 text-[var(--text-muted)] hover:text-rose-600" title="Remove Job"><Trash2 className="w-4 h-4" /></button>
                    </div>

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
                          placeholder="2024-01-01 - Present"
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
                    {!isGuest && !profileSuggestions?.experience.some((item) => item.id === exp.id) && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void saveExperienceToProfile(index)}>
                        Save new entry to profile
                      </Button>
                    )}
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
                  <div key={edu.id || index} draggable onDragStart={(event) => startItemDrag(event, "education", index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, "education", index)} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-2xl space-y-3 relative cursor-grab">
                    <div className="flex justify-end gap-1">
                      <button type="button" disabled={index === 0} onClick={() => moveResumeItem("education", index, -1)} className="rounded p-1 text-[var(--text-muted)] disabled:opacity-30" aria-label="Move education up"><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" disabled={index === (resumeData.education?.length || 0) - 1} onClick={() => moveResumeItem("education", index, 1)} className="rounded p-1 text-[var(--text-muted)] disabled:opacity-30" aria-label="Move education down"><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" onClick={() => removeEducation(index)} className="rounded p-1 text-[var(--text-muted)] hover:text-rose-600" title="Remove Education"><Trash2 className="w-4 h-4" /></button>
                    </div>

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
                          placeholder="2020-09-01 - 2024-06-01"
                          onChange={(e) => handleEducationChange(index, "period", e.target.value)}
                          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[var(--text-muted)] block mb-1 font-semibold">Grade</label>
                      <input type="text" value={edu.grade || ""} onChange={(event) => handleEducationChange(index, "grade", event.target.value)} className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-lg p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                    </div>
                    {!isGuest && !profileSuggestions?.education.some((item) => item.id === edu.id) && (
                      <Button type="button" variant="secondary" size="sm" onClick={() => void saveEducationToProfile(index)}>
                        Save new entry to profile
                      </Button>
                    )}
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
                        void addSkill((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                    className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                  />
                  <button
                    onClick={() => {
                      const el = document.getElementById("skill-input") as HTMLInputElement;
                      if (el) {
                        void addSkill(el.value);
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
                      <button type="button" disabled={index === 0} onClick={(event) => { event.stopPropagation(); const values = [...resumeData.skills]; [values[index - 1], values[index]] = [values[index]!, values[index - 1]!]; handleFieldChange("skills", values); }} className="disabled:opacity-30" aria-label={`Move ${skill} left`}><ArrowUp className="h-3 w-3 -rotate-90" /></button>
                      <button type="button" disabled={index === resumeData.skills.length - 1} onClick={(event) => { event.stopPropagation(); const values = [...resumeData.skills]; [values[index], values[index + 1]] = [values[index + 1]!, values[index]!]; handleFieldChange("skills", values); }} className="disabled:opacity-30" aria-label={`Move ${skill} right`}><ArrowDown className="h-3 w-3 -rotate-90" /></button>
                      <button type="button" onClick={(event) => { event.stopPropagation(); removeSkill(index); }} className="hover:text-rose-600" aria-label={`Remove ${skill}`}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="space-y-3 border-t border-[var(--border)] pt-4">
                  <h3 className="font-extrabold text-sm text-[var(--text)]">Languages</h3>
                  <div className="flex gap-2">
                    <input value={newLanguage} onChange={(event) => setNewLanguage(event.target.value)} placeholder="e.g. English" className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2 text-[var(--text)] outline-none focus:border-[var(--primary)]" />
                    <Button type="button" size="sm" onClick={() => { void addSkill(newLanguage, "Language"); setNewLanguage(""); }} disabled={!newLanguage.trim()}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.languages.map((language, index) => (
                      <span key={`${language}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-[var(--primary-tint)] px-3 py-1 font-semibold text-[var(--primary)]">
                        {language}
                        <button type="button" onClick={() => { markDirty(); setResumeData((current) => ({ ...current, languages: current.languages.filter((_, itemIndex) => itemIndex !== index) })); }} aria-label={`Remove ${language}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "more" && (
              <div className="space-y-6">
                <section className="space-y-3">
                  <h3 className="font-extrabold text-sm text-[var(--text)]">Projects</h3>
                  <input value={newProject.name} onChange={(event) => setNewProject((current) => ({ ...current, name: event.target.value }))} placeholder="Project name" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" />
                  <textarea value={newProject.description} onChange={(event) => setNewProject((current) => ({ ...current, description: event.target.value }))} placeholder="Description" rows={2} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" />
                  <ValidatedUrlInput value={newProject.url} onValueChange={(url) => setNewProject((current) => ({ ...current, url }))} placeholder="https://project.example" maxLength={2048} aria-label="Project URL" />
                  <input value={newProject.technologies} onChange={(event) => setNewProject((current) => ({ ...current, technologies: event.target.value }))} placeholder="Technologies, comma separated" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" />
                  <Button type="button" size="sm" onClick={() => void addProjectToResumeAndProfile()} disabled={!newProject.name.trim()}>
                    {isGuest ? "Add to resume" : "Add to resume and profile"}
                  </Button>
                  {(resumeData.projects || []).map((project, index) => (
                    <div key={project.id || index} draggable onDragStart={(event) => startItemDrag(event, "projects", index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, "projects", index)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 space-y-2 cursor-grab">
                      <div className="flex justify-end gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveResumeItem("projects", index, -1)} aria-label="Move project up" className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" disabled={index === (resumeData.projects?.length || 0) - 1} onClick={() => moveResumeItem("projects", index, 1)} aria-label="Move project down" className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                        <button type="button" onClick={() => { markDirty(); setResumeData((current) => ({ ...current, projects: (current.projects || []).filter((_, itemIndex) => itemIndex !== index) })); }} aria-label="Remove project"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <input value={project.name} onChange={(event) => { const values = [...(resumeData.projects || [])]; values[index] = { ...project, name: event.target.value }; handleFieldChange("projects", values); }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 font-bold" />
                      <textarea value={project.description} onChange={(event) => { const values = [...(resumeData.projects || [])]; values[index] = { ...project, description: event.target.value }; handleFieldChange("projects", values); }} rows={2} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2" />
                      <ValidatedUrlInput value={project.url || ""} onValueChange={(url) => { const values = [...(resumeData.projects || [])]; values[index] = { ...project, url: url || undefined }; handleFieldChange("projects", values); }} placeholder="Project URL" maxLength={2048} aria-label={`${project.name || "Project"} URL`} />
                      <input value={project.technologies.join(", ")} onChange={(event) => { const values = [...(resumeData.projects || [])]; values[index] = { ...project, technologies: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }; handleFieldChange("projects", values); }} placeholder="Technologies" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2" />
                    </div>
                  ))}
                </section>

                <section className="space-y-3 border-t border-[var(--border)] pt-5">
                  <h3 className="font-extrabold text-sm text-[var(--text)]">Certificates</h3>
                  <input value={newCertificate.title} onChange={(event) => setNewCertificate((current) => ({ ...current, title: event.target.value }))} placeholder="Certificate title" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" />
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newCertificate.issuer} onChange={(event) => setNewCertificate((current) => ({ ...current, issuer: event.target.value }))} placeholder="Issuer" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" />
                    <input type="date" value={newCertificate.date} onChange={(event) => setNewCertificate((current) => ({ ...current, date: event.target.value }))} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" aria-label="Certificate date" />
                  </div>
                  <ValidatedUrlInput value={newCertificate.url} onValueChange={(url) => setNewCertificate((current) => ({ ...current, url }))} placeholder="Credential URL" maxLength={2048} aria-label="Credential URL" />
                  <Button type="button" size="sm" onClick={() => void addCertificateToResumeAndProfile()} disabled={!newCertificate.title.trim()}>
                    {isGuest ? "Add to resume" : "Add to resume and profile"}
                  </Button>
                  {(resumeData.certificates || []).map((certificate, index) => (
                    <div key={certificate.id || index} draggable onDragStart={(event) => startItemDrag(event, "certificates", index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, "certificates", index)} className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 cursor-grab">
                      <div className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveResumeItem("certificates", index, -1)} aria-label="Move certificate up" className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" disabled={index === (resumeData.certificates?.length || 0) - 1} onClick={() => moveResumeItem("certificates", index, 1)} aria-label="Move certificate down" className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                        <button type="button" onClick={() => { markDirty(); setResumeData((current) => ({ ...current, certificates: (current.certificates || []).filter((_, itemIndex) => itemIndex !== index) })); }} aria-label="Remove certificate"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <input value={certificate.title} onChange={(event) => { const values = [...(resumeData.certificates || [])]; values[index] = { ...certificate, title: event.target.value }; handleFieldChange("certificates", values); }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 font-bold" />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={certificate.issuer} onChange={(event) => { const values = [...(resumeData.certificates || [])]; values[index] = { ...certificate, issuer: event.target.value }; handleFieldChange("certificates", values); }} placeholder="Issuer" className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2" />
                        <input type="date" value={certificate.date} onChange={(event) => { const values = [...(resumeData.certificates || [])]; values[index] = { ...certificate, date: event.target.value }; handleFieldChange("certificates", values); }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2" aria-label="Certificate issue date" />
                      </div>
                      <ValidatedUrlInput value={certificate.url || ""} onValueChange={(url) => { const values = [...(resumeData.certificates || [])]; values[index] = { ...certificate, url: url || undefined }; handleFieldChange("certificates", values); }} placeholder="Credential URL" maxLength={2048} aria-label={`${certificate.title || "Certificate"} credential URL`} />
                    </div>
                  ))}
                </section>

                <section className="space-y-3 border-t border-[var(--border)] pt-5">
                  <h3 className="font-extrabold text-sm text-[var(--text)]">Social links</h3>
                  <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                    <input value={newSocialLink.platform} onChange={(event) => setNewSocialLink((current) => ({ ...current, platform: event.target.value }))} placeholder="Platform" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2" />
                    <ValidatedUrlInput value={newSocialLink.url} onValueChange={(url) => setNewSocialLink((current) => ({ ...current, url }))} platform={newSocialLink.platform} placeholder="https://..." required maxLength={2048} aria-label="Social profile URL" />
                  </div>
                  <Button type="button" size="sm" onClick={() => void addSocialLinkToResumeAndProfile()} disabled={!newSocialLink.platform.trim() || !newSocialLink.url.trim()}>
                    {isGuest ? "Add to resume" : "Add to resume and profile"}
                  </Button>
                  {(resumeData.socialLinks || []).map((link, index) => (
                    <div key={link.id || index} draggable onDragStart={(event) => startItemDrag(event, "socialLinks", index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropItem(event, "socialLinks", index)} className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 cursor-grab">
                      <div className="flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveResumeItem("socialLinks", index, -1)} aria-label="Move social link up" className="disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                        <button type="button" disabled={index === (resumeData.socialLinks?.length || 0) - 1} onClick={() => moveResumeItem("socialLinks", index, 1)} aria-label="Move social link down" className="disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                        <button type="button" onClick={() => { markDirty(); setResumeData((current) => ({ ...current, socialLinks: (current.socialLinks || []).filter((_, itemIndex) => itemIndex !== index) })); }} aria-label="Remove social link"><Trash2 className="h-4 w-4" /></button>
                      </div>
                      <div className="grid grid-cols-[0.8fr_1.2fr] gap-2">
                        <input value={link.platform} onChange={(event) => { const values = [...(resumeData.socialLinks || [])]; values[index] = { ...link, platform: event.target.value }; handleFieldChange("socialLinks", values); }} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-2 font-bold" />
                        <ValidatedUrlInput value={link.url} onValueChange={(url) => { const values = [...(resumeData.socialLinks || [])]; values[index] = { ...link, url }; handleFieldChange("socialLinks", values); }} platform={link.platform} required maxLength={2048} aria-label={`${link.platform || "Social"} profile URL`} />
                      </div>
                    </div>
                  ))}
                </section>
              </div>
            )}

            {!isGuest && activeTab === "ai" && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--text)]">AI follow-up edit</h3>
                  <p className="mt-1 text-[11px] text-[var(--text-muted)]">The server combines this instruction with your saved profile and current resume. Nothing changes until you apply the proposal.</p>
                </div>
                {aiError && <Alert variant="error">{aiError}</Alert>}
                <textarea value={aiInstruction} onChange={(event) => setAiInstruction(event.target.value)} rows={4} placeholder="Make the summary more concise without inventing facts." className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 outline-none focus:border-[var(--primary)]" />
                <textarea value={aiJobDescription} onChange={(event) => setAiJobDescription(event.target.value)} rows={4} placeholder="Optional target job description" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 outline-none focus:border-[var(--primary)]" />
                <textarea value={aiReferenceLinks} onChange={(event) => setAiReferenceLinks(event.target.value)} rows={3} placeholder="Optional public references to read, one URL per line" className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 outline-none focus:border-[var(--primary)]" />
                {!editingResumeId && <Alert variant="info">Wait for the first autosave before requesting an AI edit.</Alert>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => void requestAiProposal()} loading={aiBusy} loadingLabel="Creating proposal..." disabled={!editingResumeId || !aiInstruction.trim() || aiBusy}><Sparkles className="h-4 w-4" />Create proposal</Button>
                  {aiUndoData && <Button type="button" variant="secondary" onClick={undoAiProposal}><Undo2 className="h-4 w-4" />Undo last AI change</Button>}
                </div>
                {aiProposal && (
                  <div className="space-y-3 rounded-2xl border border-[var(--primary)] bg-[var(--primary-tint)] p-3">
                    <p className="font-bold">Proposal ready</p>
                    <div className="h-80 overflow-auto rounded-xl border border-[var(--border)] bg-white">
                      <ResumePreview zoomPercent={50}>
                        <ResumeDocument
                          data={aiProposal.resume_data}
                          elementStyles={aiProposal.resume_data.elementStyles}
                          templateId={activeTemplateId === "ai" ? "1" : activeTemplateId}
                        />
                      </ResumePreview>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="secondary" onClick={() => setAiProposal(null)}>Discard</Button>
                      <Button type="button" onClick={applyAiProposal}>Apply proposal</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Live Preview Canvas Area (Isolatable for PDF Download) */}
        <div className="editor-preview-panel min-h-[42rem] min-w-0 flex-1 bg-[var(--bg)] lg:min-h-0">
          <ResumePreview zoomPercent={zoomLevel}>
            <div id="resume-canvas-container">
            {renderSelectedTemplate()}
            </div>
          </ResumePreview>
        </div>
      </div>
      <ConfirmDialog
        open={deletePageIndex !== null}
        title={`Delete page ${deletePageIndex === null ? "" : deletePageIndex + 1}?`}
        description="All resume sections placed on this generated page will be removed. Shared name and contact details are kept because they appear on every page."
        onClose={() => setDeletePageIndex(null)}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeletePageIndex(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDeletePage}>Delete page</Button>
        </div>
      </ConfirmDialog>
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
      <ResumePrintRoot
        data={{ ...resumeData, elementStyles }}
        templateId={activeTemplateId === "ai" ? "1" : activeTemplateId}
      />
    </div>
  );
}
