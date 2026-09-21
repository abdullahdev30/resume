"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "../../components/button";
import { Input } from "../../components/input";
import type { User } from "../auth/types";
import { profileApi } from "../profile/api";

interface OnboardingFlowProps {
  user: User;
}

type StepId = "personal" | "education" | "experience" | "skills";

const steps: Array<{ id: StepId; title: string }> = [
  { id: "personal", title: "Profile" },
  { id: "education", title: "Education" },
  { id: "experience", title: "Experience" },
  { id: "skills", title: "Skills" },
];
const firstStep = steps[0] as { id: StepId; title: string };

function splitName(name?: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function OnboardingFlow({ user }: OnboardingFlowProps) {
  const router = useRouter();
  const initialName = splitName(user.name);
  const [activeIndex, setActiveIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [personal, setPersonal] = useState({
    first_name: initialName.firstName,
    last_name: initialName.lastName,
    email: user.email,
    phone: user.number || "",
    address: "",
  });
  const [education, setEducation] = useState({
    institute_name: "",
    field_of_study: "",
    start_date: today(),
    end_date: "",
    grade: "",
  });
  const [experience, setExperience] = useState({
    institute_name: "",
    job_title: "",
    start_date: today(),
    end_date: "",
  });
  const [skill, setSkill] = useState("");

  const activeStep = steps[activeIndex] || firstStep;

  const rememberState = (state: "completed" | "skipped") => {
    localStorage.setItem("onboarding_state", state);
    localStorage.setItem(`onboarding_state:${user.id}`, state);
  };

  const goDashboard = (state: "completed" | "skipped") => {
    rememberState(state);
    router.push("/dashboard");
    router.refresh();
  };

  const saveCurrentStep = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (activeStep.id === "personal") {
        await profileApi.upsertPersonal(personal);
      }

      if (
        activeStep.id === "education" &&
        education.institute_name &&
        education.field_of_study
      ) {
        await profileApi.addOnboardingEducation({
          ...education,
          end_date: education.end_date || undefined,
          grade: education.grade || undefined,
        });
      }

      if (
        activeStep.id === "experience" &&
        experience.institute_name &&
        experience.job_title
      ) {
        await profileApi.addOnboardingExperience({
          ...experience,
          end_date: experience.end_date || undefined,
        });
      }

      if (activeStep.id === "skills" && skill.trim()) {
        await profileApi.addOnboardingSkill({ name: skill.trim() });
      }

      if (activeIndex === steps.length - 1) {
        goDashboard("completed");
        return;
      }

      setMessage("Saved. You can continue or skip at any time.");
      setActiveIndex((index) => index + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save onboarding step.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="work-surface onboarding-surface">
      <div className="section-heading">
        <p className="eyebrow">First-time setup</p>
        <h2>Build your resume profile</h2>
        <p>Add the basics now, or skip and fill it from settings later.</p>
      </div>

      <div className="step-tabs" role="tablist" aria-label="Onboarding steps">
        {steps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            className={
              index === activeIndex ? "step-tab is-active" : "step-tab"
            }
            onClick={() => setActiveIndex(index)}
          >
            {step.title}
          </button>
        ))}
      </div>

      {(error || message) && (
        <div className={error ? "notice is-error" : "notice is-success"}>
          {error || message}
        </div>
      )}

      {activeStep.id === "personal" && (
        <div className="form-grid">
          <Input
            label="First name"
            value={personal.first_name}
            onChange={(event) =>
              setPersonal({ ...personal, first_name: event.target.value })
            }
          />
          <Input
            label="Last name"
            value={personal.last_name}
            onChange={(event) =>
              setPersonal({ ...personal, last_name: event.target.value })
            }
          />
          <Input
            label="Email"
            type="email"
            value={personal.email}
            onChange={(event) =>
              setPersonal({ ...personal, email: event.target.value })
            }
          />
          <Input
            label="Phone"
            value={personal.phone}
            onChange={(event) =>
              setPersonal({ ...personal, phone: event.target.value })
            }
          />
          <Input
            label="Address"
            value={personal.address}
            onChange={(event) =>
              setPersonal({ ...personal, address: event.target.value })
            }
            style={{ gridColumn: "1 / -1" }}
          />
        </div>
      )}

      {activeStep.id === "education" && (
        <div className="form-grid">
          <Input
            label="Institute"
            value={education.institute_name}
            onChange={(event) =>
              setEducation({ ...education, institute_name: event.target.value })
            }
          />
          <Input
            label="Field of study"
            value={education.field_of_study}
            onChange={(event) =>
              setEducation({ ...education, field_of_study: event.target.value })
            }
          />
          <Input
            label="Start date"
            type="date"
            value={education.start_date}
            onChange={(event) =>
              setEducation({ ...education, start_date: event.target.value })
            }
          />
          <Input
            label="End date"
            type="date"
            value={education.end_date}
            onChange={(event) =>
              setEducation({ ...education, end_date: event.target.value })
            }
          />
          <Input
            label="Grade"
            value={education.grade}
            onChange={(event) =>
              setEducation({ ...education, grade: event.target.value })
            }
          />
        </div>
      )}

      {activeStep.id === "experience" && (
        <div className="form-grid">
          <Input
            label="Company or institute"
            value={experience.institute_name}
            onChange={(event) =>
              setExperience({
                ...experience,
                institute_name: event.target.value,
              })
            }
          />
          <Input
            label="Job title"
            value={experience.job_title}
            onChange={(event) =>
              setExperience({ ...experience, job_title: event.target.value })
            }
          />
          <Input
            label="Start date"
            type="date"
            value={experience.start_date}
            onChange={(event) =>
              setExperience({ ...experience, start_date: event.target.value })
            }
          />
          <Input
            label="End date"
            type="date"
            value={experience.end_date}
            onChange={(event) =>
              setExperience({ ...experience, end_date: event.target.value })
            }
          />
        </div>
      )}

      {activeStep.id === "skills" && (
        <div className="form-grid">
          <Input
            label="Skill"
            value={skill}
            onChange={(event) => setSkill(event.target.value)}
            placeholder="React, FastAPI, UX writing..."
          />
        </div>
      )}

      <div className="action-row">
        <Button
          type="button"
          variant="outline"
          onClick={() => goDashboard("skipped")}
        >
          Skip
        </Button>
        <Button type="button" onClick={saveCurrentStep} disabled={saving}>
          {activeIndex === steps.length - 1
            ? saving
              ? "Finishing"
              : "Finish"
            : saving
              ? "Saving"
              : "Save and continue"}
        </Button>
      </div>
    </section>
  );
}
