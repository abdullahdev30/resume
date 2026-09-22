import type {
  EducationPayload,
  ExperiencePayload,
  OnboardingStatus,
  PersonalInfoPayload,
  ProfileResponse,
  SkillPayload,
} from "./types";

import { apiClient } from "../../lib/api-client";

export const profileApi = {
  async getProfile(): Promise<ProfileResponse> {
    return apiClient("/profile", {
      method: "GET",
    });
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return apiClient("/profile/onboarding/status", {
      method: "GET",
    });
  },

  async upsertPersonal(payload: PersonalInfoPayload) {
    return apiClient("/profile/personal", {
      method: "PUT",
      body: payload,
    });
  },

  async addOnboardingEducation(payload: EducationPayload) {
    return apiClient("/profile/onboarding/education", {
      method: "POST",
      body: payload,
    });
  },

  async addOnboardingExperience(payload: ExperiencePayload) {
    return apiClient("/profile/onboarding/experience", {
      method: "POST",
      body: payload,
    });
  },

  async addOnboardingSkill(payload: SkillPayload) {
    return apiClient("/profile/onboarding/skills", {
      method: "POST",
      body: payload,
    });
  },
};
