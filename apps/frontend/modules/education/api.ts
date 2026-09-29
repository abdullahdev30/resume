import { apiClient } from "../../lib/api-client";
import type { Education } from "./types";

export function listEducations() {
  return apiClient<{ education: Education[] }>("/profile", { method: "GET" }).then(
    (profile) => profile.education || [],
  );
}
