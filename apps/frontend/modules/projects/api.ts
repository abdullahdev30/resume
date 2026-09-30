import { apiClient } from "../../lib/api-client";
import type { Project, ProjectPayload } from "./types";

export function listProjects() {
  return apiClient<Project[]>("/profile/projects", { method: "GET" });
}

export function createProject(payload: ProjectPayload) {
  return apiClient<Project>("/profile/projects", {
    method: "POST",
    body: toProjectRequest(payload),
  });
}

export function updateProject(id: string, payload: Partial<ProjectPayload>) {
  return apiClient<Project>(`/profile/projects/${id}`, {
    method: "PUT",
    body: toProjectRequest(payload),
  });
}

export function deleteProject(id: string) {
  return apiClient<{ message: string }>(`/profile/projects/${id}`, { method: "DELETE" });
}

function toProjectRequest(payload: Partial<ProjectPayload>) {
  return {
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.description !== undefined ? { description: payload.description } : {}),
    ...(payload.link !== undefined ? { url: payload.link } : {}),
    ...(payload.github_url !== undefined ? { github_url: payload.github_url } : {}),
    ...(payload.start_date !== undefined ? { start_date: payload.start_date } : {}),
    ...(payload.end_date !== undefined ? { end_date: payload.end_date } : {}),
    ...(payload.technologies !== undefined ? { technologies: payload.technologies } : {}),
    ...(payload.type !== undefined ? { type: payload.type } : {}),
  };
}
