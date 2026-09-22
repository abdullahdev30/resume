import { SkillCard } from "./SkillCard";
import type { Skill } from "../types";

export function SkillList({ items }: { items: Skill[] }) {
  return <div>{items.map((skill) => <SkillCard key={skill.id} skill={skill} />)}</div>;
}
