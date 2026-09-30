export type Certificate = {
  id: string;
  title: string;
  category?: string | null;
  field?: string | null;
  file_url?: string | null;
  file_name?: string | null;
  issue_date?: string | null;
  expiration_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CertificatePayload = Omit<Certificate, "id">;
