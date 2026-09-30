"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Award,
  Briefcase,
  Camera,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
  User as UserIcon,
  Wrench,
} from "lucide-react";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/Button";
import type { User as UserType } from "../../modules/auth/types";
import { profileApi } from "../../modules/profile/api";
import type { Certificate } from "../../modules/certificates/types";
import { createEducation, deleteEducation, listEducations } from "../../modules/education/api";
import type { Education } from "../../modules/education/types";
import { createExperience, deleteExperience, listExperiences } from "../../modules/experience/api";
import type { Experience } from "../../modules/experience/types";
import { createProject, deleteProject, listProjects } from "../../modules/projects/api";
import type { Project } from "../../modules/projects/types";
import { createSkill, deleteSkill, listSkills } from "../../modules/skills/api";
import type { Skill } from "../../modules/skills/types";
import { createSocialLink, deleteSocialLink, listSocialLinks } from "../../modules/social-links/api";
import type { SocialLink } from "../../modules/social-links/types";

interface SettingsClientProps {
  user: UserType;
}

type TabId = "profile" | "social" | "education" | "experience" | "skills" | "certificates" | "projects";
type DeleteTarget = { type: Exclude<TabId, "profile"> | "skill"; id: string; label: string };

const tabs: Array<{ id: TabId; label: string; icon: typeof UserIcon }> = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "social", label: "Social", icon: LinkIcon },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "skills", label: "Skills", icon: Wrench },
  { id: "certificates", label: "Certificates", icon: Award },
  { id: "projects", label: "Projects", icon: FileText },
];

function splitName(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
}

