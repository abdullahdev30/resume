export type Category =
  | "education"
  | "experience"
  | "skills"
  | "certificates"
  | "projects"
  | "social_links";
export type Section = "personal" | "address" | "summary" | Category;
export type Value = string | boolean | string[] | null;
export type Entry = Record<string, Value> & { id: string };
export type PersonaData = { personal: Record<string, Value> } & Record<
  Category,
  Entry[]
>;
export interface Persona {
  id: string;
  user_id: string;
  name: string;
  description: string;
  avatar_url: string | null;
  completion: number;
  data: PersonaData;
  created_at: string;
  updated_at: string;
}
export interface Metadata {
  name: string;
  description: string;
  use_account_profile?: boolean;
}
