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

  async uploadAvatar(file: File): Promise<{ url: string }> {
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/profile/avatar`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (response.ok) {
        const res = await response.json();
        const avatarUrl = res.avatar_url || res.personal?.avatar_url;
        if (avatarUrl) {
          localStorage.setItem("user_avatar", avatarUrl);
          return { url: avatarUrl };
        }
      }
    } catch {
      // API fallback
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        localStorage.setItem("user_avatar", dataUrl);
        resolve({ url: dataUrl });
      };
      reader.readAsDataURL(file);
    });
  },

  async uploadDocument(file: File): Promise<{ id: string; name: string; url: string; size: string; uploadedAt: string }> {
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("category", "Profile Document");

    try {
      const response = await fetch(`${API_BASE}/profile/certificates/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (response.ok) {
        const res = await response.json();
        return {
          id: res.id,
          name: res.file_name || file.name,
          url: res.file_url || "",
          size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
          uploadedAt: new Date(res.created_at || Date.now()).toLocaleDateString(),
        };
      }
    } catch {
      // API fallback
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        const docsStr = localStorage.getItem("user_documents") || "[]";
        let docs = [];
        try { docs = JSON.parse(docsStr); } catch { docs = []; }
        
        const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + " MB";
        const newDoc = {
          id: "doc_" + Date.now(),
          name: file.name,
          url: dataUrl,
          size: sizeFormatted,
          uploadedAt: new Date().toLocaleDateString(),
        };
        docs.unshift(newDoc);
        localStorage.setItem("user_documents", JSON.stringify(docs));
        resolve(newDoc);
      };
      reader.readAsDataURL(file);
    });
  },

  getDocuments(): Array<{ id: string; name: string; url: string; size: string; uploadedAt: string }> {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("user_documents") || "[]");
    } catch {
      return [];
    }
  },
};
