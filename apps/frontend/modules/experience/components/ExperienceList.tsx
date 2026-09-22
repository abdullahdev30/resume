import { ExperienceCard } from "./ExperienceCard";
import type { Experience } from "../types";

export function ExperienceList({ items }: { items: Experience[] }) {
  return <div>{items.map((experience) => <ExperienceCard key={experience.id} experience={experience} />)}</div>;
}
