import type { Experience } from "../types";

export function ExperienceCard({ experience }: { experience: Experience }) {
  return <article className="work-surface"><h3>{experience.job_title}</h3><p>{experience.institute_name}</p></article>;
}
