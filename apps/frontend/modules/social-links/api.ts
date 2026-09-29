import { apiClient } from "../../lib/api-client";
import type { SocialLink } from "./types";

export function listSocialLinks() {
  return apiClient<{ social_links: SocialLink[] }>("/profile", { method: "GET" }).then(
    (profile) => profile.social_links || [],
  );
}
