import { apiClient } from "../../lib/api-client";
import type { SocialLink } from "./types";

export function listSocialLinks() {
  return apiClient<SocialLink[]>("/profile/social-links", { method: "GET" });
}
