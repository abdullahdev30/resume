// Stable entry offsets used by editable template fields.
export type ResumeItemOffsets = Partial<
  Record<
    | "skills"
    | "languages"
    | "experience"
    | "education"
    | "projects"
    | "certificates"
    | "socialLinks",
    number
  >
>;
