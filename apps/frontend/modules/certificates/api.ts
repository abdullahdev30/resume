import { apiClient } from "../../lib/api-client";
import type { Certificate } from "./types";

export function listCertificates() {
  return apiClient<{ certificates: Certificate[] }>("/profile", { method: "GET" }).then(
    (profile) => profile.certificates || [],
  );
}
