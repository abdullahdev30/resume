import type { PersonalInfo, PersonalInfoPayload, ProfileResponse } from "./types";

import { apiClient, apiClientUpload } from "../../lib/api-client";

export const profileApi = {
  async getProfile(): Promise<ProfileResponse> {
    return apiClient("/profile", {
      method: "GET",
    });
  },

  async upsertPersonal(payload: PersonalInfoPayload): Promise<PersonalInfo> {
    return apiClient<PersonalInfo>("/profile/personal", {
      method: "PUT",
      body: payload,
    });
  },

  async uploadAvatar(
    file: File,
    options?: { onProgress?: (percent: number) => void; signal?: AbortSignal },
  ): Promise<{ url: string; personal: PersonalInfo }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiClientUpload<PersonalInfo>("/profile/avatar", formData, options);
    const avatarUrl = res.avatar_url;
    if (avatarUrl) {
      return { url: avatarUrl, personal: res };
    }

    throw new Error("Avatar upload did not return a file URL.");
  },

};
