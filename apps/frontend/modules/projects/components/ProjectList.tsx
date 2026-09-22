import { ProjectCard } from "./ProjectCard";
import type { Project } from "../types";

export function ProjectList({ items }: { items: Project[] }) {
  return <div>{items.map((project) => <ProjectCard key={project.id} project={project} />)}</div>;
}
