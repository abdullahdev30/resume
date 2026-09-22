import { apiClient } from "../../lib/api-client";
import type { Certificate } from "./types";

export function listCertificates() {
  return apiClient<Certificate[]>("/profile/certificates", { method: "GET" });
}
