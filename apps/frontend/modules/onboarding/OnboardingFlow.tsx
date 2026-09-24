"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  User as UserIcon,
  Briefcase,
  GraduationCap,
  Wrench,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
} from "lucide-react";

import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import type { User } from "../auth/types";
import { profileApi } from "../profile/api";

interface OnboardingFlowProps {
  user: User;
}

type StepId = "personal" | "experience" | "education" | "skills";

const steps: Array<{ id: StepId; title: string; subtitle: string; icon: any }> = [
  { id: "personal", title: "Personal Details", subtitle: "Your primary contact & bio info", icon: UserIcon },
  { id: "experience", title: "Work Experience", subtitle: "Your most recent role", icon: Briefcase },
  { id: "education", title: "Education", subtitle: "University or degree", icon: GraduationCap },
  { id: "skills", title: "Skills & Keywords", subtitle: "Core technical proficiencies", icon: Wrench },
];

function splitName(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const router = useRouter();
  const initialName = splitName(user.name);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [personal, setPersonal] = useState({
    first_name: initialName.firstName,
    last_name: initialName.lastName,
    email: user.email,
    phone: user.number || "",
    address: "San Francisco, CA",
    job_title: "Full Stack Software Engineer",
  });

  const [experience, setExperience] = useState({
    institute_name: "Apex Tech Inc",
    job_title: "Software Engineer",
    start_date: "2023-01-01",
    end_date: "",
    details: "Built microservices and scalable web dashboards using React & Python.",
  });

  const [education, setEducation] = useState({
    institute_name: "Stanford University",
    field_of_study: "Computer Science",
    start_date: "2019-09-01",
    end_date: "2023-06-01",
    grade: "3.9 GPA",
  });

  const [skillsList, setSkillsList] = useState<string[]>(["React", "TypeScript", "FastAPI", "Tailwind CSS"]);
  const [skillInput, setSkillInput] = useState("");

  const activeStep = (steps[activeIndex] || steps[0])!;

  const rememberState = (state: "completed" | "skipped") => {
    if (typeof window !== "undefined") {
      localStorage.setItem("onboarding_state", state);
      localStorage.setItem(`onboarding_state:${user.id}`, state);
      if (state === "completed") {
        localStorage.setItem(`onboarding_completed:${user.id}`, "true");
      } else {
        localStorage.setItem(`onboarding_skipped:${user.id}`, "true");
      }
    }
  };

  const goDashboard = (state: "completed" | "skipped") => {
    rememberState(state);
    router.push("/dashboard");
    router.refresh();
  };

  const addSkillTag = () => {
    if (skillInput.trim() && !skillsList.includes(skillInput.trim())) {
      setSkillsList([...skillsList, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const removeSkillTag = (tag: string) => {
    setSkillsList(skillsList.filter((s) => s !== tag));
  };

  const saveCurrentStep = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (activeStep.id === "personal") {
        await profileApi.upsertPersonal(personal);
      }

      if (activeStep.id === "experience" && experience.institute_name && experience.job_title) {
        await profileApi.addOnboardingExperience({
          institute_name: experience.institute_name,
          job_title: experience.job_title,
          start_date: experience.start_date,
          end_date: experience.end_date || undefined,
        });
      }

      if (activeStep.id === "education" && education.institute_name && education.field_of_study) {
        await profileApi.addOnboardingEducation({
          institute_name: education.institute_name,
          field_of_study: education.field_of_study,
          start_date: education.start_date,
          end_date: education.end_date || undefined,
          grade: education.grade || undefined,
        });
      }

      if (activeStep.id === "skills") {
        for (const sk of skillsList) {
          await profileApi.addOnboardingSkill({ name: sk }).catch(() => null);
        }
      }

      if (activeIndex === steps.length - 1) {
        goDashboard("completed");
        return;
      }

      setMessage("Saved! Continue to next step.");
      setActiveIndex((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save step.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Onboarding Wizard Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Step {activeIndex + 1} of 4 • Initial Onboarding Setup</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Build Your Resume Profile
          </h1>
          <p className="text-blue-100 text-sm">
            This setup runs only once after registration. You can edit your profile anytime in Settings.
          </p>
        </div>

        <button
          onClick={() => goDashboard("skipped")}
          className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition border border-white/20"
        >
          Skip Setup for Now
        </button>
      </div>

      {/* Progress Bar & Step Indicator */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeIndex;
          const isDone = idx < activeIndex;

          return (
            <button
              key={step.id}
              onClick={() => setActiveIndex(idx)}
              className={`p-4 rounded-2xl border text-left transition flex items-center space-x-3 ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                  : isDone
                    ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                  isActive
                    ? "bg-white/20 text-white"
                    : isDone
                      ? "bg-emerald-200 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                }`}
              >
                {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-700" /> : <Icon className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{step.title}</p>
                <p
                  className={`text-[11px] truncate ${
                    isActive ? "text-blue-100" : isDone ? "text-emerald-700" : "text-slate-400"
                  }`}
                >
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Step Form Box */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>{activeStep.title}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">{activeStep.subtitle}</p>
          </div>

          {error && <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium">{error}</div>}
          {message && <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium">{message}</div>}

          {/* Active Step Content */}
          {activeStep.id === "personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={personal.first_name}
                onChange={(e) => setPersonal({ ...personal, first_name: e.target.value })}
              />
              <Input
                label="Last Name"
                value={personal.last_name}
                onChange={(e) => setPersonal({ ...personal, last_name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={personal.email}
                onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              />
              <Input
                label="Phone Number"
                value={personal.phone}
                onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
              />
              <div className="md:col-span-2">
                <Input
                  label="Job Title / Professional Headline"
                  value={personal.job_title}
                  onChange={(e) => setPersonal({ ...personal, job_title: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeStep.id === "experience" && (
            <div className="space-y-4">
              <Input
                label="Company or Organization"
                value={experience.institute_name}
                onChange={(e) => setExperience({ ...experience, institute_name: e.target.value })}
              />
              <Input
                label="Job Title"
                value={experience.job_title}
                onChange={(e) => setExperience({ ...experience, job_title: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={experience.start_date}
                  onChange={(e) => setExperience({ ...experience, start_date: e.target.value })}
                />
                <Input
                  label="End Date (Leave blank if present)"
                  type="date"
                  value={experience.end_date}
                  onChange={(e) => setExperience({ ...experience, end_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeStep.id === "education" && (
            <div className="space-y-4">
              <Input
                label="University / Institution Name"
                value={education.institute_name}
                onChange={(e) => setEducation({ ...education, institute_name: e.target.value })}
              />
              <Input
                label="Degree / Field of Study"
                value={education.field_of_study}
                onChange={(e) => setEducation({ ...education, field_of_study: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start Date"
                  type="date"
                  value={education.start_date}
                  onChange={(e) => setEducation({ ...education, start_date: e.target.value })}
                />
                <Input
                  label="End Date / Graduation"
                  type="date"
                  value={education.end_date}
                  onChange={(e) => setEducation({ ...education, end_date: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeStep.id === "skills" && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="e.g. React, Python, Product Management"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkillTag())}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={addSkillTag}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-xl text-xs"
                >
                  Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-1.5"
                  >
                    <span>{skill}</span>
                    <button type="button" onClick={() => removeSkillTag(skill)} className="text-blue-400 hover:text-blue-800 font-bold">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => i - 1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition flex items-center space-x-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <Button type="button" onClick={saveCurrentStep} disabled={saving}>
              {activeIndex === steps.length - 1 ? (
                saving ? "Finishing..." : "Complete & Open Dashboard"
              ) : (
                <span className="flex items-center space-x-1.5">
                  <span>{saving ? "Saving..." : "Save & Next"}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Live Mini Resume Card Preview */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300">Live Resume Preview</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <h4 className="text-lg font-bold text-white leading-snug">
                {personal.first_name || "First"} {personal.last_name || "Last"}
              </h4>
              <p className="text-blue-400 text-xs font-medium">{personal.job_title || "Job Title"}</p>
              <p className="text-slate-400 text-[11px] mt-1">{personal.email} • {personal.phone}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Work History</h5>
              <p className="font-semibold text-slate-200">{experience.job_title || "Software Developer"}</p>
              <p className="text-[11px] text-slate-400">{experience.institute_name || "Company"}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-1">Education</h5>
              <p className="font-semibold text-slate-200">{education.field_of_study || "Degree"}</p>
              <p className="text-[11px] text-slate-400">{education.institute_name}</p>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[10px] uppercase font-bold text-slate-400 mb-2">Skills</h5>
              <div className="flex flex-wrap gap-1">
                {skillsList.map((sk) => (
                  <span key={sk} className="text-[10px] bg-slate-800 text-blue-300 px-2 py-0.5 rounded">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
