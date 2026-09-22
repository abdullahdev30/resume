import { EducationCard } from "./EducationCard";
import type { Education } from "../types";

export function EducationList({ items }: { items: Education[] }) {
  return <div>{items.map((education) => <EducationCard key={education.id} education={education} />)}</div>;
}
