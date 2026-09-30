import type {
  EducationPayload,
  ExperiencePayload,
  OnboardingStatus,
  PersonalInfoPayload,
  ProfileResponse,
  SkillPayload,
} from "./types";

import { apiClient } from "../../lib/api-client";
import type { Certificate } from "../certificates/types";
import type { Education } from "../education/types";
import type { Experience } from "../experience/types";
import type { Skill } from "../skills/types";

export const profileApi = {
  async getProfile(): Promise<ProfileResponse> {
    return apiClient("/profile", {
      method: "GET",
    });
  },

  async getOnboardingStatus(): Promise<OnboardingStatus> {
    return apiClient("/profile/onboarding-status", {
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
    return apiClient("/profile/education", {
      method: "POST",
      body: payload,
    });
  },

  async addOnboardingExperience(payload: ExperiencePayload) {
    return apiClient("/profile/experience", {
      method: "POST",
      body: payload,
    });
  },

  async addOnboardingSkill(payload: SkillPayload) {
    return apiClient("/profile/skills", {
      method: "POST",
      body: payload,
    });
  },

  async listEducation(): Promise<Education[]> {
    return apiClient("/profile/education", { method: "GET" });
  },

  async listExperience(): Promise<Experience[]> {
    return apiClient("/profile/experience", { method: "GET" });
  },

  async listSkills(): Promise<Skill[]> {
    return apiClient("/profile/skills", { method: "GET" });
  },

  async listCertificates(): Promise<Certificate[]> {
    return apiClient("/profile/certificates", { method: "GET" });
  },

  async addCertificate(payload: {
    name: string;
    issuing_organization?: string;
    credential_id?: string;
    credential_url?: string;
    issue_date?: string;
    expiration_date?: string;
  }): Promise<Certificate> {
    return apiClient("/profile/certificates", {
      method: "POST",
      body: payload,
    });
  },

  async deleteCertificate(id: string): Promise<{ message: string }> {
    return apiClient(`/profile/certificates/${id}`, {
      method: "DELETE",
    });
  },

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClient<{ avatar_url?: string; personal?: { avatar_url?: string } }>("/profile/avatar", {
      method: "POST",
      body: formData,
    });
    const avatarUrl = res.avatar_url || res.personal?.avatar_url;
    if (avatarUrl) {
      localStorage.setItem("user_avatar", avatarUrl);
      return { url: avatarUrl };
    }

    throw new Error("Avatar upload did not return a file URL.");
  },

  async uploadDocument(file: File): Promise<{ id: string; name: string; url: string; size: string; uploadedAt: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("category", "Certificate");

    const res = await apiClient<Certificate>("/profile/certificates/upload", {
      method: "POST",
      body: formData,
    });
    return {
      id: res.id,
      name: res.file_name || file.name,
      url: res.file_url || "",
      size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
      uploadedAt: new Date(res.created_at || Date.now()).toLocaleDateString(),
    };
  },

  async getDocuments(): Promise<Array<{ id: string; name: string; url: string; size: string; uploadedAt: string }>> {
    const certificates = await this.listCertificates();
    return certificates
      .filter((certificate) => certificate.file_name || certificate.file_url)
      .map((certificate) => ({
        id: certificate.id,
        name: certificate.file_name || certificate.title,
        url: certificate.file_url || "",
        size: "Stored",
        uploadedAt: certificate.issue_date || "",
      }));
  },
};
