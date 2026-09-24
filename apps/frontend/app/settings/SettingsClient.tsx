"use client";

import React, { useState, useEffect, FormEvent, ChangeEvent } from "react";
import {
  User as UserIcon,
  Award,
  GraduationCap,
  Briefcase,
  Wrench,
  Camera,
  Upload,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileText,
  ExternalLink,
  Edit3,
  Sparkles,
} from "lucide-react";
import type { User as UserType } from "../../modules/auth/types";

interface SettingsClientProps {
  user: UserType;
}

// Sub-page interfaces
export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  category: string;
  issueDate: string;
  expiryDate?: string;
  credentialUrl?: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  period: string;
  location?: string;
  grade?: string;
  description?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location?: string;
  period: string;
  isCurrent?: boolean;
  details: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: "Frontend" | "Backend" | "Design" | "DevOps & Tools" | "Soft Skills";
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience?: string;
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "certificates" | "education" | "experience" | "skills"
  >("profile");

  const [notification, setNotification] = useState("");
  const [errorNotice, setErrorNotice] = useState("");

  // 1. Profile State
  const [profileForm, setProfileForm] = useState({
    firstName: user.name?.split(" ")[0] || "Jane",
    lastName: user.name?.split(" ").slice(1).join(" ") || "Doe",
    email: user.email || "jane@mail.com",
    phone: user.number || "+1 555-0192",
    address: "New York, USA",
    jobTitle: "Product Designer",
    summary:
      "Creative product designer crafting intuitive user interfaces and modern web applications with focus on usability and design systems.",
  });
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // 2. Certificates State
  const [certificates, setCertificates] = useState<CertificateItem[]>([
    {
      id: "cert-1",
      title: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      category: "Cloud",
      issueDate: "2024-01-15",
      credentialUrl: "https://aws.amazon.com/verification",
    },
    {
      id: "cert-2",
      title: "Google Professional UX Designer",
      issuer: "Google Coursera",
      category: "Design",
      issueDate: "2023-11-20",
    },
  ]);
  const [newCert, setNewCert] = useState<Partial<CertificateItem>>({
    title: "",
    issuer: "",
    category: "Cloud",
    issueDate: "",
    credentialUrl: "",
  });

  // 3. Education State
  const [educationList, setEducationList] = useState<EducationItem[]>([
    {
      id: "edu-1",
      degree: "B.A. Graphic & Digital Design",
      institution: "New York Design Academy",
      fieldOfStudy: "Design Systems",
      period: "2017 - 2021",
      location: "New York, NY",
      grade: "3.9 GPA",
      description: "Specialized in interaction design, typography, and web technology.",
    },
  ]);
  const [newEdu, setNewEdu] = useState<Partial<EducationItem>>({
    degree: "",
    institution: "",
    period: "",
    location: "",
    grade: "",
    description: "",
  });

  // 4. Experience State
  const [experienceList, setExperienceList] = useState<ExperienceItem[]>([
    {
      id: "exp-1",
      role: "Senior Product Designer",
      company: "Design Studio Inc.",
      location: "San Francisco, CA",
      period: "2023 - Present",
      isCurrent: true,
      details: "Leading UI component design systems and cross-platform product design workflows.",
    },
    {
      id: "exp-2",
      role: "UI Engineer",
      company: "Creative Cloud Labs",
      location: "New York, NY",
      period: "2021 - 2023",
      isCurrent: false,
      details: "Created responsive interfaces and design tokens used by over 500k active users.",
    },
  ]);
  const [newExp, setNewExp] = useState<Partial<ExperienceItem>>({
    role: "",
    company: "",
    location: "",
    period: "",
    details: "",
  });

  // 5. Skills State
  const [skillsList, setSkillsList] = useState<SkillItem[]>([
    { id: "sk-1", name: "UI/UX Design", category: "Design", level: "Expert", yearsOfExperience: "5 yrs" },
    { id: "sk-2", name: "Figma", category: "Design", level: "Expert", yearsOfExperience: "5 yrs" },
    { id: "sk-3", name: "React.js", category: "Frontend", level: "Advanced", yearsOfExperience: "3 yrs" },
    { id: "sk-4", name: "TypeScript", category: "Frontend", level: "Advanced", yearsOfExperience: "3 yrs" },
    { id: "sk-5", name: "Tailwind CSS", category: "Frontend", level: "Expert", yearsOfExperience: "4 yrs" },
  ]);
  const [newSkill, setNewSkill] = useState<Partial<SkillItem>>({
    name: "",
    category: "Frontend",
    level: "Intermediate",
    yearsOfExperience: "2 yrs",
  });

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAvatar = localStorage.getItem("user_avatar");
      if (savedAvatar) setAvatarUrl(savedAvatar);

      const savedCerts = localStorage.getItem("settings_certificates");
      if (savedCerts) setCertificates(JSON.parse(savedCerts));

      const savedEdu = localStorage.getItem("settings_education");
      if (savedEdu) setEducationList(JSON.parse(savedEdu));

      const savedExp = localStorage.getItem("settings_experience");
      if (savedExp) setExperienceList(JSON.parse(savedExp));

      const savedSkills = localStorage.getItem("settings_skills");
      if (savedSkills) setSkillsList(JSON.parse(savedSkills));
    }
  }, []);

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3500);
  };

  // Profile Save
  const handleProfileSave = (e: FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("user_profile_data", JSON.stringify(profileForm));
    }
    notify("Profile settings updated successfully!");
  };

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const url = reader.result as string;
      setAvatarUrl(url);
      if (typeof window !== "undefined") {
        localStorage.setItem("user_avatar", url);
      }
      notify("Avatar photo updated!");
    };
    reader.readAsDataURL(file);
  };

  // Certificate Actions
  const addCertificate = (e: FormEvent) => {
    e.preventDefault();
    if (!newCert.title || !newCert.issuer) return;

    const item: CertificateItem = {
      id: `cert-${Date.now()}`,
      title: newCert.title,
      issuer: newCert.issuer,
      category: newCert.category || "General",
      issueDate: newCert.issueDate || new Date().toISOString().slice(0, 10),
      credentialUrl: newCert.credentialUrl,
    };

    const updated = [item, ...certificates];
    setCertificates(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_certificates", JSON.stringify(updated));
    }
    setNewCert({ title: "", issuer: "", category: "Cloud", issueDate: "", credentialUrl: "" });
    notify("Certificate added successfully!");
  };

  const deleteCertificate = (id: string) => {
    const updated = certificates.filter((c) => c.id !== id);
    setCertificates(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_certificates", JSON.stringify(updated));
    }
    notify("Certificate removed!");
  };

  // Education Actions
  const addEducation = (e: FormEvent) => {
    e.preventDefault();
    if (!newEdu.degree || !newEdu.institution) return;

    const item: EducationItem = {
      id: `edu-${Date.now()}`,
      degree: newEdu.degree,
      institution: newEdu.institution,
      period: newEdu.period || "2020 - 2024",
      location: newEdu.location,
      grade: newEdu.grade,
      description: newEdu.description,
    };

    const updated = [item, ...educationList];
    setEducationList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_education", JSON.stringify(updated));
    }
    setNewEdu({ degree: "", institution: "", period: "", location: "", grade: "", description: "" });
    notify("Education entry added!");
  };

  const deleteEducation = (id: string) => {
    const updated = educationList.filter((e) => e.id !== id);
    setEducationList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_education", JSON.stringify(updated));
    }
    notify("Education entry removed!");
  };

  // Experience Actions
  const addExperience = (e: FormEvent) => {
    e.preventDefault();
    if (!newExp.role || !newExp.company) return;

    const item: ExperienceItem = {
      id: `exp-${Date.now()}`,
      role: newExp.role,
      company: newExp.company,
      location: newExp.location,
      period: newExp.period || "2024 - Present",
      details: newExp.details || "Responsibilities & key accomplishments...",
    };

    const updated = [item, ...experienceList];
    setExperienceList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_experience", JSON.stringify(updated));
    }
    setNewExp({ role: "", company: "", location: "", period: "", details: "" });
    notify("Work experience added!");
  };

  const deleteExperience = (id: string) => {
    const updated = experienceList.filter((e) => e.id !== id);
    setExperienceList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_experience", JSON.stringify(updated));
    }
    notify("Experience entry removed!");
  };

  // Skills Actions
  const addSkill = (e: FormEvent) => {
    e.preventDefault();
    if (!newSkill.name) return;

    const item: SkillItem = {
      id: `sk-${Date.now()}`,
      name: newSkill.name,
      category: newSkill.category || "Frontend",
      level: newSkill.level || "Intermediate",
      yearsOfExperience: newSkill.yearsOfExperience || "1 yr",
    };

    const updated = [...skillsList, item];
    setSkillsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_skills", JSON.stringify(updated));
    }
    setNewSkill({ name: "", category: "Frontend", level: "Intermediate", yearsOfExperience: "2 yrs" });
    notify("Skill added to profile!");
  };

  const deleteSkill = (id: string) => {
    const updated = skillsList.filter((s) => s.id !== id);
    setSkillsList(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("settings_skills", JSON.stringify(updated));
    }
    notify("Skill removed!");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 1. Settings Header Banner */}
      <div className="bg-[var(--surface)] p-6 md:p-8 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--primary)] bg-[var(--primary-tint)] text-[var(--primary)] flex items-center justify-center text-xl font-extrabold shadow-xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{(profileForm.firstName[0] || "U").toUpperCase()}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-[var(--primary)] text-[var(--on-primary)] p-1.5 rounded-full cursor-pointer shadow-md hover:bg-[var(--primary-hover)] transition">
              <Camera className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-[var(--text)] tracking-tight">
              {profileForm.firstName} {profileForm.lastName}
            </h1>
            <p className="text-[var(--text-muted)] text-xs mt-0.5">
              {profileForm.jobTitle} • {profileForm.email}
            </p>
          </div>
        </div>

        {/* 2. Organized Sub-Sections / Tabs Navigation Bar */}
        <div className="flex flex-wrap gap-1.5 border-t md:border-t-0 border-[var(--border)] pt-4 md:pt-0">
          {[
            { id: "profile", label: "Profile", icon: UserIcon },
            { id: "certificates", label: "Certificates", icon: Award },
            { id: "education", label: "Education", icon: GraduationCap },
            { id: "experience", label: "Experience", icon: Briefcase },
            { id: "skills", label: "Skills Details", icon: Wrench },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
                  isActive
                    ? "bg-[var(--primary)] text-[var(--on-primary)] shadow-xs"
                    : "bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--primary-tint)] hover:text-[var(--primary)] border border-[var(--border)]"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="bg-[var(--primary-tint)] border-l-4 border-[var(--primary)] p-4 rounded-xl flex items-center space-x-2 text-[var(--primary)] text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* SUB-SECTION 1: Profile Page */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSave} className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-6">
          <div className="border-b border-[var(--border)] pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Personal & Contact Profile</h2>
              <p className="text-[var(--text-muted)] text-xs mt-0.5">
                Update your global profile information. Changes here automatically reflect across all resumes.
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-[var(--primary)]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[var(--text-muted)] font-semibold block mb-1">First Name</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] font-semibold block mb-1">Last Name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] font-semibold block mb-1">Email Address</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] font-semibold block mb-1">Phone Number</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] font-semibold block mb-1">Job Title / Headline</label>
              <input
                type="text"
                value={profileForm.jobTitle}
                onChange={(e) => setProfileForm({ ...profileForm, jobTitle: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div>
              <label className="text-[var(--text-muted)] font-semibold block mb-1">Location / Address</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[var(--text-muted)] font-semibold block mb-1">Professional Summary</label>
              <textarea
                rows={4}
                value={profileForm.summary}
                onChange={(e) => setProfileForm({ ...profileForm, summary: e.target.value })}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--border)]">
            <button
              type="submit"
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition"
            >
              Save Profile Settings
            </button>
          </div>
        </form>
      )}

      {/* SUB-SECTION 2: Certificates Page */}
      {activeTab === "certificates" && (
        <div className="space-y-6">
          {/* Add Certificate Form */}
          <form onSubmit={addCertificate} className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Add Professional Certificate</h2>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">Include credentials, licenses, and course certifications.</p>
              </div>
              <Award className="w-5 h-5 text-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Certificate Title</label>
                <input
                  type="text"
                  placeholder="e.g. AWS Solutions Architect"
                  value={newCert.title}
                  onChange={(e) => setNewCert({ ...newCert, title: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Issuing Organization</label>
                <input
                  type="text"
                  placeholder="e.g. Amazon Web Services"
                  value={newCert.issuer}
                  onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Category</label>
                <select
                  value={newCert.category}
                  onChange={(e) => setNewCert({ ...newCert, category: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                >
                  <option value="Cloud">Cloud & Infrastructure</option>
                  <option value="Design">UI/UX & Graphic Design</option>
                  <option value="Development">Software Development</option>
                  <option value="Security">Cybersecurity</option>
                  <option value="Management">Project Management</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Issue Date</label>
                <input
                  type="date"
                  value={newCert.issueDate}
                  onChange={(e) => setNewCert({ ...newCert, issueDate: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Verification URL / Credential Link</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newCert.credentialUrl}
                  onChange={(e) => setNewCert({ ...newCert, credentialUrl: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Certificate</span>
              </button>
            </div>
          </form>

          {/* Certificates List */}
          <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[var(--text)]">Your Certificates ({certificates.length})</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex justify-between items-start space-x-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary-tint)] px-2 py-0.5 rounded-md">
                      {cert.category}
                    </span>
                    <h4 className="font-bold text-sm text-[var(--text)] mt-1">{cert.title}</h4>
                    <p className="text-xs text-[var(--text-muted)]">{cert.issuer} • Issued {cert.issueDate}</p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-[var(--primary)] inline-flex items-center space-x-1 hover:underline pt-1"
                      >
                        <span>Verify Credential</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <button
                    onClick={() => deleteCertificate(cert.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 rounded-lg transition"
                    title="Delete certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 3: Education Page */}
      {activeTab === "education" && (
        <div className="space-y-6">
          {/* Add Education Form */}
          <form onSubmit={addEducation} className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Add Education Entry</h2>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">Degrees, diplomas, university qualifications.</p>
              </div>
              <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Degree / Qualification</label>
                <input
                  type="text"
                  placeholder="e.g. B.S. Computer Science"
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Institution / University</label>
                <input
                  type="text"
                  placeholder="e.g. Stanford University"
                  value={newEdu.institution}
                  onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Dates / Period</label>
                <input
                  type="text"
                  placeholder="e.g. 2019 - 2023"
                  value={newEdu.period}
                  onChange={(e) => setNewEdu({ ...newEdu, period: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">GPA / Grade / Honors</label>
                <input
                  type="text"
                  placeholder="e.g. 3.8 GPA (Honors)"
                  value={newEdu.grade}
                  onChange={(e) => setNewEdu({ ...newEdu, grade: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Description / Key Accomplishments</label>
                <textarea
                  rows={3}
                  placeholder="Major coursework, thesis, academic honors..."
                  value={newEdu.description}
                  onChange={(e) => setNewEdu({ ...newEdu, description: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Education</span>
              </button>
            </div>
          </form>

          {/* Education List */}
          <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[var(--text)]">Education History ({educationList.length})</h3>

            <div className="space-y-3">
              {educationList.map((edu) => (
                <div key={edu.id} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-[var(--text)]">{edu.degree}</h4>
                      {edu.grade && (
                        <span className="text-[10px] bg-[var(--primary-tint)] text-[var(--primary)] px-2 py-0.5 rounded-md font-bold">
                          {edu.grade}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{edu.institution} • {edu.period}</p>
                    {edu.description && <p className="text-xs text-[var(--text)] pt-1">{edu.description}</p>}
                  </div>

                  <button
                    onClick={() => deleteEducation(edu.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 rounded-lg transition"
                    title="Delete education"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 4: Experience Page */}
      {activeTab === "experience" && (
        <div className="space-y-6">
          {/* Add Experience Form */}
          <form onSubmit={addExperience} className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Add Work Experience</h2>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">Professional employment history and role responsibilities.</p>
              </div>
              <Briefcase className="w-5 h-5 text-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Job Title / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  value={newExp.role}
                  onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Google / Tech Corp"
                  value={newExp.company}
                  onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA (Hybrid)"
                  value={newExp.location}
                  onChange={(e) => setNewExp({ ...newExp, location: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Employment Period</label>
                <input
                  type="text"
                  placeholder="e.g. 2022 - Present"
                  value={newExp.period}
                  onChange={(e) => setNewExp({ ...newExp, period: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Key Responsibilities & Impact</label>
                <textarea
                  rows={3}
                  placeholder="Describe your accomplishments, technologies used, and team impact..."
                  value={newExp.details}
                  onChange={(e) => setNewExp({ ...newExp, details: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Experience</span>
              </button>
            </div>
          </form>

          {/* Experience List */}
          <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[var(--text)]">Work History ({experienceList.length})</h3>

            <div className="space-y-4">
              {experienceList.map((exp) => (
                <div key={exp.id} className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex justify-between items-start">
                  <div className="space-y-1 max-w-3xl">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-[var(--text)]">{exp.role}</h4>
                      <span className="text-[10px] bg-[var(--primary-tint)] text-[var(--primary)] px-2 py-0.5 rounded-md font-bold">
                        {exp.company}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{exp.period} • {exp.location || "Remote"}</p>
                    <p className="text-xs text-[var(--text)] pt-1 leading-relaxed whitespace-pre-line">{exp.details}</p>
                  </div>

                  <button
                    onClick={() => deleteExperience(exp.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-rose-600 rounded-lg transition"
                    title="Delete experience"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-SECTION 5: Skills Details Page */}
      {activeTab === "skills" && (
        <div className="space-y-6">
          {/* Add Skill Form */}
          <form onSubmit={addSkill} className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <div className="border-b border-[var(--border)] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">Add Professional Skill</h2>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">Categorize technical skills, tools, and competencies with proficiency levels.</p>
              </div>
              <Wrench className="w-5 h-5 text-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Skill Name</label>
                <input
                  type="text"
                  placeholder="e.g. React.js, Python, Figma"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Category</label>
                <select
                  value={newSkill.category}
                  onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value as any })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                >
                  <option value="Frontend">Frontend Development</option>
                  <option value="Backend">Backend & Databases</option>
                  <option value="Design">UI/UX & Design</option>
                  <option value="DevOps & Tools">DevOps & Tools</option>
                  <option value="Soft Skills">Soft Skills</option>
                </select>
              </div>

              <div>
                <label className="text-[var(--text-muted)] font-semibold block mb-1">Proficiency Level</label>
                <select
                  value={newSkill.level}
                  onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value as any })}
                  className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl p-2.5 text-[var(--text)] outline-none focus:border-[var(--primary)]"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--on-primary)] text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add Skill</span>
              </button>
            </div>
          </form>

          {/* Skills Grid */}
          <div className="bg-[var(--surface)] rounded-2xl p-6 md:p-8 border border-[var(--border)] shadow-xs space-y-4">
            <h3 className="font-bold text-base text-[var(--text)]">Skill Matrix ({skillsList.length})</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {skillsList.map((skill) => (
                <div key={skill.id} className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl flex justify-between items-center">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)]">
                      {skill.category}
                    </span>
                    <h4 className="font-bold text-xs text-[var(--text)]">{skill.name}</h4>
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      Level: {skill.level}
                    </span>
                  </div>

                  <button
                    onClick={() => deleteSkill(skill.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-rose-600 rounded-lg transition"
                    title="Delete skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
