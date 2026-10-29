import { apiClient, apiClientUpload } from "@/lib/api-client";
import type { Category, Metadata, Persona, Value } from "./types";

const path = (id: string) => `/personas/${encodeURIComponent(id)}`;
export const personaApi = {
  list: (signal?: AbortSignal) => apiClient<Persona[]>("/personas", { signal }),
  get: (id: string, signal?: AbortSignal) =>
    apiClient<Persona>(path(id), { signal }),
  avatarSnapshot: (id: string) =>
    apiClient<{ data_url: string | null }>(`${path(id)}/avatar/snapshot`),
  create: (body: Metadata) =>
    apiClient<Persona>("/personas", { method: "POST", body }),
  rename: (id: string, body: Metadata) =>
    apiClient<Persona>(path(id), { method: "PUT", body }),
  delete: (id: string) => apiClient(path(id), { method: "DELETE" }),
  personal: (id: string, body: Record<string, Value>) =>
    apiClient<Persona>(`${path(id)}/personal`, { method: "PUT", body }),
  saveEntry: (
    id: string,
    category: Category,
    body: Record<string, Value>,
    itemId?: string,
  ) =>
    apiClient<Persona>(
      `${path(id)}/${category}${itemId ? `/${encodeURIComponent(itemId)}` : ""}`,
      { method: itemId ? "PUT" : "POST", body },
    ),
  deleteEntry: (id: string, category: Category, itemId: string) =>
    apiClient<Persona>(
      `${path(id)}/${category}/${encodeURIComponent(itemId)}`,
      { method: "DELETE" },
    ),
  uploadAvatar: (id: string, file: File) => {
    const body = new FormData();
    body.append("file", file);
    return apiClientUpload<Persona>(`${path(id)}/avatar`, body);
  },
  removeAvatar: (id: string) =>
    apiClient<Persona>(`${path(id)}/avatar`, { method: "DELETE" }),
  uploadCertificate: (id: string, file: File, value: Record<string, Value>) => {
    const body = new FormData();
    body.append("file", file);
    for (const key of [
      "title",
      "category",
      "field",
      "issue_date",
      "expiration_date",
    ]) {
      if (typeof value[key] === "string" && value[key])
        body.append(key, value[key]);
    }
    return apiClientUpload<Persona>(`${path(id)}/certificates/upload`, body);
  },
};
