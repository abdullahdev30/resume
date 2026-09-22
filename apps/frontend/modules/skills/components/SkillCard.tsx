import type { Skill } from "../types";

export function SkillCard({ skill }: { skill: Skill }) {
  return <span className="status-tag is-success">{skill.name}</span>;
}
