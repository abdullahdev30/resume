export type Skill = {
  id: string;
  name: string;
  category?: string | null;
  level?: string | null;
};

export type SkillPayload = Omit<Skill, "id">;
