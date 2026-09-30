import { apiClient } from "../../lib/api-client";
import type { SocialLink } from "./types";

export function listSocialLinks() {
  return apiClient<SocialLink[]>("/profile/social-links", { method: "GET" });
}

export function createSocialLink(payload: Omit<SocialLink, "id">) {
  return apiClient<SocialLink>("/profile/social-links", {
    method: "POST",
    body: { platform: payload.platform_name, url: payload.profile_url },
  });
}

export function updateSocialLink(id: string, payload: Partial<Omit<SocialLink, "id">>) {
  return apiClient<SocialLink>(`/profile/social-links/${id}`, {
    method: "PUT",
    body: {
      ...(payload.platform_name !== undefined ? { platform: payload.platform_name } : {}),
      ...(payload.profile_url !== undefined ? { url: payload.profile_url } : {}),
    },
  });
}

export function deleteSocialLink(id: string) {
  return apiClient<{ message: string }>(`/profile/social-links/${id}`, { method: "DELETE" });
}
