export type Experience = {
  id: string;
  company_name?: string | null;
  institute_name?: string | null;
  job_title: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
};

export type ExperiencePayload = {
  company_name?: string | null;
  institute_name?: string | null;
  job_title: string;
  location?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
};
