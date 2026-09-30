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
  avatar_url?: string | null;
  social_links?: SocialLinkInput[];
}

export interface PersonalInfo extends PersonalInfoPayload {
  name?: string | null;
  created_at?: string;
  updated_at?: string;
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

export interface OnboardingStatus {
  personal_completed: boolean;
  education_count: number;
  experience_count: number;
  skill_count: number;
  certificate_count: number;
  project_count: number;
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
