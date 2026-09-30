import { apiClient, apiClientUpload } from "../../lib/api-client";
import type { Certificate, CertificatePayload } from "./types";

export function listCertificates() {
  return apiClient<Certificate[]>("/profile/certificates", { method: "GET" });
}

export function createCertificate(payload: CertificatePayload) {
  return apiClient<Certificate>("/profile/certificates", {
    method: "POST",
    body: toCertificateRequest(payload),
  });
}

export function uploadCertificate(payload: {
  title: string;
  category?: string;
  field?: string;
  file: File;
}, options?: { onProgress?: (percent: number) => void; signal?: AbortSignal }) {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.category) formData.append("category", payload.category);
  if (payload.field) formData.append("field", payload.field);
  formData.append("file", payload.file);
  return apiClientUpload<Certificate>("/profile/certificates/upload", formData, options);
}

export function updateCertificate(id: string, payload: Partial<CertificatePayload>) {
  return apiClient<Certificate>(`/profile/certificates/${id}`, {
    method: "PUT",
    body: toCertificateRequest(payload),
  });
}

export function deleteCertificate(id: string) {
  return apiClient<{ message: string }>(`/profile/certificates/${id}`, { method: "DELETE" });
}

function toCertificateRequest(payload: Partial<CertificatePayload>) {
  return {
    ...(payload.title !== undefined ? { name: payload.title } : {}),
    ...(payload.category !== undefined ? { issuing_organization: payload.category } : {}),
    ...(payload.field !== undefined ? { credential_id: payload.field } : {}),
    ...(payload.file_url !== undefined ? { credential_url: payload.file_url } : {}),
    ...(payload.file_name !== undefined ? { file_name: payload.file_name } : {}),
    ...(payload.issue_date !== undefined ? { issue_date: payload.issue_date } : {}),
    ...(payload.expiration_date !== undefined ? { expiration_date: payload.expiration_date } : {}),
  };
}
