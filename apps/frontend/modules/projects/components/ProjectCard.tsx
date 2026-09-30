import type { Project } from "../types";

export function ProjectCard({ project }: { project: Project }) {
  return <article className="work-surface"><h3>{project.name}</h3><p>{project.description || project.type}</p></article>;
}
