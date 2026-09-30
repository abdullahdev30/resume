export type Education = {
  id: string;
  institute_name: string;
  degree?: string | null;
  field_of_study?: string | null;
  start_date: string;
  end_date?: string | null;
  is_current?: boolean | null;
  description?: string | null;
  grade?: string | null;
};

export type EducationPayload = Omit<Education, "id">;
