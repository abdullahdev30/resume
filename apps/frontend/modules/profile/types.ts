export interface SocialLinkInput {
  platform_name: string;
  profile_url: string;
}

export interface PersonalInfoPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city?: string | null;
  professional_title?: string | null;
  summary?: string | null;
  social_links?: SocialLinkInput[];
}

export interface PersonalInfo {
  user_id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  father_name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  avatar_url?: string | null;
  professional_title?: string | null;
  summary?: string | null;
  onboarding_completed?: boolean | null;
  social_links?: import("../social-links/types").SocialLink[];
  created_at?: string | null;
  updated_at?: string | null;
}

export interface EducationPayload {
  institute_name: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  grade?: string;
}

export interface ExperiencePayload {
  institute_name: string;
  job_title: string;
  start_date: string;
  end_date?: string;
}

export interface SkillPayload {
  name: string;
}

export interface ProfileResponse {
  personal: PersonalInfo;
  education: import("../education/types").Education[];
  experience: import("../experience/types").Experience[];
  skills: import("../skills/types").Skill[];
  certificates: import("../certificates/types").Certificate[];
  projects: import("../projects/types").Project[];
  social_links: import("../social-links/types").SocialLink[];
}
