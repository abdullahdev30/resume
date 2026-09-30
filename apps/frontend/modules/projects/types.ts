export type Project = {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  link?: string | null;
  github_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  technologies?: string[] | null;
};

export type ProjectPayload = Omit<Project, "id">;
