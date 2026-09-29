import { apiClient } from "../../lib/api-client";
import type { Project } from "./types";

export function listProjects() {
  return apiClient<{ projects: Project[] }>("/profile", { method: "GET" }).then(
    (profile) => profile.projects || [],
  );
}
