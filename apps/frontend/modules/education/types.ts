export type Education = {
  id: string;
  institute_name: string;
  field_of_study: string;
  start_date: string;
  end_date?: string | null;
  grade?: string | null;
};
