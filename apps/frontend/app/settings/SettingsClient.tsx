"use client";

import {
  Award,
  Briefcase,
  Camera,
  ExternalLink,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  User as UserIcon,
  Wrench,
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { LoadingState } from "@/components/common/LoadingState";
import { PageHeader } from "@/components/common/PageHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AvatarCropDialog } from "@/components/profile/AvatarCropDialog";
import { Alert } from "@/components/feedback/Alert";
import { toast } from "@/components/feedback/Toast";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Checkbox } from "@/components/ui/Checkbox";
import { FileUpload, type FileUploadStatus } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Tabs } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";
import { ValidatedInput } from "@/components/ui/ValidatedInput";
import { ValidatedUrlInput } from "@/components/ui/ValidatedUrlInput";
import {
  normalizeEmail,
  normalizePlainText,
  normalizeUrl,
  validateDate,
  validateEmail,
  validateEndDate,
  validateName,
  validateText,
} from "@/lib/validation";
import type { User as UserType } from "@/modules/auth/types";
import { PROFILE_UPDATED_EVENT, type ProfileUpdatedDetail } from "@/modules/profile/events";
import type { Certificate } from "@/modules/certificates/types";
import { createCertificate, deleteCertificate, updateCertificate, uploadCertificate } from "@/modules/certificates/api";
import { createEducation, deleteEducation, updateEducation } from "@/modules/education/api";
import type { Education } from "@/modules/education/types";
import { createExperience, deleteExperience, updateExperience } from "@/modules/experience/api";
import type { Experience } from "@/modules/experience/types";
import { profileApi } from "@/modules/profile/api";
import type { ProfileResponse } from "@/modules/profile/types";
import { createProject, deleteProject, updateProject } from "@/modules/projects/api";
import type { Project } from "@/modules/projects/types";
import { createSkill, deleteSkill, updateSkill } from "@/modules/skills/api";
import type { Skill } from "@/modules/skills/types";
import { createSocialLink, deleteSocialLink, updateSocialLink } from "@/modules/social-links/api";
import type { SocialLink } from "@/modules/social-links/types";

interface SettingsClientProps {
  user: UserType;
  initialProfile?: ProfileResponse | null;
}

type TabId = "profile" | "social" | "education" | "experience" | "skills" | "certificates" | "projects";
type DeleteTarget = { type: Exclude<TabId, "profile"> | "skill"; id: string; label: string };
type EditingTarget = { type: Exclude<TabId, "profile">; id: string };
type PendingAction = Exclude<TabId, "profile"> | "profile" | "refresh" | "avatar" | "delete" | null;
type ProfileSaveStatus = "idle" | "saving" | "success" | "error";

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: "profile", label: "Profile", icon: <UserIcon size={16} aria-hidden="true" /> },
  { id: "social", label: "Social", icon: <LinkIcon size={16} aria-hidden="true" /> },
  { id: "education", label: "Education", icon: <GraduationCap size={16} aria-hidden="true" /> },
  { id: "experience", label: "Experience", icon: <Briefcase size={16} aria-hidden="true" /> },
  { id: "skills", label: "Skills", icon: <Wrench size={16} aria-hidden="true" /> },
  { id: "certificates", label: "Certificates", icon: <Award size={16} aria-hidden="true" /> },
  { id: "projects", label: "Projects", icon: <FileText size={16} aria-hidden="true" /> },
];

function splitName(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
}

const emptyEducation = {
  institute_name: "",
  degree: "",
  field_of_study: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
  grade: "",
};
const emptyExperience = {
  company_name: "",
  job_title: "",
  location: "",
  start_date: "",
  end_date: "",
  is_current: false,
  description: "",
};