function compactDate(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const initialName = splitName(user.name);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [profileForm, setProfileForm] = useState({
    first_name: initialName.firstName,
    last_name: initialName.lastName,
    email: user.email,
    phone: user.number || "",
    address: "",
    avatar_url: "",
  });
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const [socialForm, setSocialForm] = useState({ platform_name: "", profile_url: "" });
  const [educationForm, setEducationForm] = useState({ institute_name: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "", grade: "" });
  const [experienceForm, setExperienceForm] = useState({ company_name: "", job_title: "", location: "", start_date: "", end_date: "", description: "" });
  const [skillForm, setSkillForm] = useState({ name: "", category: "", level: "" });
  const [certificateForm, setCertificateForm] = useState({ title: "", category: "", field: "", file_url: "", issue_date: "", expiration_date: "" });
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", description: "", link: "", github_url: "", technologies: "" });

  const notify = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 3000);
  };

  const loadProfileData = async () => {
    setLoading(true);
    setError("");
    const listErrors: string[] = [];

    const profile = await profileApi.getProfile().catch((err) => {
      listErrors.push(err instanceof Error ? err.message : "Unable to load personal profile.");
      return null;
    });

    if (profile) {
      setProfileForm({
        first_name: profile.personal.first_name || profile.personal.name || "",
        last_name: profile.personal.last_name || "",
        email: profile.personal.email || user.email,
        phone: profile.personal.phone || user.number || "",
        address: profile.personal.address || "",
        avatar_url: profile.personal.avatar_url || "",
      });
      setAvatarUrl(profile.personal.avatar_url || "");
    }

    const [social, edu, exp, skillItems, certItems, projectItems] = await Promise.allSettled([
      listSocialLinks(),
      listEducations(),
      listExperiences(),
      listSkills(),
      profileApi.listCertificates(),
      listProjects(),
    ]);

    if (social.status === "fulfilled") setSocialLinks(social.value);
    if (edu.status === "fulfilled") setEducation(edu.value);
    if (exp.status === "fulfilled") setExperience(exp.value);
    if (skillItems.status === "fulfilled") setSkills(skillItems.value);
    if (certItems.status === "fulfilled") setCertificates(certItems.value);
    if (projectItems.status === "fulfilled") setProjects(projectItems.value);

    for (const result of [social, edu, exp, skillItems, certItems, projectItems]) {
      if (result.status === "rejected") {
        listErrors.push(result.reason instanceof Error ? result.reason.message : "Unable to load a profile list.");
      }
    }

    const meaningfulErrors = listErrors.filter((message) => !message.toLowerCase().includes("personal profile"));
    setError(meaningfulErrors[0] || "");
    setLoading(false);
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await profileApi.upsertPersonal(profileForm);
      notify("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile.");
    }
  };

  const uploadAvatar = async (file: File | undefined) => {
    if (!file) return;
    setUploadingAvatar(true);
    setError("");
    try {
      const uploaded = await profileApi.uploadAvatar(file);
      setAvatarUrl(uploaded.url);
      setProfileForm((current) => ({ ...current, avatar_url: uploaded.url }));
      notify("Avatar uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save your profile first, then upload the avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const addSocial = async (event: FormEvent) => {
    event.preventDefault();
    const created = await createSocialLink(socialForm);
    setSocialLinks((current) => [created, ...current]);
    setSocialForm({ platform_name: "", profile_url: "" });
    notify("Social link added.");
  };

  const addEducation = async (event: FormEvent) => {
    event.preventDefault();
    const created = await createEducation({ ...educationForm, end_date: educationForm.end_date || null });
    setEducation((current) => [created, ...current]);
    setEducationForm({ institute_name: "", degree: "", field_of_study: "", start_date: "", end_date: "", description: "", grade: "" });
    notify("Education added.");
  };

  const addExperience = async (event: FormEvent) => {
    event.preventDefault();
    const created = await createExperience({
      ...experienceForm,
      institute_name: experienceForm.company_name,
      end_date: experienceForm.end_date || null,
    });
    setExperience((current) => [created, ...current]);
    setExperienceForm({ company_name: "", job_title: "", location: "", start_date: "", end_date: "", description: "" });
    notify("Experience added.");
  };

  const addSkill = async (event: FormEvent) => {
    event.preventDefault();
    const created = await createSkill(skillForm);
    setSkills((current) => [created, ...current]);
    setSkillForm({ name: "", category: "", level: "" });
    notify("Skill added.");
  };

  const addCertificate = async (event: FormEvent) => {
    event.preventDefault();
    const title = certificateForm.title || certificateFile?.name || "";
    if (!title) return;
    const created = certificateFile
      ? await profileApi.uploadDocument(certificateFile).then((uploaded) => ({
          id: uploaded.id,
          title,
          category: certificateForm.category || "Certificate",
          field: certificateForm.field || null,
          file_url: uploaded.url,
          file_name: uploaded.name,
        }))
      : await profileApi.addCertificate({
          name: title,
          issuing_organization: certificateForm.category || undefined,
          credential_id: certificateForm.field || undefined,
          credential_url: certificateForm.file_url || undefined,
          issue_date: certificateForm.issue_date || undefined,
          expiration_date: certificateForm.expiration_date || undefined,
        });
    setCertificates((current) => [created, ...current]);
    setCertificateForm({ title: "", category: "", field: "", file_url: "", issue_date: "", expiration_date: "" });
    setCertificateFile(null);
    notify("Certificate added.");
  };

  const addProject = async (event: FormEvent) => {
    event.preventDefault();
    const created = await createProject({
      name: projectForm.name,
      description: projectForm.description || null,
      link: projectForm.link || null,
      github_url: projectForm.github_url || null,
      technologies: projectForm.technologies ? projectForm.technologies.split(",").map((item) => item.trim()).filter(Boolean) : null,
    });
    setProjects((current) => [created, ...current]);
    setProjectForm({ name: "", description: "", link: "", github_url: "", technologies: "" });
    notify("Project added.");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "social") {
      await deleteSocialLink(deleteTarget.id);
      setSocialLinks((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "education") {
      await deleteEducation(deleteTarget.id);
      setEducation((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "experience") {
      await deleteExperience(deleteTarget.id);
      setExperience((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "skill") {
      await deleteSkill(deleteTarget.id);
      setSkills((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "certificates") {
      await profileApi.deleteCertificate(deleteTarget.id);
      setCertificates((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    if (deleteTarget.type === "projects") {
      await deleteProject(deleteTarget.id);
      setProjects((current) => current.filter((item) => item.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
    notify("Item deleted.");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Profile Data</h1>
          <p className="text-sm text-[var(--text-muted)]">Manage the data used by resume templates and recommendations.</p>
        </div>
        <button type="button" onClick={loadProfileData} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-semibold">
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-bold ${
                activeTab === tab.id ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--on-primary)]" : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {notice && <div className="rounded-md bg-[var(--primary-tint)] px-4 py-3 text-sm font-semibold text-[var(--primary)]"><CheckCircle2 className="mr-2 inline h-4 w-4" />{notice}</div>}
      {error && <div className="rounded-md bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}
      {loading && <div className="text-sm text-[var(--text-muted)]">Loading profile data...</div>}

      {activeTab === "profile" && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex flex-col gap-4 rounded-md border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile avatar" className="h-full w-full object-cover" />
              ) : (
                <Camera className="h-7 w-7 text-[var(--text-muted)]" />
              )}
            </div>
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-[var(--text)]">Avatar</h2>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-[var(--primary)] px-3 py-2 text-sm font-bold text-[var(--on-primary)]">
                <Upload className="h-4 w-4" />
                {uploadingAvatar ? "Uploading..." : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  disabled={uploadingAvatar}
                  onChange={(event) => uploadAvatar(event.target.files?.[0])}
                />
              </label>
              <p className="text-xs text-[var(--text-muted)]">Save your profile once before uploading an avatar.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="First name" value={profileForm.first_name} onChange={(value) => setProfileForm({ ...profileForm, first_name: value })} />
            <Field label="Last name" value={profileForm.last_name} onChange={(value) => setProfileForm({ ...profileForm, last_name: value })} />
            <Field label="Email" type="email" value={profileForm.email} onChange={(value) => setProfileForm({ ...profileForm, email: value })} />
            <Field label="Phone" value={profileForm.phone} onChange={(value) => setProfileForm({ ...profileForm, phone: value })} />
            <Field label="Address" value={profileForm.address} onChange={(value) => setProfileForm({ ...profileForm, address: value })} />
          </div>
          <Button type="submit">Save Profile</Button>
        </form>
      )}

      {activeTab === "social" && (
        <Section form={<form onSubmit={addSocial} className="grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="Platform" value={socialForm.platform_name} onChange={(value) => setSocialForm({ ...socialForm, platform_name: value })} /><Field label="URL" value={socialForm.profile_url} onChange={(value) => setSocialForm({ ...socialForm, profile_url: value })} /><SubmitButton label="Add Link" /></form>}>
          {socialLinks.map((item) => <Row key={item.id} title={item.platform_name} meta={item.profile_url} onDelete={() => setDeleteTarget({ type: "social", id: item.id, label: item.platform_name })} />)}
        </Section>
      )}

      {activeTab === "education" && (
        <Section form={<form onSubmit={addEducation} className="grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="Institution" value={educationForm.institute_name} onChange={(value) => setEducationForm({ ...educationForm, institute_name: value })} /><Field label="Degree" value={educationForm.degree} onChange={(value) => setEducationForm({ ...educationForm, degree: value })} /><Field label="Field" value={educationForm.field_of_study} onChange={(value) => setEducationForm({ ...educationForm, field_of_study: value })} /><Field label="Start" type="date" value={educationForm.start_date} onChange={(value) => setEducationForm({ ...educationForm, start_date: value })} /><Field label="End" type="date" value={educationForm.end_date} onChange={(value) => setEducationForm({ ...educationForm, end_date: value })} /><Field label="Grade" value={educationForm.grade} onChange={(value) => setEducationForm({ ...educationForm, grade: value })} /><SubmitButton label="Add Education" /></form>}>
          {education.map((item) => <Row key={item.id} title={item.institute_name} meta={`${item.degree || item.field_of_study || "Education"} · ${compactDate(item.start_date)} ${item.end_date ? `- ${compactDate(item.end_date)}` : ""}`} onDelete={() => setDeleteTarget({ type: "education", id: item.id, label: item.institute_name })} />)}
        </Section>
      )}

      {activeTab === "experience" && (
        <Section form={<form onSubmit={addExperience} className="grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="Company" value={experienceForm.company_name} onChange={(value) => setExperienceForm({ ...experienceForm, company_name: value })} /><Field label="Job title" value={experienceForm.job_title} onChange={(value) => setExperienceForm({ ...experienceForm, job_title: value })} /><Field label="Location" value={experienceForm.location} onChange={(value) => setExperienceForm({ ...experienceForm, location: value })} /><Field label="Start" type="date" value={experienceForm.start_date} onChange={(value) => setExperienceForm({ ...experienceForm, start_date: value })} /><Field label="End" type="date" value={experienceForm.end_date} onChange={(value) => setExperienceForm({ ...experienceForm, end_date: value })} /><SubmitButton label="Add Experience" /></form>}>
          {experience.map((item) => <Row key={item.id} title={item.job_title} meta={`${item.company_name || item.institute_name || "Company"} · ${compactDate(item.start_date)} ${item.end_date ? `- ${compactDate(item.end_date)}` : ""}`} onDelete={() => setDeleteTarget({ type: "experience", id: item.id, label: item.job_title })} />)}
        </Section>
      )}

      {activeTab === "skills" && (
        <Section form={<form onSubmit={addSkill} className="grid grid-cols-1 gap-3 md:grid-cols-4"><Field label="Skill" value={skillForm.name} onChange={(value) => setSkillForm({ ...skillForm, name: value })} /><Field label="Category" value={skillForm.category} onChange={(value) => setSkillForm({ ...skillForm, category: value })} /><Field label="Level" value={skillForm.level} onChange={(value) => setSkillForm({ ...skillForm, level: value })} /><SubmitButton label="Add Skill" /></form>}>
          <div className="flex flex-wrap gap-2">{skills.map((item) => <Row key={item.id} title={item.name} meta={[item.category, item.level].filter(Boolean).join(" · ")} onDelete={() => setDeleteTarget({ type: "skill", id: item.id, label: item.name })} compact />)}</div>
        </Section>
      )}

      {activeTab === "certificates" && (
        <Section form={<form onSubmit={addCertificate} className="grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="Name" value={certificateForm.title} onChange={(value) => setCertificateForm({ ...certificateForm, title: value })} /><Field label="Organization" value={certificateForm.category} onChange={(value) => setCertificateForm({ ...certificateForm, category: value })} /><Field label="Credential ID" value={certificateForm.field} onChange={(value) => setCertificateForm({ ...certificateForm, field: value })} /><Field label="Credential URL" value={certificateForm.file_url} onChange={(value) => setCertificateForm({ ...certificateForm, file_url: value })} /><label className="space-y-1 text-xs font-semibold text-[var(--text-muted)]"><span>Upload image or PDF</span><input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(event) => setCertificateFile(event.target.files?.[0] || null)} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]" /></label><SubmitButton label="Add Certificate" /></form>}>
          {certificates.map((item) => <Row key={item.id} title={item.title} meta={`${item.category || "Certificate"}${item.file_url ? " · uploaded" : ""}`} href={item.file_url || undefined} onDelete={() => setDeleteTarget({ type: "certificates", id: item.id, label: item.title })} />)}
        </Section>
      )}

      {activeTab === "projects" && (
        <Section form={<form onSubmit={addProject} className="grid grid-cols-1 gap-3 md:grid-cols-3"><Field label="Name" value={projectForm.name} onChange={(value) => setProjectForm({ ...projectForm, name: value })} /><Field label="URL" value={projectForm.link} onChange={(value) => setProjectForm({ ...projectForm, link: value })} /><Field label="GitHub" value={projectForm.github_url} onChange={(value) => setProjectForm({ ...projectForm, github_url: value })} /><Field label="Technologies" value={projectForm.technologies} onChange={(value) => setProjectForm({ ...projectForm, technologies: value })} /><Field label="Description" value={projectForm.description} onChange={(value) => setProjectForm({ ...projectForm, description: value })} /><SubmitButton label="Add Project" /></form>}>
          {projects.map((item) => <Row key={item.id} title={item.name} meta={item.description || item.link || ""} href={item.link || undefined} onDelete={() => setDeleteTarget({ type: "projects", id: item.id, label: item.name })} />)}
        </Section>
      )}

      <ConfirmDialog open={Boolean(deleteTarget)} title={`Delete ${deleteTarget?.label || "item"}`} onClose={() => setDeleteTarget(null)}>
        <p className="text-sm text-[var(--text-muted)]">This item will be permanently removed from your profile.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button type="button" variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </ConfirmDialog>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="space-y-1 text-xs font-semibold text-[var(--text-muted)]">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--primary)]" />
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  return <div className="flex items-end"><Button type="submit" className="w-full"><Plus className="mr-1 inline h-4 w-4" />{label}</Button></div>;
}

function Section({ form, children }: { form: ReactNode; children: ReactNode }) {
  return <div className="space-y-5"><div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-4">{form}</div><div className="space-y-3">{children}</div></div>;
}

function Row({ title, meta, onDelete, compact, href }: { title: string; meta?: string; onDelete: () => void; compact?: boolean; href?: string }) {
  return (
    <div className={`flex items-start justify-between gap-3 rounded-md border border-[var(--border)] bg-[var(--surface)] ${compact ? "px-3 py-2" : "p-4"}`}>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-bold text-[var(--text)]">{title}</h3>
        {meta && <p className="mt-1 text-xs text-[var(--text-muted)]">{meta}</p>}
        {href && <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)]">Open file <ExternalLink className="h-3 w-3" /></a>}
      </div>
      <button type="button" onClick={onDelete} className="rounded-md p-2 text-[var(--text-muted)] hover:text-rose-600" title="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
