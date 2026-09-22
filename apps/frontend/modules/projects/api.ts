import { apiClient } from "../../lib/api-client";
import type { Project } from "./types";

export function listProjects() {
  return apiClient<Project[]>("/profile/projects", { method: "GET" });
}
