import { apiClient } from "../../lib/api-client";
import type { Certificate, CertificatePayload } from "./types";

export function listCertificates() {
  return apiClient<Certificate[]>("/profile/certificates", { method: "GET" });
}

export function createCertificate(payload: CertificatePayload) {
  return apiClient<Certificate>("/profile/certificates", { method: "POST", body: payload });
}

export function uploadCertificate(payload: {
  title: string;
  category?: string;
  field?: string;
  file: File;
}) {
  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.category) formData.append("category", payload.category);
  if (payload.field) formData.append("field", payload.field);
  formData.append("file", payload.file);
  return apiClient<Certificate>("/profile/certificates/upload", {
    method: "POST",
    body: formData,
  });
}

export function updateCertificate(id: string, payload: Partial<CertificatePayload>) {
  return apiClient<Certificate>(`/profile/certificates/${id}`, { method: "PUT", body: payload });
}

export function deleteCertificate(id: string) {
  return apiClient<{ message: string }>(`/profile/certificates/${id}`, { method: "DELETE" });
}