export default function SettingsClient({ user, initialProfile }: SettingsClientProps) {
  const initialName = splitName(user.name);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [loading, setLoading] = useState(initialProfile === undefined);
  const [loadError, setLoadError] = useState(initialProfile === null ? "Your saved profile could not be loaded. You can retry, or save the personal details below to create it." : "");
  const [actionError, setActionError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [profileSaveStatus, setProfileSaveStatus] = useState<ProfileSaveStatus>("idle");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);
  const [hasProfile, setHasProfile] = useState(Boolean(initialProfile));

  const [profileForm, setProfileForm] = useState({
    first_name: initialProfile?.personal.first_name || initialProfile?.personal.name || initialName.firstName,
    last_name: initialProfile?.personal.last_name || initialName.lastName,
    email: initialProfile?.personal.email || user.email,
    phone: initialProfile?.personal.phone || user.number || "",
    address: initialProfile?.personal.address || "",
    city: initialProfile?.personal.city || "",
    avatar_url: initialProfile?.personal.avatar_url || "",
    professional_title: initialProfile?.personal.professional_title || "",
    summary: initialProfile?.personal.summary || "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarCropFile, setAvatarCropFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<FileUploadStatus>("idle");
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [avatarError, setAvatarError] = useState("");
  const avatarController = useRef<AbortController | null>(null);

  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initialProfile?.social_links || []);
  const [education, setEducation] = useState<Education[]>(initialProfile?.education || []);
  const [experience, setExperience] = useState<Experience[]>(initialProfile?.experience || []);
  const [skills, setSkills] = useState<Skill[]>(initialProfile?.skills || []);
  const [certificates, setCertificates] = useState<Certificate[]>(initialProfile?.certificates || []);
  const [projects, setProjects] = useState<Project[]>(initialProfile?.projects || []);

  const [socialForm, setSocialForm] = useState({ platform_name: "", profile_url: "" });
  const [educationForm, setEducationForm] = useState(emptyEducation);
  const [experienceForm, setExperienceForm] = useState(emptyExperience);
  const [skillForm, setSkillForm] = useState({ name: "", category: "", level: "" });
  const [certificateForm, setCertificateForm] = useState({
    title: "",
    category: "",
    field: "",
    file_url: "",
    issue_date: "",
    expiration_date: "",
  });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [editingCertificateOriginalUrl, setEditingCertificateOriginalUrl] = useState("");
  const [certificateProgress, setCertificateProgress] = useState(0);
  const [certificateStatus, setCertificateStatus] = useState<FileUploadStatus>("idle");
  const certificateController = useRef<AbortController | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    link: "",
    github_url: "",
    technologies: "",
  });

  const loadProfileData = async () => {
    setLoading(true);
    setPendingAction("refresh");
    setLoadError("");
    setActionError("");
    try {
      const profile = await profileApi.getProfile();
      setHasProfile(true);
      setProfileForm({
        first_name: profile.personal.first_name || profile.personal.name || "",
        last_name: profile.personal.last_name || "",
        email: profile.personal.email || user.email,
        phone: profile.personal.phone || user.number || "",
        address: profile.personal.address || "",
        city: profile.personal.city || "",
        avatar_url: profile.personal.avatar_url || "",
        professional_title: profile.personal.professional_title || "",
        summary: profile.personal.summary || "",
      });
      setSocialLinks(profile.social_links);
      setEducation(profile.education);
      setExperience(profile.experience);
      setSkills(profile.skills);
      setCertificates(profile.certificates);
      setProjects(profile.projects);
    } catch {
      setHasProfile(false);
      setLoadError("Your saved profile could not be loaded. You can retry, or save the personal details below to create it.");
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  useEffect(() => {
    if (initialProfile === undefined) void loadProfileData();
    return () => {
      avatarController.current?.abort();
      certificateController.current?.abort();
    };
  }, [initialProfile]);

  const fail = (error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    setActionError(message);
    toast.error(message);
  };

  const cancelEditing = () => {
    setEditingTarget(null);
    setSocialForm({ platform_name: "", profile_url: "" });
    setEducationForm(emptyEducation);
    setExperienceForm(emptyExperience);
    setSkillForm({ name: "", category: "", level: "" });
    setCertificateForm({ title: "", category: "", field: "", file_url: "", issue_date: "", expiration_date: "" });
    setCertificateFile(null);
    setEditingCertificateOriginalUrl("");
    setCertificateStatus("idle");
    setProjectForm({ name: "", description: "", link: "", github_url: "", technologies: "" });
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (profileSaveStatus === "saving") return;
    setPendingAction("profile");
    setProfileSaveStatus("saving");
    setActionError("");
    try {
      const saved = await profileApi.upsertPersonal({
        first_name: normalizePlainText(profileForm.first_name, 100),
        last_name: normalizePlainText(profileForm.last_name, 100),
        email: normalizeEmail(profileForm.email),
        phone: profileForm.phone,
        address: normalizePlainText(profileForm.address, 1000),
        city: normalizePlainText(profileForm.city, 100),
        professional_title: normalizePlainText(profileForm.professional_title, 255),
        summary: normalizePlainText(profileForm.summary, 4000),
      });
      setHasProfile(true);
      setProfileForm((current) => ({
        ...current,
        first_name: saved.first_name || saved.name || current.first_name,
        last_name: saved.last_name || "",
        email: saved.email || current.email,
        phone: saved.phone || current.phone,
        address: saved.address || "",
        city: saved.city || "",
        avatar_url: saved.avatar_url || current.avatar_url,
        professional_title: saved.professional_title || "",
        summary: saved.summary || "",
      }));
      notifyProfileUpdated({
        displayName: [
          saved.first_name || saved.name || profileForm.first_name,
          saved.last_name || profileForm.last_name,
        ].filter(Boolean).join(" "),
        avatarUrl: saved.avatar_url || profileForm.avatar_url,
      });
      setProfileSaveStatus("success");
      toast.success("Your profile changes are saved.", "Profile updated");
      window.setTimeout(() => setProfileSaveStatus("idle"), 2200);
    } catch (error) {
      setProfileSaveStatus("error");
      fail(error, "Unable to save profile.");
    } finally {
      setPendingAction(null);
    }
  };

  const uploadAvatar = async (selectedFile: File | null = avatarFile) => {
    if (!selectedFile || avatarStatus === "uploading") return;
    if (!hasProfile) {
      const message = "Save your personal profile before uploading an avatar.";
      setActionError(message);
      toast.warning(message);
      return;
    }
    const controller = new AbortController();
    avatarController.current = controller;
    setPendingAction("avatar");
    setAvatarStatus("uploading");
    setAvatarProgress(0);
    setAvatarError("");
    setActionError("");
    try {
      const uploaded = await profileApi.uploadAvatar(selectedFile, {
        onProgress: setAvatarProgress,
        signal: controller.signal,
      });
      setProfileForm((current) => ({ ...current, avatar_url: uploaded.url }));
      notifyProfileUpdated({ avatarUrl: uploaded.url });
      setAvatarStatus("success");
      setAvatarFile(null);
      toast.success("Your profile photo is updated.");
    } catch (error) {
      if (!controller.signal.aborted) {
        setAvatarStatus("error");
        const message = error instanceof Error ? error.message : "Unable to upload avatar.";
        setAvatarError(message);
        fail(error, "Unable to upload avatar.");
      }
    } finally {
      avatarController.current = null;
      setPendingAction(null);
    }
  };

  const addSocial = async (event: FormEvent) => {
    event.preventDefault();
    setPendingAction("social");
    setActionError("");
    try {
      const editingId = editingTarget?.type === "social" ? editingTarget.id : null;
      const payload = {
        platform_name: normalizePlainText(socialForm.platform_name, 50),
        profile_url: normalizeUrl(socialForm.profile_url),
      };
      const saved = editingId
        ? await updateSocialLink(editingId, payload)
        : await createSocialLink(payload);
      setSocialLinks((current) => editingId
        ? current.map((item) => item.id === editingId ? saved : item)
        : [saved, ...current]);
      cancelEditing();
      toast.success(editingId ? "Social link updated." : "Social link added.");
    } catch (error) {
      fail(error, "Unable to add social link.");
    } finally {
      setPendingAction(null);
    }
  };

  const addEducation = async (event: FormEvent) => {
    event.preventDefault();
    setPendingAction("education");
    setActionError("");
    try {
      const editingId = editingTarget?.type === "education" ? editingTarget.id : null;
      const payload = {
        ...educationForm,
        end_date: educationForm.is_current ? null : educationForm.end_date || null,
      };
      const saved = editingId
        ? await updateEducation(editingId, payload)
        : await createEducation(payload);
      setEducation((current) => editingId
        ? current.map((item) => item.id === editingId ? saved : item)
        : [saved, ...current]);
      cancelEditing();
      toast.success(editingId ? "Education entry updated." : "Education entry added.");
    } catch (error) {
      fail(error, "Unable to add education.");
    } finally {
      setPendingAction(null);
    }
  };

  const addExperience = async (event: FormEvent) => {
    event.preventDefault();
    setPendingAction("experience");
    setActionError("");
    try {
      const editingId = editingTarget?.type === "experience" ? editingTarget.id : null;
      const payload = {
        ...experienceForm,
        institute_name: experienceForm.company_name,
        end_date: experienceForm.is_current ? null : experienceForm.end_date || null,
      };
      const saved = editingId
        ? await updateExperience(editingId, payload)
        : await createExperience(payload);
      setExperience((current) => editingId
        ? current.map((item) => item.id === editingId ? saved : item)
        : [saved, ...current]);
      cancelEditing();
      toast.success(editingId ? "Experience entry updated." : "Experience entry added.");
    } catch (error) {
      fail(error, "Unable to add experience.");
    } finally {
      setPendingAction(null);
    }
  };

  const addSkill = async (event: FormEvent) => {
    event.preventDefault();
    setPendingAction("skills");
    setActionError("");
    try {
      const editingId = editingTarget?.type === "skills" ? editingTarget.id : null;
      const saved = editingId
        ? await updateSkill(editingId, skillForm)
        : await createSkill(skillForm);
      setSkills((current) => editingId
        ? current.map((item) => item.id === editingId ? saved : item)
        : [saved, ...current]);
      cancelEditing();
      toast.success(editingId ? "Skill updated." : "Skill added.");
    } catch (error) {
      fail(error, "Unable to add skill.");
    } finally {
      setPendingAction(null);
    }
  };

  const addCertificate = async (event: FormEvent) => {
    event.preventDefault();
    const title = certificateForm.title.trim() || certificateFile?.name || "";
    if (!title) return;
    setPendingAction("certificates");
    setActionError("");
    try {
      const editingId = editingTarget?.type === "certificates" ? editingTarget.id : null;
      let created: Certificate;
      if (editingId) {
        created = await updateCertificate(editingId, {
          title,
          category: certificateForm.category || null,
          field: certificateForm.field || null,
          file_url: certificateForm.file_url !== editingCertificateOriginalUrl
            ? certificateForm.file_url ? normalizeUrl(certificateForm.file_url) : null
            : undefined,
          issue_date: certificateForm.issue_date || null,
          expiration_date: certificateForm.expiration_date || null,
        });
      } else if (certificateFile) {
        const controller = new AbortController();
        certificateController.current = controller;
        setCertificateStatus("uploading");
        setCertificateProgress(0);
        created = await uploadCertificate({
          file: certificateFile,
          title,
          category: certificateForm.category || "Certificate",
          field: certificateForm.field || undefined,
        }, {
          onProgress: setCertificateProgress,
          signal: controller.signal,
        });
        setCertificateStatus("success");
      } else {
        created = await createCertificate({
          title,
          category: certificateForm.category || undefined,
          field: certificateForm.field || undefined,
          file_url: certificateForm.file_url ? normalizeUrl(certificateForm.file_url) : undefined,
          issue_date: certificateForm.issue_date || undefined,
          expiration_date: certificateForm.expiration_date || undefined,
        });
      }
      setCertificates((current) => editingId
        ? current.map((item) => item.id === editingId ? created : item)
        : [created, ...current]);
      cancelEditing();
      toast.success(editingId ? "Certificate updated." : "Certificate added.");
    } catch (error) {
      const aborted = certificateController.current?.signal.aborted;
      if (!aborted) {
        setCertificateStatus("error");
        fail(error, "Unable to add certificate.");
      }
    } finally {
      certificateController.current = null;
      setPendingAction(null);
    }
  };

  const addProject = async (event: FormEvent) => {
    event.preventDefault();
    setPendingAction("projects");
    setActionError("");
    try {
      const editingId = editingTarget?.type === "projects" ? editingTarget.id : null;
      const payload = {
        name: projectForm.name,
        description: projectForm.description || null,
        link: projectForm.link ? normalizeUrl(projectForm.link) : null,
        github_url: projectForm.github_url ? normalizeUrl(projectForm.github_url) : null,
        technologies: projectForm.technologies
          ? projectForm.technologies.split(",").map((item) => item.trim()).filter(Boolean)
          : null,
      };
      const saved = editingId
        ? await updateProject(editingId, payload)
        : await createProject(payload);
      setProjects((current) => editingId
        ? current.map((item) => item.id === editingId ? saved : item)
        : [saved, ...current]);
      cancelEditing();
      toast.success(editingId ? "Project updated." : "Project added.");
    } catch (error) {
      fail(error, "Unable to add project.");
    } finally {
      setPendingAction(null);
    }
  };

  const editSocial = (item: SocialLink) => {
    cancelEditing();
    setEditingTarget({ type: "social", id: item.id });
    setSocialForm({ platform_name: item.platform_name, profile_url: item.profile_url });
  };

  const editEducation = (item: Education) => {
    cancelEditing();
    setEditingTarget({ type: "education", id: item.id });
    setEducationForm({
      institute_name: item.institute_name,
      degree: item.degree || "",
      field_of_study: item.field_of_study || "",
      start_date: item.start_date?.slice(0, 10) || "",
      end_date: item.end_date?.slice(0, 10) || "",
      is_current: Boolean(item.is_current),
      description: item.description || "",
      grade: item.grade || "",
    });
  };

  const editExperience = (item: Experience) => {
    cancelEditing();
    setEditingTarget({ type: "experience", id: item.id });
    setExperienceForm({
      company_name: item.company_name || item.institute_name || "",
      job_title: item.job_title,
      location: item.location || "",
      start_date: item.start_date?.slice(0, 10) || "",
      end_date: item.end_date?.slice(0, 10) || "",
      is_current: Boolean(item.is_current),
      description: item.description || "",
    });
  };

  const editSkill = (item: Skill) => {
    cancelEditing();
    setEditingTarget({ type: "skills", id: item.id });
    setSkillForm({ name: item.name, category: item.category || "", level: item.level || "" });
  };

  const editCertificate = (item: Certificate) => {
    cancelEditing();
    setEditingTarget({ type: "certificates", id: item.id });
    setEditingCertificateOriginalUrl(item.file_url || "");
    setCertificateForm({
      title: item.title,
      category: item.category || "",
      field: item.field || "",
      file_url: item.file_url || "",
      issue_date: item.issue_date?.slice(0, 10) || "",
      expiration_date: item.expiration_date?.slice(0, 10) || "",
    });
  };

  const editProject = (item: Project) => {
    cancelEditing();
    setEditingTarget({ type: "projects", id: item.id });
    setProjectForm({
      name: item.name,
      description: item.description || "",
      link: item.link || "",
      github_url: item.github_url || "",
      technologies: item.technologies?.join(", ") || "",
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget || pendingAction === "delete") return;
    setPendingAction("delete");
    setActionError("");
    try {
      if (deleteTarget.type === "social") {
        await deleteSocialLink(deleteTarget.id);
        setSocialLinks((current) => current.filter((item) => item.id !== deleteTarget.id));
      } else if (deleteTarget.type === "education") {
        await deleteEducation(deleteTarget.id);
        setEducation((current) => current.filter((item) => item.id !== deleteTarget.id));
      } else if (deleteTarget.type === "experience") {
        await deleteExperience(deleteTarget.id);
        setExperience((current) => current.filter((item) => item.id !== deleteTarget.id));
      } else if (deleteTarget.type === "skill") {
        await deleteSkill(deleteTarget.id);
        setSkills((current) => current.filter((item) => item.id !== deleteTarget.id));
      } else if (deleteTarget.type === "certificates") {
        await deleteCertificate(deleteTarget.id);
        setCertificates((current) => current.filter((item) => item.id !== deleteTarget.id));
      } else if (deleteTarget.type === "projects") {
        await deleteProject(deleteTarget.id);
        setProjects((current) => current.filter((item) => item.id !== deleteTarget.id));
      }
      if (editingTarget?.id === deleteTarget.id) cancelEditing();
      toast.success("The item was removed from your profile.");
      setDeleteTarget(null);
    } catch (error) {
      fail(error, "Unable to delete item.");
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) return <LoadingState label="Loading profile data..." cards={2} />;

  const displayName = [profileForm.first_name, profileForm.last_name].filter(Boolean).join(" ") || user.name || "Your profile";

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Profile source"
        icon={<UserIcon size={15} aria-hidden="true" />}
        title="Profile & resume data"
        description="Keep one reliable profile that can be copied into each new resume. Existing resumes remain independent."
        actions={
          <Button variant="secondary" onClick={() => void loadProfileData()} loading={pendingAction === "refresh"} loadingLabel="Refreshing...">
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
        }
      />

      {loadError && <Alert variant="warning">{loadError}</Alert>}
      {actionError && <Alert variant="error">{actionError}</Alert>}

      <Card padding="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar src={profileForm.avatar_url} alt={displayName} fallback={displayName.slice(0, 1)} size={88} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-bold text-[var(--text)]">{displayName}</h2>
              <Badge variant={hasProfile ? "success" : "warning"}>{hasProfile ? "Saved profile" : "Profile setup needed"}</Badge>
            </div>
            <div className="mt-2 grid gap-1 text-sm text-[var(--text-muted)] sm:grid-cols-2">
              <span>{profileForm.email || "No email saved"}</span>
              <span>{profileForm.phone || "No phone saved"}</span>
              <span className="sm:col-span-2">{[profileForm.city, profileForm.address].filter(Boolean).join(", ") || "No location saved"}</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        ariaLabel="Profile sections"
        items={tabs}
        value={activeTab}
        onChange={(tab) => {
          if (tab !== activeTab) cancelEditing();
          setActiveTab(tab);
        }}
      />

      {activeTab === "profile" && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card padding="lg">
            <form onSubmit={saveProfile} className="form-stack">
              <div>
                <h2 className="text-lg font-bold">Personal information</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">These fields become the starting point for new resumes.</p>
              </div>
              <div className="form-grid">
                <ValidatedInput label="First name" value={profileForm.first_name} onValueChange={(first_name) => setProfileForm({ ...profileForm, first_name })} validate={(value) => validateName(value, "First name")} normalize={(value) => normalizePlainText(value, 100)} required autoFocus maxLength={100} />
                <ValidatedInput label="Last name" value={profileForm.last_name} onValueChange={(last_name) => setProfileForm({ ...profileForm, last_name })} validate={(value) => validateName(value, "Last name", false)} normalize={(value) => normalizePlainText(value, 100)} optional maxLength={100} />
                <ValidatedInput label="Email" type="email" value={profileForm.email} onValueChange={(email) => setProfileForm({ ...profileForm, email })} validate={validateEmail} normalize={normalizeEmail} required autoComplete="email" maxLength={254} />
                <PhoneInput label="Phone" value={profileForm.phone} onValueChange={(phone) => setProfileForm({ ...profileForm, phone })} required />
                <Input label="City" value={profileForm.city} onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })} maxLength={100} />
                <Input label="Address" value={profileForm.address} onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })} maxLength={1000} />
                <Input label="Professional title" value={profileForm.professional_title} onChange={(event) => setProfileForm({ ...profileForm, professional_title: event.target.value })} placeholder="Senior Product Designer" maxLength={255} />
              </div>
              <Textarea label="Professional summary" optional value={profileForm.summary} onChange={(event) => setProfileForm({ ...profileForm, summary: event.target.value })} rows={5} maxLength={4000} showCount />
              <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
                <span className="text-xs font-semibold text-[var(--text-muted)]" aria-live="polite">
                  {profileSaveStatus === "success" ? "Saved ✓" : profileSaveStatus === "error" ? "Save failed" : ""}
                </span>
                <Button
                  type="submit"
                  loading={profileSaveStatus === "saving"}
                  loadingLabel="Saving..."
                  disabled={!profileForm.first_name || !profileForm.email || !profileForm.phone}
                >
                  {profileSaveStatus === "success" ? "Saved ✓" : "Save profile"}
                </Button>
              </div>
            </form>
          </Card>

          <Card padding="md">
            <h2 className="text-base font-bold">Profile photo</h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Used only by templates that support a headshot.</p>
            <div className="mt-4 flex justify-center">
              <Avatar
                src={profileForm.avatar_url}
                alt={`${profileForm.first_name} ${profileForm.last_name}`.trim() || "Profile photo"}
                fallback={`${profileForm.first_name.slice(0, 1)}${profileForm.last_name.slice(0, 1)}`.toUpperCase()}
                size={88}
              />
            </div>
            <div className="mt-4">
              <FileUpload
                label="Choose a profile image"
                helperText="JPG, PNG, or WEBP up to 10 MB"
                accept="image/png,image/jpeg,image/webp"
                file={avatarFile}
                status={avatarStatus}
                progress={avatarProgress}
                error={avatarError}
                onFileChange={(file) => {
                  if (!file) {
                    setAvatarFile(null);
                    setAvatarError("");
                    setAvatarStatus("idle");
                    return;
                  }
                  const validTypes = ["image/jpeg", "image/png", "image/webp"];
                  if (!validTypes.includes(file.type)) {
                    setAvatarError("Choose a JPG, PNG, or WEBP image.");
                    setAvatarStatus("error");
                    return;
                  }
                  if (file.size > 10 * 1024 * 1024) {
                    setAvatarError("The profile image must be 10 MB or smaller.");
                    setAvatarStatus("error");
                    return;
                  }
                  if (!hasProfile) {
                    setAvatarError("Save your personal profile before uploading a photo.");
                    setAvatarStatus("error");
                    return;
                  }
                  setAvatarError("");
                  setAvatarStatus("idle");
                  setAvatarCropFile(file);
                }}
                onCancel={() => avatarController.current?.abort()}
                onRetry={() => void uploadAvatar()}
              />
            </div>
            <Button className="mt-4" fullWidth onClick={() => void uploadAvatar()} loading={pendingAction === "avatar"} loadingLabel="Uploading..." disabled={!avatarFile}>
              <Camera size={16} aria-hidden="true" />
              Upload photo
            </Button>
          </Card>
          <AvatarCropDialog
            file={avatarCropFile}
            onClose={() => setAvatarCropFile(null)}
            onConfirm={(croppedFile) => {
              setAvatarCropFile(null);
              setAvatarFile(croppedFile);
              void uploadAvatar(croppedFile);
            }}
          />
        </div>
      )}

      {activeTab === "social" && (
        <ProfileSection
          title="Social links"
          description="Add the professional profiles you want available when building a resume."
          form={
            <form onSubmit={addSocial} className="form-grid">
              <ValidatedInput label="Platform" value={socialForm.platform_name} onValueChange={(platform_name) => setSocialForm({ ...socialForm, platform_name })} validate={(value) => validateText(value, { label: "Platform", required: true, minLength: 2, maxLength: 50 })} normalize={(value) => normalizePlainText(value, 50)} placeholder="LinkedIn" required autoFocus maxLength={50} />
              <ValidatedUrlInput label="Profile URL" value={socialForm.profile_url} onValueChange={(profile_url) => setSocialForm({ ...socialForm, profile_url })} platform={socialForm.platform_name} placeholder="https://..." required maxLength={2048} />
              <SubmitButton label={editingTarget?.type === "social" ? "Save link" : "Add link"} loading={pendingAction === "social"} editing={editingTarget?.type === "social"} onCancel={cancelEditing} />
            </form>
          }
          empty={socialLinks.length === 0}
        >
          {socialLinks.map((item) => (
            <DataRow key={item.id} title={item.platform_name} meta={item.profile_url} href={item.profile_url} onEdit={() => editSocial(item)} onDelete={() => setDeleteTarget({ type: "social", id: item.id, label: item.platform_name })} />
          ))}
        </ProfileSection>
      )}

      {activeTab === "education" && (
        <ProfileSection
          title="Education"
          description="Add degrees, programs, and relevant studies."
          form={
            <form onSubmit={addEducation} className="form-stack">
              <div className="form-grid">
                <ValidatedInput label="Institution" value={educationForm.institute_name} onValueChange={(institute_name) => setEducationForm({ ...educationForm, institute_name })} validate={(value) => validateText(value, { label: "Institution", required: true, minLength: 2, maxLength: 255 })} normalize={(value) => normalizePlainText(value, 255)} required autoFocus maxLength={255} />
                <Input label="Degree" value={educationForm.degree} onChange={(event) => setEducationForm({ ...educationForm, degree: event.target.value })} maxLength={255} />
                <Input label="Field of study" value={educationForm.field_of_study} onChange={(event) => setEducationForm({ ...educationForm, field_of_study: event.target.value })} maxLength={255} />
                <Input label="Grade" value={educationForm.grade} onChange={(event) => setEducationForm({ ...educationForm, grade: event.target.value })} maxLength={100} />
                <ValidatedInput label="Start date" type="date" value={educationForm.start_date} onValueChange={(start_date) => setEducationForm({ ...educationForm, start_date })} validate={(value) => validateDate(value, { label: "Start date", required: true })} normalize={(value) => value} required />
                <ValidatedInput label="End date" type="date" value={educationForm.end_date} onValueChange={(end_date) => setEducationForm({ ...educationForm, end_date })} validate={(value) => validateEndDate(value, educationForm.start_date, { current: educationForm.is_current })} normalize={(value) => value} disabled={educationForm.is_current} />
              </div>
              <Checkbox label="I am currently studying here" checked={educationForm.is_current} onChange={(event) => setEducationForm({ ...educationForm, is_current: event.target.checked, end_date: event.target.checked ? "" : educationForm.end_date })} />
              <Textarea label="Description" optional value={educationForm.description} onChange={(event) => setEducationForm({ ...educationForm, description: event.target.value })} rows={3} maxLength={2000} showCount />
              <div className="flex justify-end"><SubmitButton label={editingTarget?.type === "education" ? "Save education" : "Add education"} loading={pendingAction === "education"} editing={editingTarget?.type === "education"} onCancel={cancelEditing} /></div>
            </form>
          }
          empty={education.length === 0}
        >
          {education.map((item) => (
            <DataRow key={item.id} title={item.institute_name} meta={[item.degree || item.field_of_study, formatDateRange(item.start_date, item.end_date, item.is_current)].filter(Boolean).join(" · ")} onEdit={() => editEducation(item)} onDelete={() => setDeleteTarget({ type: "education", id: item.id, label: item.institute_name })} />
          ))}
        </ProfileSection>
      )}

      {activeTab === "experience" && (
        <ProfileSection
          title="Experience"
          description="Keep a master record of roles and achievements to reuse in resumes."
          form={
            <form onSubmit={addExperience} className="form-stack">
              <div className="form-grid">
                <ValidatedInput label="Company" value={experienceForm.company_name} onValueChange={(company_name) => setExperienceForm({ ...experienceForm, company_name })} validate={(value) => validateText(value, { label: "Company", required: true, minLength: 2, maxLength: 255 })} normalize={(value) => normalizePlainText(value, 255)} required autoFocus maxLength={255} />
                <ValidatedInput label="Job title" value={experienceForm.job_title} onValueChange={(job_title) => setExperienceForm({ ...experienceForm, job_title })} validate={(value) => validateText(value, { label: "Job title", required: true, minLength: 2, maxLength: 255 })} normalize={(value) => normalizePlainText(value, 255)} required maxLength={255} />
                <Input label="Location" value={experienceForm.location} onChange={(event) => setExperienceForm({ ...experienceForm, location: event.target.value })} maxLength={255} />
                <ValidatedInput label="Start date" type="date" value={experienceForm.start_date} onValueChange={(start_date) => setExperienceForm({ ...experienceForm, start_date })} validate={(value) => validateDate(value, { label: "Start date", required: true })} normalize={(value) => value} required />
                <ValidatedInput label="End date" type="date" value={experienceForm.end_date} onValueChange={(end_date) => setExperienceForm({ ...experienceForm, end_date })} validate={(value) => validateEndDate(value, experienceForm.start_date, { current: experienceForm.is_current })} normalize={(value) => value} disabled={experienceForm.is_current} />
              </div>
              <Checkbox label="I currently work here" checked={experienceForm.is_current} onChange={(event) => setExperienceForm({ ...experienceForm, is_current: event.target.checked, end_date: event.target.checked ? "" : experienceForm.end_date })} />
              <Textarea label="Highlights and responsibilities" optional value={experienceForm.description} onChange={(event) => setExperienceForm({ ...experienceForm, description: event.target.value })} rows={4} maxLength={4000} showCount />
              <div className="flex justify-end"><SubmitButton label={editingTarget?.type === "experience" ? "Save experience" : "Add experience"} loading={pendingAction === "experience"} editing={editingTarget?.type === "experience"} onCancel={cancelEditing} /></div>
            </form>
          }
          empty={experience.length === 0}
        >
          {experience.map((item) => (
            <DataRow key={item.id} title={item.job_title} meta={[item.company_name || item.institute_name, formatDateRange(item.start_date, item.end_date, item.is_current)].filter(Boolean).join(" · ")} onEdit={() => editExperience(item)} onDelete={() => setDeleteTarget({ type: "experience", id: item.id, label: item.job_title })} />
          ))}
        </ProfileSection>
      )}

      {activeTab === "skills" && (
        <ProfileSection
          title="Skills"
          description="Build a reusable skills library for tailored resumes."
          form={
            <form onSubmit={addSkill} className="form-grid">
              <ValidatedInput label="Skill" value={skillForm.name} onValueChange={(name) => setSkillForm({ ...skillForm, name })} validate={(value) => validateText(value, { label: "Skill", required: true, maxLength: 150 })} normalize={(value) => normalizePlainText(value, 150)} required autoFocus maxLength={150} />
              <Input label="Category" optional value={skillForm.category} onChange={(event) => setSkillForm({ ...skillForm, category: event.target.value })} placeholder="Technical" maxLength={100} />
              <Input label="Level" optional value={skillForm.level} onChange={(event) => setSkillForm({ ...skillForm, level: event.target.value })} placeholder="Advanced" maxLength={50} />
              <SubmitButton label={editingTarget?.type === "skills" ? "Save skill" : "Add skill"} loading={pendingAction === "skills"} editing={editingTarget?.type === "skills"} onCancel={cancelEditing} />
            </form>
          }
          empty={skills.length === 0}
        >
          <div className="flex flex-wrap gap-2">
            {skills.map((item) => (
              <span key={item.id} className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] pl-3 text-sm">
                <span className="font-semibold">{item.name}</span>
                {item.level && <span className="text-xs text-[var(--text-muted)]">· {item.level}</span>}
                <button type="button" className="rounded-full p-2 text-[var(--text-muted)] hover:text-[var(--primary)]" onClick={() => editSkill(item)} aria-label={`Edit ${item.name}`}>
                  <Pencil size={13} aria-hidden="true" />
                </button>
                <button type="button" className="rounded-full p-2 text-[var(--text-muted)] hover:text-[var(--danger)]" onClick={() => setDeleteTarget({ type: "skill", id: item.id, label: item.name })} aria-label={`Delete ${item.name}`}>
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </ProfileSection>
      )}

      {activeTab === "certificates" && (
        <ProfileSection
          title="Certificates"
          description="Save credentials and optional supporting files."
          form={
            <form onSubmit={addCertificate} className="form-stack">
              <div className="form-grid">
                <ValidatedInput label="Certificate name" value={certificateForm.title} onValueChange={(title) => setCertificateForm({ ...certificateForm, title })} validate={(value) => validateText(value, { label: "Certificate name", required: !certificateFile, minLength: 2, maxLength: 255 })} normalize={(value) => normalizePlainText(value, 255)} required={!certificateFile} autoFocus maxLength={255} />
                <Input label="Issuing organization" value={certificateForm.category} onChange={(event) => setCertificateForm({ ...certificateForm, category: event.target.value })} maxLength={255} />
                <Input label="Credential ID" value={certificateForm.field} onChange={(event) => setCertificateForm({ ...certificateForm, field: event.target.value })} maxLength={255} />
                <ValidatedUrlInput label="Credential URL" optional value={certificateForm.file_url} onValueChange={(file_url) => setCertificateForm({ ...certificateForm, file_url })} maxLength={2048} />
                <ValidatedInput label="Issue date" type="date" value={certificateForm.issue_date} onValueChange={(issue_date) => setCertificateForm({ ...certificateForm, issue_date })} validate={(value) => validateDate(value, { label: "Issue date" })} normalize={(value) => value} />
                <ValidatedInput label="Expiration date" type="date" value={certificateForm.expiration_date} onValueChange={(expiration_date) => setCertificateForm({ ...certificateForm, expiration_date })} validate={(value) => validateEndDate(value, certificateForm.issue_date, { label: "Expiration date", allowFuture: true })} normalize={(value) => value} />
              </div>
              {editingTarget?.type !== "certificates" && <FileUpload
                label="Attach a certificate file"
                helperText="Optional PDF, JPG, PNG, or WEBP up to 10 MB"
                accept="application/pdf,image/png,image/jpeg,image/webp"
                file={certificateFile}
                status={certificateStatus}
                progress={certificateProgress}
                onFileChange={(file) => {
                  setCertificateFile(file);
                  setCertificateStatus("idle");
                }}
                onCancel={() => certificateController.current?.abort()}
                onRetry={() => undefined}
              />}
              <div className="flex justify-end"><SubmitButton label={editingTarget?.type === "certificates" ? "Save certificate" : certificateFile ? "Upload certificate" : "Add certificate"} loading={pendingAction === "certificates"} editing={editingTarget?.type === "certificates"} onCancel={cancelEditing} /></div>
            </form>
          }
          empty={certificates.length === 0}
        >
          {certificates.map((item) => (
            <DataRow key={item.id} title={item.title} meta={[item.category, item.field].filter(Boolean).join(" · ")} href={item.file_url || undefined} onEdit={() => editCertificate(item)} onDelete={() => setDeleteTarget({ type: "certificates", id: item.id, label: item.title })} />
          ))}
        </ProfileSection>
      )}

      {activeTab === "projects" && (
        <ProfileSection
          title="Projects"
          description="Capture portfolio work, links, and technologies."
          form={
            <form onSubmit={addProject} className="form-stack">
              <div className="form-grid">
                <ValidatedInput label="Project name" value={projectForm.name} onValueChange={(name) => setProjectForm({ ...projectForm, name })} validate={(value) => validateText(value, { label: "Project name", required: true, minLength: 2, maxLength: 255 })} normalize={(value) => normalizePlainText(value, 255)} required autoFocus maxLength={255} />
                <ValidatedUrlInput label="Project URL" optional value={projectForm.link} onValueChange={(link) => setProjectForm({ ...projectForm, link })} maxLength={2048} />
                <ValidatedUrlInput label="GitHub URL" optional value={projectForm.github_url} onValueChange={(github_url) => setProjectForm({ ...projectForm, github_url })} platform="GitHub" maxLength={2048} />
                <Input label="Technologies" value={projectForm.technologies} onChange={(event) => setProjectForm({ ...projectForm, technologies: event.target.value })} hint="Separate technologies with commas." maxLength={1000} />
              </div>
              <Textarea label="Description" optional value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} rows={4} maxLength={4000} showCount />
              <div className="flex justify-end"><SubmitButton label={editingTarget?.type === "projects" ? "Save project" : "Add project"} loading={pendingAction === "projects"} editing={editingTarget?.type === "projects"} onCancel={cancelEditing} /></div>
            </form>
          }
          empty={projects.length === 0}
        >
          {projects.map((item) => (
            <DataRow key={item.id} title={item.name} meta={[item.description, item.technologies?.join(", ")].filter(Boolean).join(" · ")} href={item.link || item.github_url || undefined} onEdit={() => editProject(item)} onDelete={() => setDeleteTarget({ type: "projects", id: item.id, label: item.name })} />
          ))}
        </ProfileSection>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${deleteTarget?.label || "item"}?`}
        description="This item will be permanently removed from your profile."
        onClose={() => pendingAction !== "delete" && setDeleteTarget(null)}
        preventClose={pendingAction === "delete"}
      >
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={pendingAction === "delete"}>Cancel</Button>
          <Button variant="danger" onClick={() => void confirmDelete()} loading={pendingAction === "delete"} loadingLabel="Deleting...">Delete item</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function notifyProfileUpdated(detail: ProfileUpdatedDetail) {
  window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail }));
}

function SubmitButton({
  label,
  loading,
  editing = false,
  onCancel,
}: {
  label: string;
  loading: boolean;
  editing?: boolean;
  onCancel?: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      {editing && (
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      )}
      <Button type="submit" loading={loading} loadingLabel="Working..." disabled={loading}>
        {editing ? <Pencil size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
        {label}
      </Button>
    </div>
  );
}

function ProfileSection({
  title,
  description,
  form,
  empty,
  children,
}: {
  title: string;
  description: string;
  form: ReactNode;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
      <Card padding="lg">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
        <div className="mt-6">{form}</div>
      </Card>
      <section aria-label={`Saved ${title.toLowerCase()}`} className="grid content-start gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Saved {title.toLowerCase()}</h2>
        </div>
        {empty ? (
          <EmptyState title={`No ${title.toLowerCase()} yet`} description="Add your first item using the form." />
        ) : children}
      </section>
    </div>
  );
}

function DataRow({
  title,
  meta,
  href,
  onEdit,
  onDelete,
}: {
  title: string;
  meta?: string;
  href?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card padding="sm" className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold">{title}</h3>
        {meta && <p className="mt-1 line-clamp-3 text-xs text-[var(--text-muted)]">{meta}</p>}
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">
            Open link <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="sm" iconOnly onClick={onEdit} aria-label={`Edit ${title}`}>
          <Pencil size={15} aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="sm" iconOnly className="text-[var(--danger)]" onClick={onDelete} aria-label={`Delete ${title}`}>
          <Trash2 size={15} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  );
}

function formatDateRange(start?: string | null, end?: string | null, current?: boolean | null) {
  const first = start ? start.slice(0, 10) : "";
  const last = current ? "Present" : end ? end.slice(0, 10) : "";
  return [first, last].filter(Boolean).join(" – ");
}
