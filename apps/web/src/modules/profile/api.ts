import type {
  EducationPayload,
  ExperiencePayload,
  OnboardingStatus,
  PersonalInfoPayload,
  ProfileResponse,
  SkillPayload,
} from "./types";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"
).replace(/\/$/, "");

async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = data.detail;
    const message =
      data.message ||
      detail?.message ||
      (Array.isArray(detail) ? detail[0]?.msg : undefined) ||
      "Something went wrong";
    throw new Error(message);
  }

  return data as T;
}

export const profileApi = {
  async getProfile(): Promise<ProfileResponse> {
    const response = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      credentials: "include",
    });
    return handleResponse(response);
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    const response = await fetch(`${API_BASE}/profile/onboarding/status`, {
      method: "GET",
      credentials: "include",
    });
    return handleResponse(response);
  },

  async upsertPersonal(payload: PersonalInfoPayload) {
    const response = await fetch(`${API_BASE}/profile/personal`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async addOnboardingEducation(payload: EducationPayload) {
    const response = await fetch(`${API_BASE}/profile/onboarding/education`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async addOnboardingExperience(payload: ExperiencePayload) {
    const response = await fetch(`${API_BASE}/profile/onboarding/experience`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },

  async addOnboardingSkill(payload: SkillPayload) {
    const response = await fetch(`${API_BASE}/profile/onboarding/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    return handleResponse(response);
  },
};
